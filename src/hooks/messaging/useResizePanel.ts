import { useCallback, useEffect } from "react";

import { useMessagingStore, useMessagingActions } from "@/libs/messaging/store";

const MIN_WIDTH = 320;
const MAX_WIDTH = 1200;
const STORAGE_KEY = "chat-pane-width";

export const useResizePanel = () => {
  const { ui: uiActions } = useMessagingActions();
  const { width, isResizing } = useMessagingStore((state) => state.ui);

  // Initialize width from localStorage on mount
  useEffect(() => {
    const storedWidth = localStorage.getItem(STORAGE_KEY);

    if (storedWidth) {
      const parsedWidth = parseInt(storedWidth, 10);

      if (!isNaN(parsedWidth) && parsedWidth >= MIN_WIDTH && parsedWidth <= MAX_WIDTH) {
        uiActions.setWidth(parsedWidth);
      }
    }
  }, [uiActions]);

  const startResizing = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      uiActions.setResizing(true);
    },
    [uiActions]
  );

  const stopResizing = useCallback(() => {
    if (!isResizing) return;
    uiActions.setResizing(false);
    localStorage.setItem(STORAGE_KEY, width.toString());
  }, [isResizing, width, uiActions]);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.min(Math.max(e.clientX, MIN_WIDTH), MAX_WIDTH);

      uiActions.setWidth(newWidth);
    },
    [isResizing, uiActions]
  );

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
      "data-testid": "chat-pane-resize-handle",
    },
  };
};
