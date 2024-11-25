import { useState, useCallback, useEffect } from "react";

const MIN_WIDTH = 320;
const MAX_WIDTH = 1200;
const DEFAULT_WIDTH = 1000;
const STORAGE_KEY = 'chat-pane-width';
const TRANSITION_DURATION = 300;

export const useResizePanel = (initialWidth = DEFAULT_WIDTH) => {
  const [isResizing, setIsResizing] = useState(false);
  const [width, setWidth] = useState(() => {
    if (typeof window === 'undefined') return initialWidth;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? parseInt(stored, 10) : initialWidth;
  });

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    if (!isResizing) return;
    setIsResizing(false);
    localStorage.setItem(STORAGE_KEY, width.toString());
  }, [isResizing, width]);

  const resize = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    const newWidth = Math.min(Math.max(e.clientX, MIN_WIDTH), MAX_WIDTH);
    setWidth(newWidth);
  }, [isResizing]);

  useEffect(() => {
    if (!isResizing) return;

    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);

    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  return {
    width,
    isResizing,
    resizeHandleProps: {
      onMouseDown: startResizing,
    },
  };
};