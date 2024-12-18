import { useState } from "react";
import { VerifyOTP } from "@backpack-fux/pylon-sdk";

import pylon from "@/libs/pylon-sdk";

export function useIssueOTP() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const issueOTP = async (email: string): Promise<number | null> => {
    setIsLoading(true);
    try {
      const response = await pylon.initiateLoginOTP({ email });

      return response.statusCode;
    } catch (err: any) {
      if (err.response && err.response.status === 404) {
        throw { statusCode: 404, message: "User not found" };
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { issueOTP, isLoading, error };
}

export function useVerifyOTP() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | boolean>(false);

  const verifyOTP = async (data: VerifyOTP): Promise<number | null> => {
    setIsLoading(true);
    try {
      const resp = await pylon.verifyLoginOTP(data);

      return resp.statusCode;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");

      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { verifyOTP, isLoading, error };
}
