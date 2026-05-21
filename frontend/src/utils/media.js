/**
 * Helper to resolve media URLs dynamically.
 * If the path is a Cloudinary secure URL (starts with http/https), it returns the path as-is.
 * Otherwise, it prepends the backend media url link.
 * @param {string} path - The stored file link/path
 * @returns {string} - The fully resolved URL
 */
export const getMediaUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${process.env.REACT_APP_MEDIA_LINK}/${path}`;
};
