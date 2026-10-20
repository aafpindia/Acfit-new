import React, { useState, useRef } from 'react';
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
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import { Badge } from './badge';
import { processBunnyVideoWorkflow, getEmbedUrl } from '../../services/bunnyService';

/**
 * Pro-Level Video Upload & Media Dropzone Component
 * Supports direct file upload, Bunny Stream CDN integration, direct Video URLs,
 * and features an interactive live video preview player.
 */
export const VideoUploadDropzone = ({
  value = {},
  onChange,
  onUploadSuccess,
  className = ''
}) => {
  const [activeMode, setActiveMode] = useState('upload'); // 'upload' | 'url' | 'bunny'
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [customUrlInput, setCustomUrlInput] = useState(value.videoUrl || '');
  const [bunnyIdInput, setBunnyIdInput] = useState(value.bunnyVideoId || value.videoId || '');
  const [previewError, setPreviewError] = useState(false);
  const fileInputRef = useRef(null);

  const videoUrl = value.videoUrl || value.url;
  const bunnyVideoId = value.bunnyVideoId || value.videoId;
  const embedUrl = bunnyVideoId ? getEmbedUrl(bunnyVideoId) : null;
  const hasMedia = Boolean(videoUrl || bunnyVideoId || embedUrl);

  // Drag handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = async (file) => {
    if (!file) return;

    // Check if video file
    if (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|webm|mov|mkv|avi)$/i)) {
      alert('Please select a valid video file (MP4, WEBM, MOV, etc.).');
      return;
    }

    setIsUploading(true);
    setUploadProgress(5);
    setUploadStatusText('Preparing video for upload...');

    try {
      const res = await processBunnyVideoWorkflow(
        file,
        file.name,
        (progress) => {
          setUploadProgress(progress.pct || 0);
          if (progress.message) {
            setUploadStatusText(progress.message);
          }
        }
      );

      if (res.success && res.data) {
        const finalEmbedUrl = res.data.embedUrl || getEmbedUrl(res.data.videoId);
        const mediaPayload = {
          videoUrl: finalEmbedUrl,
          videoId: res.data.videoId,
          bunnyVideoId: res.data.videoId,
          hlsUrl: res.data.hlsUrl,
          thumbnailUrl: res.data.thumbnailUrl,
          fileName: file.name,
          fileSize: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
          type: 'video'
        };

        if (onChange) onChange(mediaPayload);
        if (onUploadSuccess) onUploadSuccess(mediaPayload);
      }
    } catch (err) {
      console.error('Video upload failed:', err);
      alert('Video upload failed: ' + (err.message || 'Please check your connection and try again.'));
    } finally {
      setIsUploading(false);
      setTimeout(() => {
        setUploadProgress(0);
        setUploadStatusText('');
      }, 1500);
    }
  };

  const handleApplyUrl = () => {
    if (!customUrlInput.trim()) return;
    const mediaPayload = {
      ...value,
      videoUrl: customUrlInput.trim(),
      type: 'video'
    };
    if (onChange) onChange(mediaPayload);
  };

  const handleApplyBunnyId = () => {
    if (!bunnyIdInput.trim()) return;
    const mediaPayload = {
      ...value,
      videoId: bunnyIdInput.trim(),
      bunnyVideoId: bunnyIdInput.trim(),
      type: 'video'
    };
    if (onChange) onChange(mediaPayload);
  };

  const handleRemoveMedia = () => {
    if (onChange) {
      onChange({
        ...value,
        videoUrl: '',
        videoId: '',
        bunnyVideoId: '',
        fileName: ''
      });
    }
  };

  return (
    <div className={`space-y-3 font-sans ${className}`}>
      {/* Top Mode Selector Tabs */}
      <div className="flex items-center justify-between p-1 bg-surface rounded-xl border border-border">
        <button
          type="button"
          onClick={() => setActiveMode('upload')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all ${
            activeMode === 'upload'
              ? 'bg-card text-primary shadow-2xs font-bold border border-border/80'
              : 'text-text-secondary hover:text-text-main'
          }`}
        >
          <Upload className="h-3.5 w-3.5" />
          Direct File Drop
        </button>

        <button
          type="button"
          onClick={() => setActiveMode('url')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all ${
            activeMode === 'url'
              ? 'bg-card text-primary shadow-2xs font-bold border border-border/80'
              : 'text-text-secondary hover:text-text-main'
          }`}
        >
          <Link className="h-3.5 w-3.5" />
          Video URL / Link
        </button>

        <button
          type="button"
          onClick={() => setActiveMode('bunny')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all ${
            activeMode === 'bunny'
              ? 'bg-card text-primary shadow-2xs font-bold border border-border/80'
              : 'text-text-secondary hover:text-text-main'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          Bunny Stream ID
        </button>
      </div>

      {/* Mode 1: Drag & Drop Zone */}
      {activeMode === 'upload' && !hasMedia && (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
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
              Click or Drag & Drop Video File
            </p>
            <p className="text-[11px] text-text-muted">
              MP4, WEBM, MOV or AVI (Up to 2GB • High Definition 1080p)
            </p>
          </div>

          <Badge variant="outline" className="text-[10px] font-semibold border-primary/20 text-primary bg-primary/5">
            Auto-Encodes for Fast Streaming
          </Badge>

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="w-full space-y-1.5 pt-2">
              <div className="flex justify-between text-[11px] font-bold text-primary">
                <span className="flex items-center gap-1.5 truncate max-w-[80%]">
                  <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" /> {uploadStatusText || 'Uploading Video...'}
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
        </div>
      )}

      {/* Mode 2: Custom Video URL */}
      {activeMode === 'url' && !hasMedia && (
        <div className="p-4 bg-card border border-border rounded-2xl space-y-3 shadow-2xs">
          <div className="space-y-1">
            <label className="text-xs font-extrabold text-text-main flex items-center gap-1.5">
              <Link className="h-3.5 w-3.5 text-primary" /> Direct Video URL / MP4 / HLS Stream
            </label>
            <p className="text-[11px] text-text-secondary">
              Paste direct video file link (e.g. Google Cloud, AWS S3, Bunny CDN, or public MP4 URL).
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="https://commondatastorage.googleapis.com/.../BigBuckBunny.mp4"
              value={customUrlInput}
              onChange={(e) => setCustomUrlInput(e.target.value)}
              className="text-xs flex-1"
            />
            <Button
              variant="primary"
              size="sm"
              onClick={handleApplyUrl}
              className="text-xs font-bold px-4"
            >
              Attach Link
            </Button>
          </div>
        </div>
      )}

      {/* Mode 3: Bunny Stream CDN */}
      {activeMode === 'bunny' && !hasMedia && (
        <div className="p-4 bg-card border border-border rounded-2xl space-y-3 shadow-2xs">
          <div className="space-y-1">
            <label className="text-xs font-extrabold text-text-main flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Bunny Stream Video GUID / ID
            </label>
            <p className="text-[11px] text-text-secondary">
              Enter Bunny Stream library video GUID for high-speed DRM protected streaming.
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. 1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p"
              value={bunnyIdInput}
              onChange={(e) => setBunnyIdInput(e.target.value)}
              className="text-xs flex-1 font-mono"
            />
            <Button
              variant="primary"
              size="sm"
              onClick={handleApplyBunnyId}
              className="text-xs font-bold px-4 bg-amber-600 hover:bg-amber-700 text-white"
            >
              Link Bunny ID
            </Button>
          </div>
        </div>
      )}

      {/* Live Video Preview Card when video is attached */}
      {hasMedia && (
        <div className="border border-border rounded-2xl bg-card overflow-hidden shadow-sm space-y-3 p-3.5 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="success" className="text-[10px] font-bold gap-1 px-2 py-0.5">
                <CheckCircle className="h-3 w-3" /> Video Attached
              </Badge>
              {bunnyVideoId && (
                <Badge variant="outline" className="text-[10px] font-semibold text-amber-600 border-amber-300 bg-amber-50">
                  Bunny CDN Stream
                </Badge>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveMedia}
              className="text-text-muted hover:text-error hover:bg-error/10 h-7 px-2 text-xs font-bold gap-1 rounded-lg"
            >
              <X className="h-3.5 w-3.5" /> Remove Video
            </Button>
          </div>

          {/* Interactive Player Preview Frame */}
          <div className="relative rounded-xl overflow-hidden bg-black/90 aspect-video flex items-center justify-center group border border-border/50">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                title="Bunny Stream Preview"
                className="w-full h-full border-0"
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                allowFullScreen
              />
            ) : videoUrl ? (
              <video
                src={videoUrl}
                controls
                className="w-full h-full object-contain"
                onError={() => setPreviewError(true)}
              />
            ) : (
              <div className="text-white text-xs flex items-center gap-2">
                <Play className="h-6 w-6 text-primary" /> Live Preview Player Ready
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-text-secondary px-1">
            <span className="truncate max-w-[280px] font-mono font-medium text-text-main">
              {value.fileName || videoUrl || bunnyVideoId}
            </span>
            <span className="text-text-muted font-semibold">
              {value.duration ? `Duration: ${value.duration}` : 'HD Stream Ready'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoUploadDropzone;
