"use client";

import { useState } from 'react';
import pylon from '@/libs/pylon-sdk';

type IssueOTPResponse = {
  email: string;
  otp: string;
};

export function useLogin() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [otpResponse, setOtpResponse] = useState<IssueOTPResponse | null>(null);

    const login = async (email: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await pylon.auth.initiateOTP();
            setOtpResponse(response);
        } catch (err) {
            if (err instanceof Error) {
                if (err.message === 'User not found') {
                    setError('User not found');
                } else {
                    setError('Failed to initiate login');
                }
            } else {
                setError('An unexpected error occurred');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return { login, isLoading, error, otpResponse };
}