import React, { createContext, useState, useEffect, useRef, useCallback } from 'react';
import apiClient, { getStoredAvatar, setStoredAvatar } from '../lib/apiClient';
import { useLmsStore } from '../stores/lmsStore';
import { supabase, isSupabaseConfigured } from '../config/supabase';
import { sendPasswordResetEmail, updateAccountPassword } from '../services/userService';

export const AuthContext = createContext(undefined);

const SESSION_SECURITY_KEY = '_lms_session_security';
const IDLE_TIMEOUT_SECONDS = 3600; // 60 minutes of inactivity auto-logout for browser security

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Session Security & Timing State
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [sessionDurationSeconds, setSessionDurationSeconds] = useState(0);
  const [sessionExpiresIn, setSessionExpiresIn] = useState(IDLE_TIMEOUT_SECONDS);
  const [isSessionExpiringSoon, setIsSessionExpiringSoon] = useState(false);

  const lastActivityRef = useRef(Date.now());
  const timerRef = useRef(null);

  // Helper to format seconds into HH:MM:SS
  const formatDuration = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0')
    ].join(':');
  };

  const sessionDuration = formatDuration(sessionDurationSeconds);

  // Initialize or reset session security timer
  const initSessionSecurity = useCallback((existingStartTime = null) => {
    const start = existingStartTime || Date.now();
    setSessionStartTime(start);
    lastActivityRef.current = Date.now();
    localStorage.setItem(SESSION_SECURITY_KEY, JSON.stringify({
      startTime: start,
      lastActive: Date.now()
    }));
  }, []);

  const clearSessionSecurity = useCallback(() => {
    setSessionStartTime(null);
    setSessionDurationSeconds(0);
    setSessionExpiresIn(IDLE_TIMEOUT_SECONDS);
    setIsSessionExpiringSoon(false);
    localStorage.removeItem(SESSION_SECURITY_KEY);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const extendSession = useCallback(() => {
    lastActivityRef.current = Date.now();
    setSessionExpiresIn(IDLE_TIMEOUT_SECONDS);
    setIsSessionExpiringSoon(false);
    const existing = localStorage.getItem(SESSION_SECURITY_KEY);
    if (existing) {
      try {
        const parsed = JSON.parse(existing);
        parsed.lastActive = Date.now();
        localStorage.setItem(SESSION_SECURITY_KEY, JSON.stringify(parsed));
      } catch (_) {}
    }
  }, []);

  // Initialize and verify authentication state on app boot
  useEffect(() => {
    let isMounted = true;

    const initAuthSession = async () => {
      try {
        const { data } = await apiClient.auth.me();
        if (isMounted) {
          if (data?.user) {
            setUser(data.user);
            setSession(data.session);
            
            // Restore session timing
            const storedSecurity = localStorage.getItem(SESSION_SECURITY_KEY);
            if (storedSecurity) {
              try {
                const parsed = JSON.parse(storedSecurity);
                initSessionSecurity(parsed.startTime || Date.now());
              } catch (_) {
                initSessionSecurity();
              }
            } else {
              initSessionSecurity();
            }

            useLmsStore.getState().syncFromSupabase(data.user);
            useLmsStore.getState().subscribeToRealtime(data.user);
          } else {
            setUser(null);
            setSession(null);
            clearSessionSecurity();
            useLmsStore.getState().syncFromSupabase(null);
            useLmsStore.getState().subscribeToRealtime(null);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (isMounted) {
          setUser(null);
          setSession(null);
          clearSessionSecurity();
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuthSession();

    // Supabase Real-time Auth State Change Listener
    let authListener = null;
    if (isSupabaseConfigured && supabase?.auth?.onAuthStateChange) {
      try {
        const { data: listener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
          if (!isMounted) return;
          console.log('[Supabase Auth Event]:', event);

          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            if (newSession?.user) {
              setSession(newSession);
              // Safely refresh user profile
              const meRes = await apiClient.auth.me();
              if (meRes.data?.user) {
                setUser(meRes.data.user);
                initSessionSecurity();
                useLmsStore.getState().syncFromSupabase(meRes.data.user);
                useLmsStore.getState().subscribeToRealtime(meRes.data.user);
              }
            }
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setSession(null);
            clearSessionSecurity();
            useLmsStore.getState().syncFromSupabase(null);
            useLmsStore.getState().subscribeToRealtime(null);
          }
        });
        authListener = listener;
      } catch (e) {
        console.warn('Could not register onAuthStateChange listener:', e);
      }
    }

    return () => {
      isMounted = false;
      if (authListener?.subscription?.unsubscribe) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [initSessionSecurity, clearSessionSecurity]);

  // Session Duration Tick & Inactivity Enforcement
  useEffect(() => {
    if (!user) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // 1-second interval timer for live session duration tracking & instant revocation enforcement
    timerRef.current = setInterval(() => {
      const now = Date.now();
      const start = sessionStartTime || now;
      const elapsedSeconds = Math.max(0, Math.floor((now - start) / 1000));
      setSessionDurationSeconds(elapsedSeconds);

      const userEmail = (user.email || '').toLowerCase().trim();
      const isAdmin = userEmail === 'admin@gmail.com' || (user.role || '').toLowerCase() === 'admin';

      // ─── ADMIN IMMUNITY: The primary system administrator is NEVER revoked or suspended ───
      if (isAdmin) {
        return;
      }

      // 1. Check if user is suspended in memory
      if (user.status === 'suspended') {
        console.warn('[Session Security] User status is suspended. Forcing logout.');
        signOut();
        window.location.href = '/login?suspended=true';
        return;
      }

      // 2. Check if user account was deleted or revoked by admin
      try {
        const revokedRaw = localStorage.getItem('_lms_revoked_users');
        if (revokedRaw) {
          const revokedUsers = JSON.parse(revokedRaw);
          const isRevoked = revokedUsers.some(
            (r) => (user.id && r.id === user.id) || (userEmail && (r.email || '').toLowerCase().trim() === userEmail)
          );
          // Only enforce local blacklist if user is not verified active in current session
          if (isRevoked && user.status === 'suspended') {
            console.warn('[Session Security] User account has been removed by admin. Forcing instant logout.');
            signOut();
            window.location.href = '/login?revoked=true';
            return;
          }
        }
      } catch (_) {}

      // 3. Check if user was explicitly suspended or deleted in registered users registry
      try {
        const regRaw = localStorage.getItem('_lms_registered_users');
        if (regRaw) {
          const registered = JSON.parse(regRaw);
          const found = registered.find(
            (u) => (user.id && u.id === user.id) || (userEmail && (u.email || '').toLowerCase().trim() === userEmail)
          );
          if (found && (found.status === 'suspended' || found.is_deleted)) {
            console.warn('[Session Security] User status changed to suspended in registry. Forcing instant logout.');
            signOut();
            window.location.href = '/login?suspended=true';
            return;
          }
          // Only in mock offline mode without Supabase does absence from registered_users indicate removal
          if (!isSupabaseConfigured && !found) {
            console.warn('[Session Security] User no longer in mock registry. Forcing instant logout.');
            signOut();
            window.location.href = '/login?revoked=true';
            return;
          }
        }
      } catch (_) {}

      // 4. Periodic server verification (every 10s)
      if (elapsedSeconds > 0 && elapsedSeconds % 10 === 0) {
        apiClient.auth.me().then((res) => {
          if (!res.data?.user) {
            console.warn('[Session Security] Periodic session validation failed. User removed or invalid.');
            signOut();
            window.location.href = '/login?revoked=true';
          }
        }).catch(() => {});
      }

      // Check idle inactivity
      const idleSeconds = Math.floor((now - lastActivityRef.current) / 1000);
      const remainingSeconds = Math.max(0, IDLE_TIMEOUT_SECONDS - idleSeconds);
      setSessionExpiresIn(remainingSeconds);

      // Warning when < 5 minutes (300s) remain
      setIsSessionExpiringSoon(remainingSeconds <= 300 && remainingSeconds > 0);

      // Auto logout on inactivity threshold
      if (remainingSeconds <= 0) {
        console.warn('[Session Security] Inactivity threshold reached. Enforcing auto-logout.');
        signOut();
      }
    }, 1000);

    // Realtime Supabase channel for profile deletion/suspension events
    let realtimeProfileChannel = null;
    if (isSupabaseConfigured && supabase?.channel) {
      try {
        realtimeProfileChannel = supabase
          .channel(`auth-user-monitor-${user.id || 'curr'}-${Date.now()}`)
          .on(
            'postgres_changes',
            { event: 'DELETE', schema: 'public', table: 'profiles' },
            (payload) => {
              const myEmail = (user?.email || '').toLowerCase().trim();
              if (myEmail === 'admin@gmail.com' || (user?.role || '').toLowerCase() === 'admin') return;
              const oldId = payload.old?.id;
              const oldEmail = (payload.old?.email || '').toLowerCase().trim();
              if ((oldId && oldId === user?.id) || (oldEmail && oldEmail === myEmail)) {
                console.warn('[Realtime Security] Profile deleted from Supabase. Immediate session termination.');
                signOut();
                window.location.href = '/login?revoked=true';
              }
            }
          )
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'profiles' },
            (payload) => {
              const myEmail = (user?.email || '').toLowerCase().trim();
              if (myEmail === 'admin@gmail.com' || (user?.role || '').toLowerCase() === 'admin') return;
              const newId = payload.new?.id;
              const newEmail = (payload.new?.email || '').toLowerCase().trim();
              if ((newId && newId === user?.id) || (newEmail && newEmail === myEmail)) {
                if (payload.new?.status === 'suspended') {
                  console.warn('[Realtime Security] Profile suspended in Supabase. Immediate session termination.');
                  signOut();
                  window.location.href = '/login?suspended=true';
                }
              }
            }
          )
          .subscribe();
      } catch (err) {
        console.warn('Realtime profile channel error:', err);
      }
    }

    // Revocation event listeners for real-time multi-tab session termination
    const handleRevocationEvent = (e) => {
      const userEmail = (user?.email || '').toLowerCase().trim();
      const isAdmin = userEmail === 'admin@gmail.com' || (user?.role || '').toLowerCase() === 'admin';
      if (isAdmin) return; // Admin is immune

      const revokedId = e?.detail?.userId;
      const revokedEmail = e?.detail?.email;
      let isTarget = false;

      if (revokedId && user?.id === revokedId) isTarget = true;
      if (revokedEmail && user?.email?.toLowerCase() === revokedEmail.toLowerCase()) isTarget = true;

      try {
        const revokedRaw = localStorage.getItem('_lms_revoked_users');
        if (revokedRaw) {
          const revokedUsers = JSON.parse(revokedRaw);
          if (revokedUsers.some((r) => (user?.id && r.id === user.id) || (user?.email && r.email?.toLowerCase() === user.email.toLowerCase()))) {
            isTarget = true;
          }
        }
      } catch (_) {}

      if (isTarget) {
        console.warn('[AuthContext] Active session revoked by administrator. Terminating session.');
        signOut();
        window.location.href = '/login?revoked=true';
      }
    };

    // Re-verify session integrity on window focus (detects server-side deletion)
    const handleFocusCheck = async () => {
      if (!user) return;
      const userEmail = (user?.email || '').toLowerCase().trim();
      const isAdmin = userEmail === 'admin@gmail.com' || (user?.role || '').toLowerCase() === 'admin';
      if (isAdmin) return; // Admin is immune

      try {
        const meRes = await apiClient.auth.me();
        if (!meRes.data?.user) {
          console.warn('[AuthContext] Session verification failed on focus. User removed from database.');
          signOut();
          window.location.href = '/login?revoked=true';
        }
      } catch (_) {}
    };

    window.addEventListener('lms_user_revoked', handleRevocationEvent);
    window.addEventListener('storage', handleRevocationEvent);
    window.addEventListener('focus', handleFocusCheck);

    // Track user interactions (throttled to once every 10s)
    let lastThrottledTime = 0;
    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastThrottledTime > 10000) {
        lastThrottledTime = now;
        lastActivityRef.current = now;
      }
    };

    window.addEventListener('mousemove', handleUserActivity, { passive: true });
    window.addEventListener('keydown', handleUserActivity, { passive: true });
    window.addEventListener('mousedown', handleUserActivity, { passive: true });
    window.addEventListener('touchstart', handleUserActivity, { passive: true });
    window.addEventListener('scroll', handleUserActivity, { passive: true });

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (realtimeProfileChannel) {
        try { supabase.removeChannel(realtimeProfileChannel); } catch (_) {}
      }
      window.removeEventListener('lms_user_revoked', handleRevocationEvent);
      window.removeEventListener('storage', handleRevocationEvent);
      window.removeEventListener('focus', handleFocusCheck);
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('mousedown', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
    };
  }, [user, sessionStartTime]);

  /**
   * POST /api/auth/login
   */
  const signIn = async (email, password) => {
    try {
      const res = await apiClient.auth.login({ email, password });
      if (res.data?.user) {
        setUser(res.data.user);
        setSession(res.data.session);
        initSessionSecurity();
        useLmsStore.getState().syncFromSupabase(res.data.user);
        useLmsStore.getState().subscribeToRealtime(res.data.user);
        return { success: true, user: res.data.user, role: res.data.user.role };
      }
      return { success: false, error: res.error || 'Invalid credentials.' };
    } catch (err) {
      return { success: false, error: err.message || 'Login error occurred.' };
    }
  };

  /**
   * POST /api/auth/signup
   * Public registration (always creates role = 'USER')
   */
  const signUp = async (email, password, fullName, role = 'user') => {
    try {
      const res = await apiClient.auth.signup({ fullName, email, password, role });
      if (res.data?.user) {
        setUser(res.data.user);
        setSession(res.data.session);
        initSessionSecurity();
        useLmsStore.getState().syncFromSupabase(res.data.user);
        useLmsStore.getState().subscribeToRealtime(res.data.user);
        return { success: true, user: res.data.user, role: res.data.user.role, message: 'Account created successfully!' };
      }
      return { success: false, error: res.error || 'Registration failed.' };
    } catch (err) {
      return { success: false, error: err.message || 'Signup error occurred.' };
    }
  };

  /**
   * POST /api/auth/logout
   */
  const signOut = async () => {
    try {
      await apiClient.auth.logout();
    } catch (_) {}
    setUser(null);
    setSession(null);
    clearSessionSecurity();
    useLmsStore.getState().syncFromSupabase(null);
    useLmsStore.getState().subscribeToRealtime(null);
    return { success: true };
  };

  const updateProfile = async (fullNameOrObj, avatarUrlArg) => {
    if (!user) return { success: false, error: 'No active session.' };
    const payload = typeof fullNameOrObj === 'object'
      ? fullNameOrObj
      : { fullName: fullNameOrObj, avatarUrl: avatarUrlArg };

    const res = await apiClient.user.updateProfile(user.id, payload);
    if (res.data) {
      const targetAvatar = payload.avatarUrl !== undefined
        ? payload.avatarUrl
        : (res.data?.avatar_url || getStoredAvatar(user.id, user.email) || user.avatarUrl || '');

      const updatedUser = {
        ...user,
        ...payload,
        fullName: payload.fullName || res.data?.full_name || user.fullName,
        avatarUrl: targetAvatar,
        bio: payload.bio || res.data?.bio || user.bio,
        location: payload.location || res.data?.location || user.location,
        phone: payload.phone || res.data?.phone || user.phone,
        learningGoal: payload.learningGoal || res.data?.learning_goal || user.learningGoal
      };

      setStoredAvatar(user.id, user.email, targetAvatar);
      setUser(updatedUser);
      localStorage.setItem('_lms_current_session', JSON.stringify(updatedUser));
      return { success: true };
    }
    return { success: false, error: res.error || 'Failed to update profile.' };
  };

  const role = user?.role || null;
  const authenticated = Boolean(user);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        session,
        authenticated,
        loading,
        sessionStartTime,
        sessionDuration,
        sessionDurationSeconds,
        sessionExpiresIn,
        isSessionExpiringSoon,
        extendSession,
        signIn,
        signUp,
        signOut,
        updateProfile,
        updatePassword: (newPassword) => updateAccountPassword(newPassword),
        resetPasswordForEmail: (email) => sendPasswordResetEmail(email)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
