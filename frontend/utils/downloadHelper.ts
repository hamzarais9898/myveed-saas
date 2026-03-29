import { saveAs } from 'file-saver';

/**
 * Helper to inject the fl_attachment flag into Cloudinary URLs to force browser download.
 */
const injectCloudinaryAttachment = (url: string): string => {
  if (url.includes('cloudinary.com') && !url.includes('fl_attachment')) {
    return url.replace(/\/upload\//, '/upload/fl_attachment/');
  }
  return url;
};

/**
 * Downloads a remote resource by fetching it as a blob first
 * to avoid CORS-related browser navigation instead of downloading.
 */
export const downloadResource = async (url: string, filename: string) => {
  if (!url) {
    console.error('No URL provided for download');
    return;
  }

  // Optimize Cloudinary URLs to force attachment disposition at the CDN level
  const optimizedUrl = injectCloudinaryAttachment(url);

  try {
    const response = await fetch(optimizedUrl, {
      method: 'GET',
      headers: {},
      mode: 'cors',
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const blob = await response.blob();
    saveAs(blob, filename);
  } catch (error) {
    console.warn('Download failed via fetch, using fallback link method:', error);
    
    // Fallback: simple anchor click. 
    // Thanks to fl_attachment injected above, this should now trigger a download 
    // instead of a redirection even in production.
    const link = document.createElement('a');
    link.href = optimizedUrl;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

/**
 * Generates a clean, standardized filename for maveed assets
 */
export const getMaveedFilename = (
  influencerName: string = 'content',
  type: 'photo' | 'video',
  id?: string
): string => {
  const cleanName = influencerName
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // remove special chars
    .replace(/\s+/g, '-')     // replace spaces with hyphens
    .trim();

  const timestamp = new Date().getTime();
  const shortId = id ? `-${id.slice(-4)}` : '';
  const extension = type === 'photo' ? 'png' : 'mp4';

  return `maveed-${cleanName}-${type}${shortId}-${timestamp}.${extension}`;
};
