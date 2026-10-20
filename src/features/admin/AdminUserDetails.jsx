import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import apiClient from '../../lib/apiClient';
import {
  User,
  Shield,
  Mail,
  Calendar,
  BookOpen,
  DollarSign,
  ArrowLeft,
  CheckCircle,
  Ban,
  Trash2,
  Lock
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

export const AdminUserDetails = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentAdmin } = useAuth();
  const { success, error } = useToast();

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchUserDetails = async () => {
      const res = await apiClient.admin.getUser(userId, currentAdmin);
      if (isMounted) {
        if (res.data) {
          setUserData(res.data);
        } else {
          error(res.error || 'Failed to load user details.');
        }
        setLoading(false);
      }
    };
    fetchUserDetails();
    return () => { isMounted = false; };
  }, [userId, currentAdmin]);

  const handleRoleToggle = async () => {
    if (!userData?.profile) return;
    const newRole = userData.profile.role === 'admin' ? 'user' : 'admin';
    setUpdating(true);
    const res = await apiClient.admin.updateUser(userId, { role: newRole }, currentAdmin);
    setUpdating(false);

    if (res.data) {
      success(`Updated user role to ${newRole.toUpperCase()}`);
      setUserData({ ...userData, profile: { ...userData.profile, role: newRole } });
    } else {
      error(res.error || 'Failed to update role.');
    }
  };

  const handleStatusToggle = async () => {
    if (!userData?.profile) return;
    const newStatus = userData.profile.status === 'suspended' ? 'active' : 'suspended';
    setUpdating(true);
    const res = await apiClient.admin.updateUser(userId, { status: newStatus }, currentAdmin);
    setUpdating(false);

    if (res.data) {
      success(`Updated status to ${newStatus.toUpperCase()}`);
      setUserData({ ...userData, profile: { ...userData.profile, status: newStatus } });
    } else {
      error(res.error || 'Failed to update status.');
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-sans">
        Loading user account details...
      </div>
    );
  }

  const profile = userData?.profile;

  if (!profile) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold">User Not Found</h2>
        <Button onClick={() => navigate('/admin/users')}>Back to Roster</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto font-sans">
      <div className="flex items-center justify-between">
        <Link to="/admin/users" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#202124]">
          <ArrowLeft className="h-4 w-4" /> Back to Users Roster
        </Link>

        <Badge variant={profile.role === 'admin' ? 'primary' : 'outline'} className="text-xs px-3 py-1 font-black">
          {profile.role?.toUpperCase()}
        </Badge>
      </div>

      {/* User Header Profile Card */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-slate-900 text-white font-black text-2xl flex items-center justify-center shadow-lg">
            {profile.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-2xl font-black text-[#202124]">{profile.full_name || 'LMS User'}</h2>
            <div className="flex items-center gap-4 text-xs text-slate-500 mt-1 font-medium">
              <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {profile.email}</span>
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Enrolled {new Date(profile.created_at || Date.now()).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRoleToggle}
            isLoading={updating}
            className="text-xs font-black rounded-2xl h-10 border-slate-300"
            leftIcon={<Shield className="h-4 w-4 text-primary" />}
          >
            Switch to {profile.role === 'admin' ? 'USER' : 'ADMIN'}
          </Button>

          <Button
            variant={profile.status === 'suspended' ? 'success' : 'outline'}
            size="sm"
            onClick={handleStatusToggle}
            isLoading={updating}
            className="text-xs font-black rounded-2xl h-10"
            leftIcon={profile.status === 'suspended' ? <CheckCircle className="h-4 w-4" /> : <Ban className="h-4 w-4 text-rose-500" />}
          >
            {profile.status === 'suspended' ? 'Reactivate User' : 'Suspend Account'}
          </Button>
        </div>
      </div>

      {/* Enrollments & Payment History Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Enrollments */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-md space-y-4">
          <h3 className="text-sm font-black uppercase text-[#202124] flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" /> Active Program Enrollments ({userData.enrollments?.length || 0})
          </h3>
          <div className="space-y-2">
            {userData.enrollments?.length > 0 ? (
              userData.enrollments.map((en, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs font-bold">
                  <span>{en.courses?.title || 'Fitness Blueprint'}</span>
                  <span className="text-slate-400 font-normal">{new Date(en.enrolled_at).toLocaleDateString()}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic">No course enrollments on record.</p>
            )}
          </div>
        </div>

        {/* Payments */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-md space-y-4">
          <h3 className="text-sm font-black uppercase text-[#202124] flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-600" /> Payment Audit History ({userData.payments?.length || 0})
          </h3>
          <div className="space-y-2">
            {userData.payments?.length > 0 ? (
              userData.payments.map((p, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs font-bold">
                  <span>{p.course_title || 'Course Access'}</span>
                  <span className="text-emerald-600 font-black">₹{p.amount}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic">No payment transactions found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUserDetails;
