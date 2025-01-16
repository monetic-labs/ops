"use client";

import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";

import { useWindowSize } from "@/hooks/useWindowSize";

const bgCelestial = "/bg-celestial.png";
const bgCelestialMobile = "/bg-celestial-mobile.png";

const ScrollBackground: React.FC = () => {
  const { scrollY } = useScroll();
  const { height, width } = useWindowSize();
  const isMobile = width <= 768;

  // Subtle parallax effect
  const yRange = height * 0.2;
  const y = useTransform(scrollY, [0, height], [0, yRange]);

  // Scale slightly larger to prevent edges
  const scale = useTransform(scrollY, [0, height], [1.05, 1.1]);

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
        backgroundImage: `url(${isMobile ? bgCelestialMobile : bgCelestial})`,
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
