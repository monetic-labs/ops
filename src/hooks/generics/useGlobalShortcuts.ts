import { useEffect } from 'react';

interface ShortcutOptions {
  isEnabled?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
}

export function useGlobalShortcuts(
  key: string,
  callback: () => void,
  options: ShortcutOptions = {}
) {
  useEffect(() => {
    const { isEnabled = true, metaKey = false, altKey = false, shiftKey = false } = options;

    if (!isEnabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() === key.toLowerCase() &&
        event.metaKey === metaKey &&
        event.altKey === altKey &&
        event.shiftKey === shiftKey
      ) {
        event.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [key, callback, options]);
}