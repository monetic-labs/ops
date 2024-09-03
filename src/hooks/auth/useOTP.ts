import { useState } from "react";
import { IssueOTP, VerifyOTP } from "@backpack-fux/pylon-sdk";

import pylon from "@/libs/pylon-sdk";

export function useIssueOTP() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | boolean>(false);

  const issueOTP = async (email: string): Promise<IssueOTP | null> => {
    setIsLoading(true);
    try {
      return await pylon.initiateLoginOTP({ email });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { issueOTP, isLoading, error };
}

export function useVerifyOTP() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | boolean>(false);

  const verifyOTP = async (data: VerifyOTP): Promise<VerifyOTP | null> => {
    setIsLoading(true);
    try {
      const resp = await pylon.verifyLoginOTP(data);
      return resp;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { verifyOTP, isLoading, error };
}
