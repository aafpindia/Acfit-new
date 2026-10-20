import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Play, Pause, Maximize, Volume2, VolumeX } from 'lucide-react';
import Hls from 'hls.js';
import { Card } from '../../../components/ui/card';
import {
  getHlsUrl,
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
  return m && m[2].length === 11
    ? `https://www.youtube.com/embed/${m[2]}?autoplay=0&rel=0`
    : null;
}

function resolvePlayableUrl(rawUrl, rawBunnyId) {
  if (rawUrl) {
    const t = rawUrl.trim();
    if (t.includes('youtube.com') || t.includes('youtu.be')) return null;

    // Convert Bunny embed iframes → direct HLS
    if (t.includes('iframe.mediadelivery.net/embed/')) {
      const parts = t.split('/');
      const possibleGuid = parts[parts.length - 1]?.split('?')[0];
      if (isValidBunnyVideoId(possibleGuid)) return getHlsUrl(possibleGuid);
      return null;
    }

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

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

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

  const playableVideoUrl = useMemo(
    () => (youtubeEmbedUrl ? null : resolvePlayableUrl(rawVideoUrl, rawBunnyId)),
    [youtubeEmbedUrl, rawVideoUrl, rawBunnyId]
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

        // Resilient error recovery (e.g. while Bunny is encoding or network hiccup)
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.warn('HLS Network error, attempting recovery...', data.details);
                setTimeout(() => {
                  if (hlsRef.current) hlsRef.current.startLoad();
                }, 2000);
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.warn('HLS Media error, attempting recovery...', data.details);
                hls.recoverMediaError();
                break;
              default:
                console.error('Fatal unrecoverable HLS error:', data);
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

  // ── YouTube embed ──
  if (youtubeEmbedUrl) {
    return (
      <Card className="border-border overflow-hidden bg-slate-950 relative select-none shadow-2xl rounded-2xl">
        <div className="aspect-video w-full relative">
          <iframe
            src={youtubeEmbedUrl}
            className="w-full h-full border-0 absolute inset-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            title={mediaObj.title || 'Workout Video'}
          />
        </div>
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
