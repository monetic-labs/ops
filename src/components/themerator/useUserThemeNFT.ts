import { useEffect, useState } from 'react';

// Default theme to use if no NFT is found
const defaultTheme = {
  colors: {
    primary: '#ff00c7',
    background: '#ffffff',
  },
  fonts: {
    sans: 'Inter, sans-serif',
  },
  logo: '/default-logo.png',
};

// Mocked NFT theme
const mockedNFTTheme = {
  colors: {
    primary: '#00ff00',
    background: '#f0f0f0',
  },
  fonts: {
    sans: 'Roboto, sans-serif',
  },
  logo: '/mocked-nft-logo.png',
};

// Simulated delay to mimic blockchain interaction
const SIMULATED_DELAY = 1000; // 1 second

export function useUserThemeNFT() {
  const [userTheme, setUserTheme] = useState(defaultTheme);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUserNFT() {
      setIsLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));

      // Simulate a 50% chance of finding an NFT
      const hasNFT = Math.random() < 0.5;

      if (hasNFT) {
        console.log('Mocked NFT theme found');
        setUserTheme(mockedNFTTheme);
      } else {
        console.log('No NFT theme found, using default');
        setUserTheme(defaultTheme);
      }

      setIsLoading(false);
    }

    fetchUserNFT();
  }, []);

  return { userTheme, isLoading };
}

// This function is no longer needed in the mocked version
// function parseMetadataToTheme(metadata: any) {
//   ...
// }