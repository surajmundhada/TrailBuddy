import React, { useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { useAuth } from '../context/AuthContext';
import { storiesAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { DocumentTextIcon, MapPinIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

const StoriesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const normalizedRoles = Array.isArray(user?.roles)
    ? user.roles.map((r) => (typeof r === 'string' ? r : r?.name)).filter(Boolean)
    : [];

  const { data, isLoading, error, refetch } = useQuery(
    ['stories', 0, 20],
    () => storiesAPI.getAll({ page: 0, size: 20 }).then((r) => r.data),
    { retry: 1 }
  );

  const stories = useMemo(() => data?.content ?? [], [data]);

  const [createData, setCreateData] = useState({
    title: '',
    content: '',
    location: '',
    images: [],
    tags: ['heritage'],
    isPublic: true,
  });

  const canCreate = normalizedRoles.includes('GUIDE');

  const onCreate = async (e) => {
    e.preventDefault();
    if (!createData.title.trim() || !createData.content.trim()) {
      toast.error('Title and content are required');
      return;
    }
    try {
      await storiesAPI.create({
        ...createData,
        tags: Array.isArray(createData.tags) ? createData.tags : [createData.tags],
        images: Array.isArray(createData.images) ? createData.images : [],
      });
      toast.success('Story created');
      setCreateData({ title: '', content: '', location: '', images: [], tags: ['heritage'], isPublic: true });
      await refetch();
    } catch (e) {
      toast.error(e?.response?.data || 'Failed to create story');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-primary-400 bg-clip-text text-transparent">
          Local Stories
        </h1>
        <p className="mt-2 text-slate-400 text-sm">
          Real experiences from guides and travelers across India.
        </p>
      </div>

      {/* Create Story (Guide only) */}
      {canCreate && (
        <div className="glass rounded-2xl border border-white/6 p-6 mb-8">
          <h2 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
            <DocumentTextIcon className="h-5 w-5 text-cyan-400" />
            Share a story
          </h2>
          <form onSubmit={onCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Title</label>
              <input
                value={createData.title}
                onChange={(e) => setCreateData({ ...createData, title: e.target.value })}
                className="input-dark"
                placeholder="e.g., Sunrise heritage walk in Old Delhi"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Story</label>
              <textarea
                value={createData.content}
                onChange={(e) => setCreateData({ ...createData, content: e.target.value })}
                className="input-dark resize-none"
                rows={5}
                placeholder="Write your story..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Location <span className="text-slate-500">(optional)</span></label>
              <input
                value={createData.location}
                onChange={(e) => setCreateData({ ...createData, location: e.target.value })}
                className="input-dark"
                placeholder="City / area"
              />
            </div>
            <button
              type="submit"
              className="btn-cyan font-semibold text-sm px-6 py-2.5 rounded-xl"
            >
              Publish Story
            </button>
          </form>
        </div>
      )}

      {/* States */}
      {isLoading && (
        <div className="flex items-center gap-2 text-slate-500 text-sm py-8">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-cyan-400" />
          Loading stories...
        </div>
      )}
      {error && (
        <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
          Failed to load stories.
        </div>
      )}
      {!isLoading && !error && stories.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center mb-4">
            <DocumentTextIcon className="h-7 w-7 text-slate-600" />
          </div>
          <p className="text-slate-500 text-sm">No stories yet. Be the first to share one!</p>
        </div>
      )}

      {/* Story Grid */}
      {!isLoading && !error && stories.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {stories.map((s) => (
            <div key={s.id} className="card-dark rounded-2xl border border-white/6 p-6 flex flex-col">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                {s.location && (
                  <>
                    <MapPinIcon className="h-3.5 w-3.5" />
                    <span>{s.location}</span>
                    <span className="text-slate-600">•</span>
                  </>
                )}
                <span>{s.guide?.city || 'Guide'}</span>
              </div>
              <h2 className="text-lg font-semibold text-white mb-2 leading-snug">{s.title}</h2>
              <p className="text-slate-400 text-sm line-clamp-4 leading-relaxed flex-1 mb-4">{s.content}</p>
              <button
                className="self-start inline-flex items-center gap-1.5 text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
                onClick={() => navigate(`/stories/${s.id}`)}
              >
                Read more <ArrowRightIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StoriesPage;
