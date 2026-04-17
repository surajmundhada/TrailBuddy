import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { storiesAPI } from '../services/api';
import { ArrowLeftIcon, MapPinIcon } from '@heroicons/react/24/outline';

const StoryDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery(
    ['story', id],
    () => storiesAPI.getById(Number(id)).then((r) => r.data),
    { enabled: !!id }
  );

  const story = data;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-cyan-400 transition-colors mb-6"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Stories
      </button>

      {isLoading && (
        <div className="flex items-center gap-2 text-slate-500 text-sm py-8">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-cyan-400" />
          Loading story...
        </div>
      )}
      {error && (
        <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
          Failed to load story.
        </div>
      )}

      {story && (
        <div className="glass rounded-2xl border border-white/6 p-6 sm:p-8">
          {/* Meta */}
          {(story.location || story.guide?.city) && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
              <MapPinIcon className="h-3.5 w-3.5" />
              {story.location && <span>{story.location}</span>}
              {story.location && story.guide?.city && <span className="text-slate-600">•</span>}
              {story.guide?.city && <span>{story.guide.city}</span>}
            </div>
          )}

          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6 leading-snug">
            {story.title}
          </h1>

          <div className="border-t border-white/6 pt-6">
            <p className="text-slate-300 whitespace-pre-wrap leading-relaxed text-sm sm:text-base">
              {story.content}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryDetailPage;
