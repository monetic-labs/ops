import { useState, useCallback } from "react";
import { VerifyOTP } from "@backpack-fux/pylon-sdk";

import pylon from "@/libs/pylon-sdk";

interface OTPState {
  isLoading: boolean;
  error: string | null;
  otpSent: boolean;
  otp: string;
}

export function useOTP(inputRef: React.RefObject<HTMLInputElement>) {
  const [state, setState] = useState<OTPState>({
    isLoading: false,
    error: null,
    otpSent: false,
    otp: "",
  });

  const setOTP = useCallback((value: string) => {
    setState((prev) => ({
      ...prev,
      otp: value,
      error: null,
    }));
  }, []);

  const issueOTP = useCallback(async (email: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await pylon.initiateLoginOTP({ email });

      setState((prev) => ({
        ...prev,
        otpSent: response.statusCode === 200,
      }));

      return response.statusCode;
    } catch (err: any) {
      if (err.response?.status === 404) {
        throw { statusCode: 404, message: "User not found" };
      }
      setState((prev) => ({
        ...prev,
        error: err.message || "Failed to send OTP",
      }));
      throw err;
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const verifyOTP = useCallback(async (data: VerifyOTP) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await pylon.verifyLoginOTP(data);
      const isValid = Boolean(response.data.message);

      if (isValid) {
        setState((prev) => ({
          ...prev,
          isLoading: true,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          error: "Incorrect OTP",
          isLoading: false,
        }));

        setTimeout(() => {
          setState((prev) => ({
            ...prev,
            otp: "",
            error: null,
          }));
          inputRef.current?.focus();
        }, 1000);
      }

      return isValid;
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: "Incorrect OTP",
        isLoading: false,
      }));

      return false;
    }
  }, []);

  const resetState = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      otpSent: false,
      otp: "",
    });
  }, []);

  return {
    ...state,
    setOTP,
    issueOTP,
    verifyOTP,
    resetState,
  };
}
