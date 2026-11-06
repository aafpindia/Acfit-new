import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Play, Pause, Maximize, Volume2, VolumeX, AlertTriangle, RefreshCw } from 'lucide-react';
import Hls from 'hls.js';
import { Card } from '../../../components/ui/card';
import {
  getHlsUrl,
  getEmbedUrl,
  getDirectPlayUrl,
  getBunnyVideoId,
  isValidBunnyVideoId,
} from '../../../services/bunnyService';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const ytRegex = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;

function getYouTubeEmbedUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const m = url.match(ytRegex);
  if (!m || m[2].length !== 11) return null;
  const origin = typeof window !== 'undefined' && window.location.origin ? encodeURIComponent(window.location.origin) : '';
  return `https://www.youtube.com/embed/${m[2]}?autoplay=0&rel=0&enablejsapi=1&origin=${origin}`;
}

function getBunnyEmbedUrl(url, bunnyId) {
  if (bunnyId && isValidBunnyVideoId(bunnyId)) {
    return getEmbedUrl(bunnyId);
  }
  if (!url || typeof url !== 'string') return null;
  const t = url.trim();
  if (t.includes('iframe.mediadelivery.net/embed/')) {
    return t;
  }
  // If the URL contains a Bunny UUID or points to b-cdn.net, generate the official Iframe Embed
  const match = t.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  if (match && (t.includes('b-cdn.net') || t.includes('mediadelivery.net') || t.includes('playlist.m3u8'))) {
    return getEmbedUrl(match[0]);
  }
  return null;
}

function resolvePlayableUrl(rawUrl, rawBunnyId) {
  if (rawUrl) {
    const t = rawUrl.trim();
    if (t.includes('youtube.com') || t.includes('youtu.be')) return null;
    if (t.includes('iframe.mediadelivery.net/embed/')) return null;

    if (
      t.startsWith('http://') ||
      t.startsWith('https://') ||
      t.startsWith('blob:')
    ) {
      return t;
    }
  }

  if (rawBunnyId) return getHlsUrl(rawBunnyId);
  return null; // no URL — player will show empty state
}

