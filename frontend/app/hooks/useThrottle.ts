import { useRef, useCallback } from 'react';

export function useThrottle<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  const lastCallRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastArgsRef = useRef<Parameters<T>>();

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallRef.current;

      if (timeSinceLastCall >= delay) {
        lastCallRef.current = now;
        callback(...args);
      } else {
        lastArgsRef.current = args;
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          lastCallRef.current = Date.now();
          if (lastArgsRef.current) {
            callback(...lastArgsRef.current);
          }
        }, delay - timeSinceLastCall);
      }
    },
    [callback, delay]
  ) as T;
} 