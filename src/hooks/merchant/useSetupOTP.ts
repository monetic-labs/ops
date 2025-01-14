import { useState, useRef, useCallback, useEffect } from "react";
import { useOTP } from "@/hooks/auth/useOTP";
import { OTP_CODE_LENGTH } from "@/utils/constants";
import { isLocal, isTesting } from "@/utils/helpers";

export const useSetupOTP = (initialEmail: string) => {
  const otpInputRef = useRef<HTMLInputElement>(null);
  const { issueOTP, verifyOTP, isLoading, error, otp, setOTP, resetState } = useOTP(otpInputRef);
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(true);
  const shouldEnableTimer = !isLocal && !isTesting;

  const initiateOTP = useCallback(async () => {
    try {
      const response = await issueOTP(initialEmail);
      if (response === 200) {
        if (shouldEnableTimer) {
          setCanResend(false);
          setResendTimer(30);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error issuing OTP:", error);
      return false;
    }
  }, [initialEmail, issueOTP, shouldEnableTimer]);

  const handleVerify = useCallback(async () => {
    if (otp.length === OTP_CODE_LENGTH) {
      const success = await verifyOTP({ email: initialEmail, otp });
      if (success) {
        resetState();
        return true;
      }
    }
    return false;
  }, [initialEmail, otp, verifyOTP, resetState]);

  const handleResendOTP = useCallback(async () => {
    if (canResend) {
      if (shouldEnableTimer) {
        setCanResend(false);
        setResendTimer(30);
      }
      resetState();
      return initiateOTP();
    }
  }, [canResend, shouldEnableTimer, resetState, initiateOTP]);

  // Timer effect
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);

      return () => clearInterval(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  return {
    otp,
    setOTP,
    isLoading,
    error,
    otpInputRef,
    handleVerify,
    handleResendOTP,
    initiateOTP,
    canResend,
    resendTimer,
    shouldEnableTimer,
  };
};
