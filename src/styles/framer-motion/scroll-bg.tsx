"use client";

import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useWindowSize } from "@/hooks/useWindowSize";
import { useTheme } from "next-themes";

const bgCelestial = "/bg-celestial.png";
const bgCelestialMobile = "/bg-celestial-mobile.png";
const bgCelestialLight = "/bg-celestial-light.png";
const bgCelestialLightMobile = "/bg-celestial-light-mobile.png";

const ScrollBackground: React.FC = () => {
  const { scrollY } = useScroll();
  const { height, width } = useWindowSize();
  const { theme } = useTheme();
  const isMobile = width <= 768;
  const isDark = theme === 'dark';

  // Subtle parallax effect
  const yRange = height * 0.2;
  const y = useTransform(scrollY, [0, height], [0, yRange]);

  // Scale slightly larger to prevent edges
  const scale = useTransform(
    scrollY,
    [0, height],
    [1.05, 1.1]
  );

  const getBgImage = () => {
    if (isDark) {
      return isMobile ? bgCelestialMobile : bgCelestial;
    }
    return isMobile ? bgCelestialLightMobile : bgCelestialLight;
  };

  return (
    <motion.div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        backgroundImage: `url(${getBgImage()})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        y,
        scale,
        transformOrigin: "center",
        zIndex: -1,
      }}
    />
  );
};

export default ScrollBackground;
