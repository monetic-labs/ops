import { useCallback } from "react";

import { useSupportScreenshot } from "./useSupportService";

interface UseScreenshotOptions {
  drawerRef: React.RefObject<HTMLElement>;
}

export const useScreenshot = ({ drawerRef }: UseScreenshotOptions) => {
  const { captureScreenshot } = useSupportScreenshot();

  const createFlashEffect = () => {
    const flash = document.createElement("div");

    flash.style.position = "fixed";
    flash.style.top = "0";
    flash.style.left = "0";
    flash.style.width = "100%";
    flash.style.height = "100%";
    flash.style.backgroundColor = "white";
    flash.style.opacity = "0";
    flash.style.zIndex = "9999";
    flash.style.pointerEvents = "none";
    flash.style.transition = "opacity 200ms ease-out";
    document.body.appendChild(flash);

    // Trigger flash effect
    requestAnimationFrame(() => {
      flash.style.opacity = "0.3";
      setTimeout(() => {
        flash.style.opacity = "0";
        setTimeout(() => {
          document.body.removeChild(flash);
        }, 200);
      }, 100);
    });
  };

  const takeScreenshot = useCallback(async () => {
    // Hide the entire drawer and any open modals/popovers
    if (drawerRef.current) {
      drawerRef.current.style.visibility = "hidden";
      drawerRef.current.style.opacity = "0";
      drawerRef.current.style.pointerEvents = "none";
    }

    // Hide all modals and popovers
    const modals = document.querySelectorAll('[role="dialog"], [role="presentation"]');
    const hiddenModals = Array.from(modals).map((modal) => {
      const element = modal as HTMLElement;
      const prevDisplay = element.style.display;

      element.style.display = "none";

      return { element, prevDisplay };
    });

    try {
      // Create flash effect
      createFlashEffect();

      // Small delay to ensure flash effect is visible
      await new Promise((resolve) => setTimeout(resolve, 100));

      const accessUrl = await captureScreenshot();

      return accessUrl;
    } finally {
      // Show the drawer again
      if (drawerRef.current) {
        drawerRef.current.style.visibility = "";
        drawerRef.current.style.opacity = "";
        drawerRef.current.style.pointerEvents = "";
      }

      // Restore all modals and popovers
      hiddenModals.forEach(({ element, prevDisplay }) => {
        element.style.display = prevDisplay;
      });
    }
  }, [drawerRef, captureScreenshot]);

  return { takeScreenshot };
};
