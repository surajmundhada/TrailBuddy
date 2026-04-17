const MEDIA_BASE_URL = 'http://localhost:8080';

export const resolveMediaUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }

  const normalized = url.startsWith('/') ? url : `/${url}`;
  if (normalized.startsWith('/uploads/')) {
    return `${MEDIA_BASE_URL}${normalized}`;
  }
  return `${MEDIA_BASE_URL}${normalized}`;
};

export const defaultAvatarUrl = '/default-avatar.svg';
