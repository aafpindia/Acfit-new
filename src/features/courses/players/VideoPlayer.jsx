import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Maximize, Volume2, VolumeX, Video, Zap } from 'lucide-react';
import Hls from 'hls.js';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { getEmbedUrl, getHlsUrl, getDirectPlayUrl, hasBunnyVideo, getBunnyVideoId, isValidBunnyVideoId } from '../../../services/bunnyService';

export const VideoPlayer = ({ content = {}, onComplete }) => {
  const videoRef = useRef(null);
  const hlsInstanceRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [progressPercent, setProgressPercent] = useState(0);
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const [iframeFailed, setIframeFailed] = useState(false);

  // Standardize media content payload (support both object and string input)
  const mediaObj = typeof content === 'string' ? { videoUrl: content } : (content || {});

  // Extract raw video URL and Bunny Video ID
  const rawVideoUrl = mediaObj.videoUrl || mediaObj.url || mediaObj.fileUrl || mediaObj.src || '';
  const candidateBunnyId = getBunnyVideoId(mediaObj) || mediaObj.bunnyVideoId || mediaObj.bunny_video_id || mediaObj.guid;
  const rawBunnyId = isValidBunnyVideoId(candidateBunnyId) ? candidateBunnyId : null;

  // Determine if URL is a direct Bunny Stream iframe embed URL
  const isDirectBunnyIframeUrl = typeof rawVideoUrl === 'string' && rawVideoUrl.includes('iframe.mediadelivery.net');
  
  // Determine if URL is YouTube
  const getYouTubeEmbedUrl = (url) => {
    if (!url || typeof url !== 'string') return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}?autoplay=0&rel=0` : null;
  };
  const youtubeEmbedUrl = getYouTubeEmbedUrl(rawVideoUrl);

  // Determine Bunny Stream embed URL (only for valid UUIDs or direct embed URLs)
  let bunnyEmbedUrl = null;
  if (isDirectBunnyIframeUrl) {
    bunnyEmbedUrl = rawVideoUrl;
  } else if (rawBunnyId) {
    bunnyEmbedUrl = getEmbedUrl(rawBunnyId, mediaObj.libraryId);
  }

  // Determine HTML5 Playable Video URL (MP4 or HLS m3u8)
  const resolvePlayableUrl = (url) => {
    if (!url || typeof url !== 'string') return null;
    const trimmed = url.trim();
    if (trimmed.includes('iframe.mediadelivery.net') || trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
      return null;
    }
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('blob:')) {
      return trimmed;
    }
    return null;
  };

  const playableVideoUrl = 
    resolvePlayableUrl(rawVideoUrl) || 
    (rawBunnyId ? getDirectPlayUrl(rawBunnyId) : null) ||
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setProgressPercent(0);
    setIsIframeLoaded(false);
    setIframeFailed(false);

    // Setup HLS for ultra-fast adaptive streaming if playing an .m3u8 playlist directly
    if (videoRef.current && playableVideoUrl && playableVideoUrl.includes('.m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
        });
        hls.loadSource(playableVideoUrl);
        hls.attachMedia(videoRef.current);
        hlsInstanceRef.current = hls;

        return () => {
          hls.destroy();
          hlsInstanceRef.current = null;
        };
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = playableVideoUrl;
      }
    }
  }, [content, playableVideoUrl]);

  // ── 1. YouTube Embed Mode ──
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
        <BunnyAutoComplete onComplete={onComplete} />
      </Card>
    );
  }

  // ── 2. Bunny Stream Iframe Embed Mode (High Speed Global Edge CDN) ──
  if (bunnyEmbedUrl && !iframeFailed) {
    return (
      <Card className="border-border overflow-hidden bg-slate-950 relative select-none shadow-2xl rounded-2xl">
        {/* Stream Provider Header Badge */}
        <div className="absolute top-3 left-3 z-20 flex items-center gap-2 pointer-events-none opacity-80 hover:opacity-100 transition-opacity">
          <Badge className="bg-slate-900/90 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold px-2.5 py-1 flex items-center gap-1.5 shadow-md">
            <Zap className="h-3 w-3 text-amber-400 fill-amber-400" />
            <span>Bunny CDN Premium • High Speed</span>
          </Badge>
        </div>

        {/* Loading Spinner with switch fallback */}
        {!isIframeLoaded && (
          <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center gap-3 z-10 text-white p-4 text-center">
            <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold text-slate-400">Connecting to BunnyStream CDN Edge...</span>
            <button
              type="button"
              onClick={() => setIframeFailed(true)}
              className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline mt-1 cursor-pointer transition-colors"
            >
              Taking too long? Switch to Direct Player
            </button>
          </div>
        )}

        <div className="aspect-video w-full relative">
          <iframe
            src={bunnyEmbedUrl}
            loading="eager"
            onLoad={() => setIsIframeLoaded(true)}
            onError={() => setIframeFailed(true)}
            className="w-full h-full border-0 absolute inset-0"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
            title={mediaObj.title || 'Bunny Stream Video'}
          />
        </div>

        {/* Auto-complete trigger after 25 seconds of viewing */}
        <BunnyAutoComplete onComplete={onComplete} />
      </Card>
    );
  }

  // ── 3. Standard HTML5 Video Player ──
  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch((e) => console.log('Video play interrupted:', e));
      setIsPlaying(true);
    }
  };

  const handleToggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 0;
    setCurrentTime(current);
    setDuration(dur);
    if (dur > 0) {
      setProgressPercent((current / dur) * 100);
      if (current / dur >= 0.92 && onComplete) {
        onComplete();
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    if (!videoRef.current || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    setProgressPercent((newTime / duration) * 100);
  };

  const handleRateChange = () => {
    if (!videoRef.current) return;
    let nextRate = 1;
    if (playbackRate === 1) nextRate = 1.25;
    else if (playbackRate === 1.25) nextRate = 1.5;
    else if (playbackRate === 1.5) nextRate = 2;
    else nextRate = 1;
    
    videoRef.current.playbackRate = nextRate;
    setPlaybackRate(nextRate);
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds)) return '0:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <Card className="border-border overflow-hidden bg-slate-950 relative group select-none shadow-2xl rounded-2xl">
      {/* Stream Provider Header Badge */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2 pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
        <Badge className="bg-slate-900/80 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold px-2.5 py-1 flex items-center gap-1.5 shadow-md">
          <Video className="h-3 w-3 text-primary" />
          <span>HD Stream Player</span>
        </Badge>
      </div>

      <video
        ref={videoRef}
        src={playableVideoUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onClick={handlePlayPause}
        className="w-full aspect-video object-contain bg-slate-950 cursor-pointer"
        preload="metadata"
        crossOrigin="anonymous"
      />

      {/* Play Overlay Button if Not Playing */}
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

      {/* Video Overlay Controllers */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
        
        {/* Progress seek bar */}
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

        {/* Media Buttons */}
        <div className="flex items-center justify-between text-white text-xs font-mono">
          <div className="flex items-center gap-1.5 sm:gap-3">
            <button
              onClick={handlePlayPause}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="touch-target-min hover:text-primary transition-colors cursor-pointer text-white flex items-center justify-center p-2 rounded-lg"
            >
              {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
            </button>
            <button
              onClick={handleToggleMute}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
              className="touch-target-min hover:text-primary transition-colors cursor-pointer text-white flex items-center justify-center p-2 rounded-lg"
            >
              {isMuted ? <VolumeX className="h-4.5 w-4.5" /> : <Volume2 className="h-4.5 w-4.5" />}
            </button>
            <span className="font-semibold select-none text-slate-300 text-[11px] sm:text-xs">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3">
            <button
              onClick={handleRateChange}
              aria-label="Change playback speed"
              className="touch-target-min px-2 py-1 rounded-md border border-white/20 hover:border-white font-bold cursor-pointer text-[11px] flex items-center justify-center"
            >
              {playbackRate}x
            </button>
            <button
              onClick={handleFullscreen}
              aria-label="Fullscreen"
              className="touch-target-min hover:text-primary transition-colors cursor-pointer text-white flex items-center justify-center p-2 rounded-lg"
            >
              <Maximize className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

      </div>
    </Card>
  );
};

const BunnyAutoComplete = ({ onComplete }) => {
  useEffect(() => {
    if (!onComplete) return;
    const timer = setTimeout(() => {
      onComplete();
    }, 25000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return null;
};

export default VideoPlayer;
