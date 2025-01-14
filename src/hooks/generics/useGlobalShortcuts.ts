import { useCallback, useEffect } from "react";

interface ShortcutOptions {
  isEnabled?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
}

export function useGlobalShortcuts(key: string, callback: () => void, options: ShortcutOptions = {}) {
  const { isEnabled = true, metaKey = false, altKey = false, shiftKey = false } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() === key.toLowerCase() &&
        event.metaKey === metaKey &&
        event.altKey === altKey &&
        event.shiftKey === shiftKey
      ) {
        event.preventDefault();
        callback();
      }
    },
    [key, callback, metaKey, altKey, shiftKey]
  );

  useEffect(() => {
    if (typeof window === "undefined" || !isEnabled) return;

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown, isEnabled]);
}