function formatTime(s) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec < 10 ? '0' : ''}${sec}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// VideoPlayer
// ─────────────────────────────────────────────────────────────────────────────
export const VideoPlayer = ({ content = {}, onComplete }) => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const completedRef = useRef(false);
  const currentUrlRef = useRef(null);
  const iframeRef = useRef(null);
  const ytPlayerRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [playbackError, setPlaybackError] = useState(null);
  const [forcedBunnyEmbedUrl, setForcedBunnyEmbedUrl] = useState(null);

  // ── Normalise content ──
  const mediaObj = useMemo(
    () => (typeof content === 'string' ? { videoUrl: content } : content || {}),
    [content]
  );

  const rawVideoUrl = useMemo(
    () =>
      mediaObj._blobPreview ||
      mediaObj.videoUrl ||
      mediaObj.url ||
      mediaObj.fileUrl ||
      mediaObj.src ||
      '',
    [mediaObj]
  );

  const rawBunnyId = useMemo(() => {
    const candidate =
      getBunnyVideoId(mediaObj) ||
      mediaObj.bunnyVideoId ||
      mediaObj.bunny_video_id ||
      mediaObj.guid;
    return isValidBunnyVideoId(candidate) ? candidate : null;
  }, [mediaObj]);

  const youtubeEmbedUrl = useMemo(
    () => getYouTubeEmbedUrl(rawVideoUrl),
    [rawVideoUrl]
  );

  const bunnyEmbedUrl = useMemo(
    () => forcedBunnyEmbedUrl || getBunnyEmbedUrl(rawVideoUrl, rawBunnyId),
    [forcedBunnyEmbedUrl, rawVideoUrl, rawBunnyId]
  );

  const playableVideoUrl = useMemo(
    () => (youtubeEmbedUrl || bunnyEmbedUrl ? null : resolvePlayableUrl(rawVideoUrl, rawBunnyId)),
    [youtubeEmbedUrl, bunnyEmbedUrl, rawVideoUrl, rawBunnyId]
  );

  const isHlsUrl = useMemo(
    () => Boolean(playableVideoUrl?.includes('.m3u8')),
    [playableVideoUrl]
  );

  // ── Attach HLS / native src ──
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !playableVideoUrl) return;

    // Prevent re-initialising identical source to prevent player blinking / stutter
    if (currentUrlRef.current === playableVideoUrl) return;
    currentUrlRef.current = playableVideoUrl;

    completedRef.current = false;
    setIsPlaying(false);
    setCurrentTime(0);
    setProgressPercent(0);
    setPlaybackError(null);

    let retryAttempts = 0;

    // Destroy previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (isHlsUrl) {
      if (Hls.isSupported()) {
        video.removeAttribute('src');
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
          maxBufferLength: 30,
          maxMaxBufferLength: 600,
          startLevel: -1, // auto quality selection
          abrEwmaDefaultEstimate: 5000000,
        });

        hls.loadSource(playableVideoUrl);
        hls.attachMedia(video);

        // Resilient error recovery with capped retries
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                // Check if this stream is from Bunny with CORS / HTTP 403: seamlessly switch to official Iframe Embed
                {
                  const uuidMatch = playableVideoUrl?.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
                  if (uuidMatch && (playableVideoUrl?.includes('b-cdn.net') || playableVideoUrl?.includes('playlist.m3u8'))) {
                    console.log('[VideoPlayer] Direct HLS blocked by CORS; auto-switching to Bunny Stream Iframe Embed:', uuidMatch[0]);
                    setForcedBunnyEmbedUrl(getEmbedUrl(uuidMatch[0]));
                    hls.destroy();
                    return;
                  }
                }
                retryAttempts += 1;
                console.warn(`HLS Network error (attempt ${retryAttempts}/2):`, data.details);
                if (retryAttempts <= 2) {
                  setTimeout(() => {
                    if (hlsRef.current) hlsRef.current.startLoad();
                  }, 1500);
                } else {
                  console.error('Fatal HLS Network error, halting retry loop:', data.details, playableVideoUrl);
                  setPlaybackError({
                    title: 'Video Stream Unavailable',
                    message: data.details === 'manifestLoadError'
                      ? 'The video stream could not be loaded from Bunny CDN (HTTP 403 Forbidden / Domain suspended or CORS issue). Please verify your Bunny CDN library status and domain settings.'
                      : 'A network error interrupted the video stream.',
                    url: playableVideoUrl,
                  });
                  hls.destroy();
                }
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.warn('HLS Media error, attempting recovery...', data.details);
                hls.recoverMediaError();
                break;
              default:
                console.error('Fatal unrecoverable HLS error:', data);
                setPlaybackError({
                  title: 'Playback Error',
                  message: 'A fatal player error occurred while playing this video stream.',
                  url: playableVideoUrl,
                });
                hls.destroy();
                break;
            }
          }
        });

        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari native HLS
        video.src = playableVideoUrl;
        video.load();
      }
    } else {
      // Direct MP4 / Blob URL
      video.src = playableVideoUrl;
      video.load();
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [playableVideoUrl, isHlsUrl]);

  // ── Controls ──
  const handlePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused || video.ended) {
      video.play().catch((e) => console.warn('Play interrupted:', e));
    } else {
      video.pause();
    }
  }, []);

  const handleToggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const cur = video.currentTime;
    const dur = video.duration || 0;
    setCurrentTime(cur);
    setDuration(dur);
    if (dur > 0) {
      setProgressPercent((cur / dur) * 100);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (video && video.duration && !isNaN(video.duration)) {
      setDuration(video.duration);
    }
  }, []);

  const handlePlay = useCallback(() => setIsPlaying(true), []);
  const handlePause = useCallback(() => setIsPlaying(false), []);
  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    if (!completedRef.current && onComplete) {
      completedRef.current = true;
      onComplete();
    }
  }, [onComplete]);

  const handleSeek = useCallback(
    (e) => {
      const video = videoRef.current;
      if (!video || !duration) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const t = ((e.clientX - rect.left) / rect.width) * duration;
      video.currentTime = t;
    },
    [duration]
  );

  const handleRateChange = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const rates = [1, 1.25, 1.5, 2];
    const next = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    video.playbackRate = next;
    setPlaybackRate(next);
  }, [playbackRate]);

  const handleFullscreen = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    (video.requestFullscreen || video.webkitRequestFullscreen || (() => {})).call(video);
  }, []);

  const handleVideoError = useCallback(() => {
    const mediaError = videoRef.current?.error;
    if (mediaError && !isHlsUrl) {
      console.warn('HTML5 Video error event:', mediaError);
      setPlaybackError({
        title: 'Video Playback Error',
        message: 'The media file could not be played. The video source may be unreachable or in an unsupported format.',
        url: playableVideoUrl,
      });
    }
  }, [isHlsUrl, playableVideoUrl]);

  const handleRetry = useCallback(() => {
    setPlaybackError(null);
    currentUrlRef.current = null;
    const video = videoRef.current;
    if (video) {
      video.removeAttribute('src');
    }
    setCurrentTime(0);
  }, []);

  // ── IFrame Message Bridge for YouTube & Bunny Stream ──
  useEffect(() => {
    if (!youtubeEmbedUrl && !bunnyEmbedUrl) return;

    // Reset completion status for new embed video
    completedRef.current = false;

    // 1. Cross-origin message listener
    const handleMessage = (event) => {
      const origin = event.origin || '';
      const isYouTube = origin.includes('youtube.com') || origin.includes('youtube-nocookie.com');
      const isBunny = origin.includes('mediadelivery.net') || origin.includes('bunnycdn.com');

      if (!isYouTube && !isBunny) return;

      let data = event.data;
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch (_) {
          return;
        }
      }

      if (!data) return;

      // Handle YouTube postMessage state change (info === 0 is ended)
      if (isYouTube) {
        if (
          (data.event === 'onStateChange' && data.info === 0) ||
          (data.event === 'infoDelivery' && data.info?.playerState === 0)
        ) {
          handleEnded();
        }
      }

      // Handle Bunny Stream postMessage events
      if (isBunny) {
        if (
          data.event === 'ended' ||
          data.event === 'complete' ||
          data.type === 'ended' ||
          data.type === 'player:ended' ||
          data.action === 'ended'
        ) {
          handleEnded();
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // 2. YouTube IFrame Player API listener
    let isCancelled = false;
    if (youtubeEmbedUrl) {
      const initYtPlayer = () => {
        if (isCancelled || !window.YT || !window.YT.Player || !iframeRef.current) return;
        try {
          if (ytPlayerRef.current && typeof ytPlayerRef.current.destroy === 'function') {
            ytPlayerRef.current.destroy();
          }
          ytPlayerRef.current = new window.YT.Player(iframeRef.current, {
            events: {
              onStateChange: (e) => {
                if (e.data === 0) {
                  handleEnded();
                }
              },
            },
          });
        } catch (err) {
          console.warn('[VideoPlayer] YT.Player initialization note:', err);
        }
      };

      if (!window.YT) {
        const existingScript = document.getElementById('youtube-iframe-api');
        if (!existingScript) {
          const script = document.createElement('script');
          script.id = 'youtube-iframe-api';
          script.src = 'https://www.youtube.com/iframe_api';
          document.body.appendChild(script);
        }

        const prevOnReady = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
          if (typeof prevOnReady === 'function') prevOnReady();
          initYtPlayer();
        };
      } else if (window.YT.Player) {
        initYtPlayer();
      }
    }

    return () => {
      isCancelled = true;
      window.removeEventListener('message', handleMessage);
      if (ytPlayerRef.current && typeof ytPlayerRef.current.destroy === 'function') {
        try {
          ytPlayerRef.current.destroy();
        } catch (_) {}
        ytPlayerRef.current = null;
      }
    };
  }, [youtubeEmbedUrl, bunnyEmbedUrl, handleEnded]);

  // ── YouTube embed ──
  if (youtubeEmbedUrl) {
    return (
      <Card className="border-border overflow-hidden bg-slate-950 relative select-none shadow-2xl rounded-2xl">
        <div className="aspect-video w-full relative">
          <iframe
            id="youtube-player-iframe"
            ref={iframeRef}
            src={youtubeEmbedUrl}
            className="w-full h-full border-0 absolute inset-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            title={mediaObj.title || 'Workout Video'}
          />
        </div>
        <div className="bg-slate-900/90 border-t border-slate-800 px-4 py-2 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            YouTube Player Connected
          </span>
          {onComplete && (
            <button
              type="button"
              onClick={handleEnded}
              className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer flex items-center gap-1 hover:underline"
            >
              Mark Completed ✓
            </button>
          )}
        </div>
      </Card>
    );
  }

  // ── Bunny Stream iframe embed ──
  if (bunnyEmbedUrl) {
    return (
      <Card className="border-border overflow-hidden bg-slate-950 relative select-none shadow-2xl rounded-2xl">
        <div className="aspect-video w-full relative">
          <iframe
            ref={iframeRef}
            src={bunnyEmbedUrl}
            className="w-full h-full border-0 absolute inset-0"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
            title={mediaObj.title || 'Workout Video'}
          />
        </div>
        <div className="bg-slate-900/90 border-t border-slate-800 px-4 py-2 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Bunny Stream Player Connected
          </span>
          {onComplete && (
            <button
              type="button"
              onClick={handleEnded}
              className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer flex items-center gap-1 hover:underline"
            >
              Mark Completed ✓
            </button>
          )}
        </div>
      </Card>
    );
  }

  // ── Playback / Network Error State ──
  if (playbackError) {
    return (
      <Card className="border-border overflow-hidden bg-slate-950 relative select-none shadow-2xl rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center min-h-[300px] sm:min-h-[360px] text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mb-4 shadow-inner">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-white mb-2">{playbackError.title}</h3>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mb-4 leading-relaxed">
          {playbackError.message}
        </p>
        {playbackError.url && (
          <div className="text-[11px] font-mono text-slate-400 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 max-w-full sm:max-w-md truncate mb-5">
            {playbackError.url}
          </div>
        )}
        <button
          onClick={handleRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-all cursor-pointer shadow-md"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry Connection
        </button>
      </Card>
    );
  }

  // ── No video URL available — empty state ──
  if (!playableVideoUrl) {
    return (
      <Card className="border-border overflow-hidden bg-slate-950 relative select-none shadow-2xl rounded-2xl">
        <div className="aspect-video w-full flex flex-col items-center justify-center gap-3 text-white/40">
          <svg className="h-12 w-12" fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M4 8a2 2 0 012-2h9a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V8z" />
          </svg>
          <p className="text-sm font-medium">No video attached to this lesson</p>
        </div>
      </Card>
    );
  }

  // ── Direct HTML5 / HLS Player ──
  return (

    <Card className="border-border overflow-hidden bg-slate-950 relative group select-none shadow-2xl rounded-2xl">
      {/* Video element — no src attribute when HLS.js is in charge */}
      <video
        ref={videoRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onError={handleVideoError}
        onClick={handlePlayPause}
        className="w-full aspect-video object-contain bg-slate-950 cursor-pointer block"
        preload="auto"
        playsInline
      />

      {/* Play overlay — only when paused */}
      {!isPlaying && (
        <div
          onClick={handlePlayPause}
          className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer z-10 hover:bg-black/20 transition-all"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center shadow-tactile hover:scale-110 transition-transform">
            <Play className="h-8 w-8 fill-current ml-1" />
          </div>
        </div>
      )}

      {/* Controls bar */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">

        {/* Seek bar */}
        <div
          onClick={handleSeek}
          className="h-1.5 w-full bg-white/20 hover:h-2.5 rounded-full cursor-pointer relative transition-all"
        >
          <div
            className="h-full bg-primary rounded-full relative transition-all"
            style={{ width: `${progressPercent}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full border-2 border-primary shadow-md" />
          </div>
        </div>

        {/* Buttons row */}
        <div className="flex items-center justify-between text-white text-xs font-mono">
          <div className="flex items-center gap-1.5 sm:gap-3">
            <button
              onClick={handlePlayPause}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="hover:text-primary transition-colors cursor-pointer flex items-center justify-center p-2 rounded-lg"
            >
              {isPlaying
                ? <Pause className="h-5 w-5 fill-current" />
                : <Play className="h-5 w-5 fill-current" />}
            </button>
            <button
              onClick={handleToggleMute}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
              className="hover:text-primary transition-colors cursor-pointer flex items-center justify-center p-2 rounded-lg"
            >
              {isMuted
                ? <VolumeX className="h-4 w-4" />
                : <Volume2 className="h-4 w-4" />}
            </button>
            <span className="font-semibold select-none text-slate-300 text-[11px] sm:text-xs">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3">
            <button
              onClick={handleRateChange}
              aria-label="Playback speed"
              className="px-2 py-1 rounded-md border border-white/20 hover:border-white font-bold cursor-pointer text-[11px]"
            >
              {playbackRate}x
            </button>
            <button
              onClick={handleFullscreen}
              aria-label="Fullscreen"
              className="hover:text-primary transition-colors cursor-pointer flex items-center justify-center p-2 rounded-lg"
            >
              <Maximize className="h-4 w-4" />
            </button>
          </div>
        </div>

      </div>
    </Card>
  );
};

export default VideoPlayer;
