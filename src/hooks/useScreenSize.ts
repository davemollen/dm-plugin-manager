import { useState, useEffect } from 'react';
import { useDebounce } from './useDebounce';

export function useScreenSize() {
  const [screenSize, setScreenSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const debouncedScreenSize = useDebounce(screenSize, 50);

  useEffect(() => {
    function handleResize() {
        setScreenSize({
            width: window.innerWidth,
            height: window.innerHeight,
        });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return debouncedScreenSize;
};