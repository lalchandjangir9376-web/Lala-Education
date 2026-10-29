/**
 * Lala Education App - Universal YouTube Utility
 * Extracts video IDs, generates standard privacy-enhanced embed URLs,
 * provides direct watch URLs, and creates reliable thumbnails.
 */

export interface ParsedYouTube {
  isValid: boolean;
  videoId: string | null;
  embedUrl: string;
  watchUrl: string;
  thumbnailUrl: string;
}

export function extractYouTubeId(input: string | undefined | null): string | null {
  if (!input) return null;
  const str = input.trim();

  // If already an 11-character YouTube video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) {
    return str;
  }

  // Common YouTube URL regex patterns
  // Handles:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://m.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  // - https://www.youtube-nocookie.com/embed/VIDEO_ID
  // - https://www.youtube.com/shorts/VIDEO_ID
  // - https://www.youtube.com/live/VIDEO_ID
  // - https://www.youtube.com/v/VIDEO_ID
  // - Query strings with &v=VIDEO_ID or ?v=VIDEO_ID
  const patterns: RegExp[] = [
    /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+?&v=|shorts\/|live\/))([a-zA-Z0-9_-]{11})/i,
    /[?&]v=([a-zA-Z0-9_-]{11})/i,
  ];

  for (const pattern of patterns) {
    const match = str.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

export function parseYouTubeVideo(rawUrl: string | undefined | null): ParsedYouTube {
  const fallbackThumbnail = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80';
  if (!rawUrl) {
    return {
      isValid: false,
      videoId: null,
      embedUrl: '',
      watchUrl: '',
      thumbnailUrl: fallbackThumbnail,
    };
  }

  const videoId = extractYouTubeId(rawUrl);
  if (!videoId) {
    return {
      isValid: false,
      videoId: null,
      embedUrl: rawUrl,
      watchUrl: rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`,
      thumbnailUrl: fallbackThumbnail,
    };
  }

  // youtube-nocookie is best for privacy, avoids iframe third-party cookie restrictions
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1&enablejsapi=1`;
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  return {
    isValid: true,
    videoId,
    embedUrl,
    watchUrl,
    thumbnailUrl,
  };
}
