import React, { useEffect, useRef, useState } from 'react';
import {
  PhotoIcon,
  FilmIcon,
  PlayCircleIcon,
  ArrowPathIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { guidesAPI } from '../services/api';
import { defaultAvatarUrl, resolveMediaUrl } from '../utils/media';

const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const VIDEO_MAX_BYTES = 25 * 1024 * 1024;
const VIDEO_MAX_SECONDS = 30;

const GuideMediaFields = ({ profileImageUrl, introVideoUrl, onFieldChange }) => {
  const [imagePreview, setImagePreview] = useState(profileImageUrl || '');
  const [videoPreview, setVideoPreview] = useState(introVideoUrl || '');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [imageError, setImageError] = useState('');
  const [videoError, setVideoError] = useState('');
  const [imageSuccess, setImageSuccess] = useState('');
  const [videoSuccess, setVideoSuccess] = useState('');
  const [videoLoadError, setVideoLoadError] = useState('');

  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

  useEffect(() => {
    setImagePreview(profileImageUrl || '');
  }, [profileImageUrl]);

  useEffect(() => {
    setVideoPreview(introVideoUrl || '');
    setVideoLoadError('');
  }, [introVideoUrl]);

  const fullImageUrl = resolveMediaUrl(imagePreview);
  const fullVideoUrl = resolveMediaUrl(videoPreview);
  console.log('IMAGE URL:', fullImageUrl);
  console.log('VIDEO URL:', fullVideoUrl);

  const extractErrorMessage = (error, fallback) => {
    const payload = error?.response?.data;
    if (typeof payload === 'string') return payload;
    if (payload && typeof payload === 'object') {
      return payload.error || payload.message || fallback;
    }
    return error?.message || fallback;
  };

  const openImagePicker = () => imageInputRef.current?.click();
  const openVideoPicker = () => videoInputRef.current?.click();

  const clearImage = () => {
    setImageError('');
    setImageSuccess('');
    setImagePreview('');
    onFieldChange('profileImageUrl', '');
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const clearVideo = () => {
    setVideoError('');
    setVideoSuccess('');
    setVideoLoadError('');
    setVideoPreview('');
    onFieldChange('introVideoUrl', '');
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const validateVideoDuration = (file) =>
    new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const objectUrl = URL.createObjectURL(file);

      video.preload = 'metadata';
      video.src = objectUrl;
      video.onloadedmetadata = () => {
        const duration = video.duration;
        URL.revokeObjectURL(objectUrl);
        if (!Number.isFinite(duration)) {
          reject(new Error('Unable to read video duration'));
          return;
        }
        if (duration > VIDEO_MAX_SECONDS) {
          reject(new Error('Video must be under 30 seconds'));
          return;
        }
        resolve(duration);
      };
      video.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Unable to read video file'));
      };
    });

  const handleImageSelected = async (file) => {
    if (!file) return;

    setImageError('');
    setImageSuccess('');
    setVideoLoadError('');

    if (!file.type.startsWith('image/')) {
      setImageError('Please choose a valid image file.');
      return;
    }

    if (file.size > IMAGE_MAX_BYTES) {
      setImageError('Image must be 5MB or smaller.');
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setImagePreview(localPreview);
    setIsUploadingImage(true);

    try {
      const response = await guidesAPI.uploadImage(file);
      const url = response?.data?.url;
      if (!url) {
        throw new Error('Image upload failed');
      }
      onFieldChange('profileImageUrl', url);
      setImagePreview(url);
      setImageSuccess('Uploaded successfully');
    } catch (error) {
      setImagePreview(profileImageUrl || '');
      setImageError(extractErrorMessage(error, 'Failed to upload image'));
    } finally {
      URL.revokeObjectURL(localPreview);
      setIsUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleVideoSelected = async (file) => {
    if (!file) return;

    setVideoError('');
    setVideoSuccess('');
    setVideoLoadError('');

    if (!file.type.startsWith('video/')) {
      setVideoError('Please choose a valid video file.');
      if (videoInputRef.current) videoInputRef.current.value = '';
      return;
    }

    if (file.size > VIDEO_MAX_BYTES) {
      setVideoError('Video must be 25MB or smaller.');
      if (videoInputRef.current) videoInputRef.current.value = '';
      return;
    }

    try {
      await validateVideoDuration(file);
    } catch (error) {
      setVideoPreview(introVideoUrl || '');
      setVideoError(error.message || 'Video must be under 30 seconds');
      if (videoInputRef.current) videoInputRef.current.value = '';
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setVideoPreview(localPreview);
    setIsUploadingVideo(true);

    try {
      const response = await guidesAPI.uploadVideo(file);
      const url = response?.data?.url;
      if (!url) {
        throw new Error('Video upload failed');
      }
      onFieldChange('introVideoUrl', url);
      setVideoPreview(url);
      setVideoSuccess('Uploaded successfully');
      setVideoLoadError('');
    } catch (error) {
      setVideoPreview(introVideoUrl || '');
      setVideoError(extractErrorMessage(error, 'Failed to upload video'));
    } finally {
      URL.revokeObjectURL(localPreview);
      setIsUploadingVideo(false);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <PhotoIcon className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-200">Profile Image</p>
            <p className="text-xs text-slate-500">5MB max. Cropped cleanly on cards and profile views.</p>
          </div>
        </div>

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleImageSelected(e.target.files?.[0])}
        />

        <div className="rounded-2xl border border-dashed border-white/12 bg-navy-900/40 p-3">
          {imagePreview ? (
            <img
              src={fullImageUrl}
              alt="Guide preview"
              className="w-full h-[200px] rounded-xl object-cover object-center"
              onError={(event) => {
                event.currentTarget.src = defaultAvatarUrl;
              }}
            />
          ) : (
            <div className="h-[200px] w-full rounded-2xl bg-white/5 flex items-center justify-center text-center px-6">
              <div>
                <PhotoIcon className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-300">Upload a polished profile image</p>
                <p className="text-xs text-slate-500 mt-1">No stretching, centered crop, premium card fit</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={openImagePicker}
            disabled={isUploadingImage}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-cyan-500/30 bg-cyan-500/8 text-cyan-300 hover:bg-cyan-500/15 transition-all disabled:opacity-50"
          >
            <ArrowPathIcon className="h-4 w-4" />
            {profileImageUrl ? 'Replace Image' : 'Upload Image'}
          </button>
          {profileImageUrl && (
            <button
              type="button"
              onClick={clearImage}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 transition-all"
            >
              <TrashIcon className="h-4 w-4" />
              Remove Image
            </button>
          )}
        </div>

        <p className="mt-3 text-xs text-slate-500">
          {isUploadingImage ? 'Uploading image...' : imageSuccess || 'This image will be shown with a fixed cover crop.'}
        </p>
        {imageError && <p className="mt-2 text-xs text-red-400">{imageError}</p>}
      </div>

      <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <FilmIcon className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-200">Intro Video</p>
            <p className="text-xs text-slate-500">30 seconds max, 25MB max. Re-upload anytime.</p>
          </div>
        </div>

        <input
          ref={videoInputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm,video/ogg"
          className="hidden"
          onChange={(e) => handleVideoSelected(e.target.files?.[0])}
        />

        <div className="rounded-2xl border border-dashed border-white/12 bg-navy-900/40 p-3">
          {videoPreview ? (
            <video
              controls
              className="w-full h-[200px] rounded-xl bg-black"
              preload="metadata"
              onError={() => setVideoLoadError('Video failed to load. Please re-upload.')}
            >
              <source src={fullVideoUrl} type="video/mp4" />
              Your browser does not support video.
            </video>
          ) : (
            <div className="h-[200px] w-full rounded-2xl bg-white/5 flex items-center justify-center text-center px-6">
              <div>
                <PlayCircleIcon className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-300">Upload a short intro video</p>
                <p className="text-xs text-slate-500 mt-1">Validated before upload so over-length files never leave the browser</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={openVideoPicker}
            disabled={isUploadingVideo}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/8 text-emerald-300 hover:bg-emerald-500/15 transition-all disabled:opacity-50"
          >
            <ArrowPathIcon className="h-4 w-4" />
            {videoError ? 'Re-upload Video' : introVideoUrl ? 'Replace Video' : 'Upload Video'}
          </button>
          {introVideoUrl && (
            <button
              type="button"
              onClick={clearVideo}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 transition-all"
            >
              <TrashIcon className="h-4 w-4" />
              Remove Video
            </button>
          )}
        </div>

        <p className="mt-3 text-xs text-slate-500">
          {isUploadingVideo ? 'Uploading video...' : videoSuccess || 'Travelers will see this intro in your guide card and profile.'}
        </p>
        {videoError && <p className="mt-2 text-xs text-red-400">{videoError}</p>}
        {!videoError && videoLoadError && <p className="mt-2 text-xs text-red-400">{videoLoadError}</p>}
      </div>
    </div>
  );
};

export default GuideMediaFields;
