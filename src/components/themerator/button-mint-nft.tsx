import React, { useState } from 'react';
import { mintNFT } from './mintNFT';

interface MintNFTButtonProps {
  theme: any;
}

export default function MintNFTButton({ theme }: MintNFTButtonProps) {
  const [isMinting, setIsMinting] = useState(false);
  const [mintResult, setMintResult] = useState<any>(null);

  const handleMint = async () => {
    setIsMinting(true);
    try {
      const result = await mintNFT(theme);
      setMintResult(result);
      if (result.success) {
        console.log(`NFT minted with token ID: ${result.tokenId}`);
        // Handle successful minting (e.g., show success message, update UI)
      } else {
        console.error('Minting failed:', result.error);
        // Handle minting failure (e.g., show error message)
      }
    } catch (error) {
      console.error('Error during minting:', error);
      // Handle unexpected errors
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleMint}
        disabled={isMinting}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        {isMinting ? 'Minting...' : 'Mint Design as NFT'}
      </button>
      {mintResult && (
        <div className="mt-2">
          {mintResult.success 
            ? `NFT minted successfully! Token ID: ${mintResult.tokenId}` 
            : `Minting failed: ${mintResult.error}`}
        </div>
      )}
    </div>
  );
}