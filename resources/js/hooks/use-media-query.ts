import { useState, useEffect } from 'react';

/**
 * A custom React hook that tracks the state of a CSS media query.
 * @param {string} query - The media query string to watch.
 * @returns {boolean} - True if the media query matches, false otherwise.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Ensure window is defined (for SSR)
    if (typeof window === 'undefined') {
      return;
    }

    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => {
      setMatches(media.matches);
    };
    
    // Add event listener
    try {
      media.addEventListener('change', listener);
    } catch (e) {
        // Safari < 14 uses addListener
      media.addListener(listener);
    }
    
    // Cleanup
    return () => {
        try {
            media.removeEventListener('change', listener);
        } catch(e) {
            media.removeListener(listener);
        }
    };
  }, [matches, query]);

  return matches;
} 