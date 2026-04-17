import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { storiesAPI } from '../services/api';

const StoryDetailPage = () => {
  const { id } = useParams();

  const { data, isLoading, error } = useQuery(
    ['story', id],
    () => storiesAPI.getById(Number(id)).then((r) => r.data),
    { enabled: !!id }
  );

  const story = data;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Story</h1>

        {isLoading && <div className="text-gray-600">Loading...</div>}
        {error && <div className="text-red-600">Failed to load story.</div>}

        {story && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">{story.title}</h2>
            <div className="text-sm text-gray-600 mb-4">
              {story.location ? `Location: ${story.location} • ` : ''}
              {story.guide?.city ? `Guide city: ${story.guide.city}` : ''}
            </div>
            <p className="text-gray-700 whitespace-pre-wrap">{story.content}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryDetailPage;

