import { useEffect, useState } from 'react';

function readViewportWidth() {
  if (typeof window === 'undefined') return 1280;
  return window.innerWidth || 1280;
}

export function useViewport() {
  const [width, setWidth] = useState(readViewportWidth);

  useEffect(() => {
    const onResize = () => setWidth(readViewportWidth());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return {
    width,
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
  };
}
