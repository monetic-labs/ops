'use client';

import React from 'react';
import ScrollBackground from './scroll-bg';

const PageWithScrollBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      <ScrollBackground />
      {children}
    </>
  );
};

export default PageWithScrollBackground;