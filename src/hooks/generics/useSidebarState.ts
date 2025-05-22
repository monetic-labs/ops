import { useState, useEffect, useCallback } from "react";

const LOCAL_STORAGE_KEY = "sidebarCollapsed";
const SIDEBAR_WIDTH_COLLAPSED = "80px"; // Corresponds to w-20 (5rem)
const SIDEBAR_WIDTH_EXPANDED = "256px"; // Corresponds to w-64 (16rem)

export function useSidebarState(defaultCollapsed = false) {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const storedValue = localStorage.getItem(LOCAL_STORAGE_KEY);
      const initialCollapsed = storedValue ? JSON.parse(storedValue) : defaultCollapsed;
      // Set initial CSS variable
      document.documentElement.style.setProperty(
        "--sidebar-width",
        initialCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED
      );
      return initialCollapsed;
    }
    return defaultCollapsed;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(isCollapsed));
      // Update CSS variable when isCollapsed changes
      document.documentElement.style.setProperty(
        "--sidebar-width",
        isCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED
      );
    }
  }, [isCollapsed]);

  const toggleSidebar = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === LOCAL_STORAGE_KEY && event.newValue !== null) {
        const newCollapsedState = JSON.parse(event.newValue);
        setIsCollapsed(newCollapsedState);
        // Update CSS variable on storage change too
        document.documentElement.style.setProperty(
          "--sidebar-width",
          newCollapsedState ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED
        );
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return { isCollapsed, toggleSidebar };
}
