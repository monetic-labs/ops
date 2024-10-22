'use client';

import React, { useEffect, useState } from 'react';
import { useUserThemeNFT } from './useUserThemeNFT';
import Configurator from './configurator';
import PreviewComponent from './preview-component';
import MintNFTButton from './button-mint-nft';

const defaultTheme = {
    card: {
      backgroundColor: '#1f1f1f',
      textColor: '#ffffff',
      borderRadius: 8,
    },
    // ... other component themes
  };

export default function Themerator() {
  const { userTheme, isLoading } = useUserThemeNFT();
  const [theme, setTheme] = useState(userTheme || defaultTheme);

  useEffect(() => {
    setTheme(userTheme || defaultTheme);
  }, [userTheme]);

  const handleThemeChange = (newTheme: typeof theme) => {
    setTheme(newTheme);
  };

  if (isLoading) {
    return <div>Loading theme...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Themerator</h1>
      <Configurator theme={theme} onThemeChange={handleThemeChange} />
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Live Preview</h2>
        <PreviewComponent theme={theme} />
      </div>
      <MintNFTButton theme={theme} />
    </div>
  );
}