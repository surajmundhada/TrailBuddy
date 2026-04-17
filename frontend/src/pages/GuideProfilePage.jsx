import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { MapPinIcon, PlayCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { guidesAPI } from '../services/api';
import { defaultAvatarUrl, resolveMediaUrl } from '../utils/media';

const GuideProfilePage = () => {
  const { id } = useParams();
  const [showVideo, setShowVideo] = useState(false);
  const [videoLoadError, setVideoLoadError] = useState('');

  const { data: guide, isLoading, error } = useQuery(
    ['guide-profile', id],
    () => guidesAPI.getById(id).then((r) => r.data),
    { enabled: Boolean(id) }
  );

  const imageUrl = resolveMediaUrl(guide?.profileImageUrl || guide?.user?.profileImageUrl || '');
  const videoUrl = resolveMediaUrl(guide?.introVideoUrl || '');
  const fullName = `${guide?.user?.firstName || 'Guide'} ${guide?.user?.lastName || ''}`.trim();
  console.log('IMAGE URL:', imageUrl);
  console.log('VIDEO URL:', videoUrl);

  if (isLoading) {
    return <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-400">Loading guide profile...</div>;
  }

  if (error || !guide) {
    return <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-red-400">Guide profile not found.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-primary-400 bg-clip-text text-transparent">
          {fullName}
        </h1>
        <p className="mt-2 text-slate-400 text-sm">Local guide profile</p>
      </div>

      <div className="glass rounded-2xl border border-white/6 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={fullName}
            className="w-full h-[220px] object-cover object-center rounded-none"
            onError={(event) => {
              event.currentTarget.src = defaultAvatarUrl;
            }}
          />
        ) : (
          <div className="h-[220px] w-full bg-gradient-to-br from-cyan-500/10 to-primary-500/10 flex items-center justify-center text-cyan-300 text-5xl font-bold">
            {(guide?.user?.firstName?.[0] || 'G').toUpperCase()}
          </div>
        )}

        <div className="p-6 space-y-5">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <MapPinIcon className="h-4 w-4" />
            <span>{guide.city}, {guide.state}</span>
          </div>

          {guide.bio && <p className="text-slate-300 leading-relaxed">{guide.bio}</p>}

          {guide.introVideoUrl && (
            <button
              type="button"
              onClick={() => setShowVideo(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-cyan-300 hover:bg-cyan-500/15 transition-all"
            >
              <PlayCircleIcon className="h-5 w-5" />
              Watch Intro Video
            </button>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
              <p className="text-xs text-slate-500 mb-1">Hourly Rate</p>
              <p className="text-lg font-semibold text-cyan-300">Rs {guide.hourlyRate}</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
              <p className="text-xs text-slate-500 mb-1">Daily Rate</p>
              <p className="text-lg font-semibold text-cyan-300">Rs {guide.dailyRate}</p>
            </div>
          </div>
        </div>
      </div>

      {showVideo && guide.introVideoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setShowVideo(false)} />
          <div className="relative w-full max-w-3xl rounded-3xl border border-white/10 bg-navy-900 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
              <div>
                <h3 className="text-lg font-semibold text-white">{fullName}</h3>
                <p className="text-xs text-slate-400">Guide intro video</p>
              </div>
              <button
                type="button"
                onClick={() => setShowVideo(false)}
                className="h-10 w-10 rounded-full border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:border-white/20 transition-all flex items-center justify-center"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <video
              controls
              autoPlay
              className="w-full rounded-xl max-h-[70vh] bg-black"
              onError={() => setVideoLoadError('Video failed to load. Please re-upload.')}
            >
              <source src={videoUrl} type="video/mp4" />
              Your browser does not support video.
            </video>
            {videoLoadError && <p className="px-5 py-3 text-sm text-red-400">{videoLoadError}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default GuideProfilePage;
