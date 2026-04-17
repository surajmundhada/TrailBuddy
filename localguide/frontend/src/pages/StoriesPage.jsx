import React, { useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { useAuth } from '../context/AuthContext';
import { storiesAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

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
      setCreateData({
        title: '',
        content: '',
        location: '',
        images: [],
        tags: ['heritage'],
        isPublic: true,
      });
      await refetch();
    } catch (e) {
      toast.error(e?.response?.data || 'Failed to create story');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Local Stories</h1>

        {canCreate && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Create a story</h2>
            <form onSubmit={onCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  value={createData.title}
                  onChange={(e) => setCreateData({ ...createData, title: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Sunset heritage walk"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Content</label>
                <textarea
                  value={createData.content}
                  onChange={(e) => setCreateData({ ...createData, content: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={5}
                  placeholder="Write your story..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Location (optional)</label>
                <input
                  value={createData.location}
                  onChange={(e) => setCreateData({ ...createData, location: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="City/area"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
              >
                Publish
              </button>
            </form>
          </div>
        )}

        {isLoading && <div className="text-gray-600">Loading stories...</div>}
        {error && <div className="text-red-600">Failed to load stories.</div>}
        {!isLoading && !error && stories.length === 0 && (
          <div className="text-gray-600">No stories yet.</div>
        )}

        {!isLoading && !error && stories.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stories.map((s) => (
              <div key={s.id} className="bg-white rounded-lg shadow p-6">
                <div className="text-sm text-gray-500 mb-2">
                  {s.location ? s.location : '—'} • {s.guide?.city ? s.guide.city : 'Guide'}
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">{s.title}</h2>
                <p className="text-gray-700 text-sm line-clamp-4 mb-4">{s.content}</p>
                <button
                  className="text-blue-600 hover:text-blue-700 font-medium"
                  onClick={() => navigate(`/stories/${s.id}`)}
                >
                  Read more
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StoriesPage;

