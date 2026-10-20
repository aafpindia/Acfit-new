import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload,
  Video,
  Play,
  CheckCircle,
  X,
  Link,
  Film,
  Sparkles,
  Loader2,
  Clock,
  HardDrive,
  AlertCircle
} from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import { Badge } from './badge';
import {
  processBunnyVideoWorkflow,
  getHlsUrl,
  getVideoStatus,
  isValidBunnyVideoId,
} from '../../services/bunnyService';
import { VideoPlayer } from '../../features/courses/players/VideoPlayer';

/**
 * VideoUploadDropzone
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles:
 *  1. File drag-and-drop → Bunny Stream TUS upload → HLS URL stored
 *  2. Direct video URL (MP4 / HLS)
 *  3. Bunny Stream GUID input
 *
 * Preview always uses a native <video> element (no iframes).
 * Duration is read from the video element's metadata — never hardcoded.
 */
export const VideoUploadDropzone = ({
  value = {},
  onChange,
  onUploadSuccess,
  className = ''
}) => {
  const [activeMode, setActiveMode] = useState('upload');
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [customUrlInput, setCustomUrlInput] = useState(value.videoUrl || '');
  const [bunnyIdInput, setBunnyIdInput] = useState(value.bunnyVideoId || value.videoId || '');
  const [localBlobUrl, setLocalBlobUrl] = useState(null); // instant local preview
  const [videoDuration, setVideoDuration] = useState(null);
  const [videoSize, setVideoSize] = useState(null);
  const previewRef = useRef(null);
  const fileInputRef = useRef(null);

  // ── Derive display values ──
  const bunnyVideoId = value.bunnyVideoId || value.videoId;
  // Prefer explicit hlsUrl, then fall back to generating from bunny GUID
  const hlsUrl =
    value.hlsUrl ||
    (isValidBunnyVideoId(bunnyVideoId) ? getHlsUrl(bunnyVideoId) : null);
  // The actual playable URL for the preview
  const previewSrc = localBlobUrl || hlsUrl || value.videoUrl || null;
  const hasMedia = Boolean(previewSrc || bunnyVideoId);

  // Revoke blob URL on unmount / when replaced
  useEffect(() => {
    return () => {
      if (localBlobUrl) URL.revokeObjectURL(localBlobUrl);
    };
  }, [localBlobUrl]);

  // ── Poll Bunny for real duration after upload ──
  useEffect(() => {
    if (!bunnyVideoId || !isValidBunnyVideoId(bunnyVideoId) || videoDuration) return;
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 20; // poll for up to ~2 minutes

    const poll = async () => {
      if (cancelled || attempts >= maxAttempts) return;
      attempts++;
      try {
        const status = await getVideoStatus(bunnyVideoId);
        if (status?.duration && status.duration > 0) {
          if (!cancelled) setVideoDuration(status.duration);
          return;
        }
        if (status?.status === 'finished' || status?.status === 'error') return;
      } catch (_) {/* ignore */}
      setTimeout(poll, 6000);
    };

    poll();
    return () => { cancelled = true; };
  }, [bunnyVideoId, videoDuration]);

  // ── Read duration from <video> element when loaded ──
  const handlePreviewMetadata = useCallback(() => {
    const v = previewRef.current;
    if (v && v.duration && !isNaN(v.duration) && v.duration > 0) {
      setVideoDuration(v.duration);
    }
  }, []);

  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return null;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const formatSize = (bytes) => {
    if (!bytes) return null;
    if (bytes >= 1024 * 1024 * 1024) return (bytes / (1024 ** 3)).toFixed(1) + ' GB';
    return (bytes / (1024 ** 2)).toFixed(1) + ' MB';
  };

  // ── Drag handlers ──
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFileSelected(e.dataTransfer.files[0]);
  };

  // ── File upload ──
  const handleFileSelected = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|webm|mov|mkv|avi|m4v)$/i)) {
      alert('Please select a valid video file (MP4, WEBM, MOV, MKV, etc.).');
      return;
    }

    // Show instant local preview while uploading
    const blobUrl = URL.createObjectURL(file);
    setLocalBlobUrl(blobUrl);
    setVideoSize(file.size);
    setVideoDuration(null);

    // Read real duration from file
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = blobUrl;
    tempVideo.onloadedmetadata = () => {
      if (tempVideo.duration && !isNaN(tempVideo.duration) && tempVideo.duration > 0) {
        setVideoDuration(tempVideo.duration);
      }
    };

    setIsUploading(true);
    setUploadProgress(5);
    setUploadStatusText('Preparing upload...');

    try {
      const res = await processBunnyVideoWorkflow(
        file,
        file.name,
        (progress) => {
          setUploadProgress(progress.pct || 0);
          if (progress.message) setUploadStatusText(progress.message);
        }
      );

      if (res.success && res.data) {
        // Store hlsUrl as videoUrl so VideoPlayer always gets a direct streamable URL
        const mediaPayload = {
          videoUrl: res.data.hlsUrl || res.data.directPlayUrl || '',
          hlsUrl: res.data.hlsUrl || '',
          videoId: res.data.videoId,
          bunnyVideoId: res.data.videoId,
          thumbnailUrl: res.data.thumbnailUrl,
          fileName: file.name,
          fileSize: file.size,
          type: 'video'
        };

        // Keep blob preview until HLS is ready, then switch
        if (onChange) onChange(mediaPayload);
        if (onUploadSuccess) onUploadSuccess(mediaPayload);
      }
    } catch (err) {
      console.error('Video upload failed:', err);
      alert('Upload failed: ' + (err?.message || 'Check your connection and try again.'));
      // Remove local blob preview on failure
      URL.revokeObjectURL(blobUrl);
      setLocalBlobUrl(null);
    } finally {
      setIsUploading(false);
      setTimeout(() => {
        setUploadProgress(0);
        setUploadStatusText('');
      }, 1500);
    }
  };

  const handleApplyUrl = () => {
    const url = customUrlInput.trim();
    if (!url) return;
    setLocalBlobUrl(null);
    setVideoDuration(null);
    if (onChange) onChange({ ...value, videoUrl: url, type: 'video' });
  };

  const handleApplyBunnyId = () => {
    const id = bunnyIdInput.trim();
    if (!id) return;
    setLocalBlobUrl(null);
    setVideoDuration(null);
    if (onChange) onChange({
      ...value,
      videoId: id,
      bunnyVideoId: id,
      videoUrl: getHlsUrl(id) || '',
      hlsUrl: getHlsUrl(id) || '',
      type: 'video'
    });
  };

  const handleRemoveMedia = () => {
    if (localBlobUrl) URL.revokeObjectURL(localBlobUrl);
    setLocalBlobUrl(null);
    setVideoDuration(null);
    setVideoSize(null);
    if (onChange) onChange({ ...value, videoUrl: '', videoId: '', bunnyVideoId: '', hlsUrl: '', fileName: '' });
  };

  return (
    <div className={`space-y-3 font-sans ${className}`}>
      {/* Mode Selector */}
      <div className="flex items-center justify-between p-1 bg-surface rounded-xl border border-border">
        {[
          { id: 'upload', icon: <Upload className="h-3.5 w-3.5" />, label: 'Direct File Drop' },
          { id: 'url', icon: <Link className="h-3.5 w-3.5" />, label: 'Video URL / Link' },
          { id: 'bunny', icon: <Sparkles className="h-3.5 w-3.5 text-amber-500" />, label: 'Bunny Stream ID' },
        ].map(({ id, icon, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveMode(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all ${
              activeMode === id
                ? 'bg-card text-primary shadow-2xs font-bold border border-border/80'
                : 'text-text-secondary hover:text-text-main'
            }`}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* ── Mode: File Upload ── */}
      {activeMode === 'upload' && !hasMedia && (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 group ${
            dragActive
              ? 'border-primary bg-primary/10 scale-[1.01] shadow-md'
              : 'border-border hover:border-primary/60 hover:bg-primary/5 bg-card/60'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileSelected(e.target.files[0])}
          />
          <div className="p-3.5 rounded-2xl bg-primary/10 text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all shadow-2xs">
            <Film className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-text-main group-hover:text-primary transition-colors">
              Click or Drag &amp; Drop Video File
            </p>
            <p className="text-[11px] text-text-muted">
              MP4, WEBM, MOV, MKV (Up to 2 GB • HD 1080p)
            </p>
          </div>
          <Badge variant="outline" className="text-[10px] font-semibold border-primary/20 text-primary bg-primary/5">
            Auto-encodes for fast streaming
          </Badge>
        </div>
      )}

      {/* Upload Progress Overlay (shown when uploading, even if hasMedia is true from blob) */}
      {isUploading && (
        <div className="w-full space-y-1.5 bg-card border border-border rounded-xl p-3">
          <div className="flex justify-between text-[11px] font-bold text-primary">
            <span className="flex items-center gap-1.5 truncate max-w-[80%]">
              <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
              {uploadStatusText || 'Uploading…'}
            </span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Mode: Custom URL ── */}
      {activeMode === 'url' && !hasMedia && (
        <div className="p-4 bg-card border border-border rounded-2xl space-y-3 shadow-2xs">
          <div className="space-y-1">
            <label className="text-xs font-extrabold text-text-main flex items-center gap-1.5">
              <Link className="h-3.5 w-3.5 text-primary" /> Direct Video URL / MP4 / HLS Stream
            </label>
            <p className="text-[11px] text-text-secondary">
              Paste a direct video URL (MP4, .m3u8 HLS, Bunny CDN, AWS S3, etc.)
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="https://example.com/video.mp4"
              value={customUrlInput}
              onChange={(e) => setCustomUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyUrl()}
              className="text-xs flex-1"
            />
            <Button variant="primary" size="sm" onClick={handleApplyUrl} className="text-xs font-bold px-4">
              Attach
            </Button>
          </div>
        </div>
      )}

      {/* ── Mode: Bunny GUID ── */}
      {activeMode === 'bunny' && !hasMedia && (
        <div className="p-4 bg-card border border-border rounded-2xl space-y-3 shadow-2xs">
          <div className="space-y-1">
            <label className="text-xs font-extrabold text-text-main flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Bunny Stream Video GUID
            </label>
            <p className="text-[11px] text-text-secondary">
              Enter the Bunny Stream GUID for high-speed adaptive HLS streaming.
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={bunnyIdInput}
              onChange={(e) => setBunnyIdInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyBunnyId()}
              className="text-xs flex-1 font-mono"
            />
            <Button
              variant="primary"
              size="sm"
              onClick={handleApplyBunnyId}
              className="text-xs font-bold px-4 bg-amber-600 hover:bg-amber-700 text-white"
            >
              Link
            </Button>
          </div>
        </div>
      )}

      {/* ── Live Preview Card ── */}
      {hasMedia && (
        <div className="border border-border rounded-2xl bg-card overflow-hidden shadow-sm transition-all">
          {/* Header */}
          <div className="flex items-center justify-between px-3.5 pt-3 pb-2">
            <div className="flex items-center gap-2">
              <Badge variant="success" className="text-[10px] font-bold gap-1 px-2 py-0.5">
                <CheckCircle className="h-3 w-3" /> Video Attached
              </Badge>
              {bunnyVideoId && (
                <Badge variant="outline" className="text-[10px] font-semibold text-amber-600 border-amber-300 bg-amber-50">
                  Bunny CDN
                </Badge>
              )}
              {isUploading && (
                <Badge variant="outline" className="text-[10px] font-semibold text-blue-600 border-blue-300 bg-blue-50 gap-1">
                  <Loader2 className="h-2.5 w-2.5 animate-spin" /> Uploading…
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveMedia}
              className="text-text-muted hover:text-error hover:bg-error/10 h-7 px-2 text-xs font-bold gap-1 rounded-lg"
            >
              <X className="h-3.5 w-3.5" /> Remove
            </Button>
          </div>

          {/* Native video preview — direct HLS & MP4 player */}
          <div className="relative mx-3 mb-1 rounded-xl overflow-hidden bg-black">
            {previewSrc ? (
              <VideoPlayer
                content={{
                  videoUrl: previewSrc,
                  _blobPreview: localBlobUrl,
                  bunnyVideoId,
                  title: value.fileName || 'Video Preview'
                }}
              />
            ) : (
              <div className="w-full aspect-video flex items-center justify-center text-white/40 text-xs flex-col gap-2">
                <Video className="h-8 w-8" />
                <span>Preview loading…</span>
              </div>
            )}
          </div>

          {/* Meta row */}
          <div className="flex items-center justify-between text-[11px] text-text-secondary px-4 pb-3 pt-1 gap-4">
            <span className="truncate font-mono font-medium text-text-main flex-1 min-w-0">
              {value.fileName || (previewSrc ? new URL(previewSrc.startsWith('blob') ? 'blob:x' : previewSrc).pathname.split('/').pop() : '—')}
            </span>
            <div className="flex items-center gap-3 shrink-0">
              {(videoSize || value.fileSize) && (
                <span className="flex items-center gap-1 text-text-muted">
                  <HardDrive className="h-3 w-3" />
                  {formatSize(videoSize || value.fileSize) || value.fileSize}
                </span>
              )}
              <span className="flex items-center gap-1 font-semibold text-primary">
                <Clock className="h-3 w-3" />
                {formatDuration(videoDuration || value.duration) || (isUploading ? 'Processing…' : 'Detecting…')}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoUploadDropzone;
