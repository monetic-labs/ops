"use client";

import { useState } from 'react';
import pylon from '@/libs/pylon-sdk';

export function useVerify() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verify = async (email: string, otp: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await pylon.auth.verifyLoginOTP(email, otp);
    } catch (err) {
      setError('Failed to verify OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return { verify, isLoading, error };
}
