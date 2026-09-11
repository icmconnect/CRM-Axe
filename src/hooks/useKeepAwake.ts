import { useEffect, useRef } from 'react';

export function useKeepAwake() {
  const wakeLockRef = useRef<any>(null);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;

    async function requestWakeLock() {
      if ('wakeLock' in navigator && isMountedRef.current) {
        try {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        } catch (err) {
          // Silent fallback
        }
      }
    }

    requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMountedRef.current = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current) {
        try {
          wakeLockRef.current.release();
        } catch {}
      }
    };
  }, []);
}

