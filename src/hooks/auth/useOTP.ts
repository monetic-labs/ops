import { useState } from "react";
import { IssueOTP, VerifyOTP } from "@backpack-fux/pylon-sdk";

import pylon from "@/libs/pylon-sdk"; // Adjust this import path as needed

export function useIssueOTP() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const issueOTP = async (email: string): Promise<IssueOTP | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await pylon.issueOTP({ email });

      setIsLoading(false);

      return response;
    } catch (err) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : "An error occurred");

      return null;
    }
  };

  return { issueOTP, isLoading, error };
}

export function useVerifyOTP() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifyOTP = async (data: VerifyOTP): Promise<VerifyOTP | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await pylon.verifyOTP(data);

      setIsLoading(false);

      return response;
    } catch (err) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : "An error occurred");

      return null;
    }
  };

  return { verifyOTP, isLoading, error };
}
