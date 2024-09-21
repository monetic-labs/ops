"use client";

import React from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import bgCelestial from '@/assets/bg-celestial.svg';

const ScrollBackground: React.FC = () => {
  const { scrollY } = useScroll();

  // Parallax effect for the base layer
  const baseLayerY = useTransform(scrollY, [0, 100], ['0%', '10%']);

  // Adding 3D swirling effects for stars and iconography
  const rotate = useTransform(scrollY, [0, 1000], ['0deg', '360deg']);
  const translateX = useTransform(scrollY, [0, 1000], ['0%', '100%']);
  const translateY = useTransform(scrollY, [0, 1000], ['0%', '100%']);

  // Adding a spring to smooth out the motion
  const smoothTranslateX = useSpring(translateX, { stiffness: 50, damping: 20 });
  const smoothTranslateY = useSpring(translateY, { stiffness: 50, damping: 20 });

  return (
    <>
      <motion.div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(${bgCelestial.src})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          y: baseLayerY,
          zIndex: -3,
        }}
      />
      {/* 3D swirling layer */}
      <motion.div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url(/3d-stuff.svg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          rotate,
          x: smoothTranslateX,
          y: smoothTranslateY,
          zIndex: -1,
        }}
      />
    </>
  );
};

export default ScrollBackground;