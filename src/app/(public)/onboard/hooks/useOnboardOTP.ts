import { useState, useEffect } from "react";

import { useOTP } from "@/hooks/auth/useOTP";
import { isLocal, isTesting } from "@/utils/helpers";

export const useOnboardOTP = (otpInputRef: React.RefObject<HTMLInputElement>) => {
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(true);

  const {
    otp,
    setOTP,
    isLoading: isOTPLoading,
    error: otpError,
    issueOTP,
    verifyOTP,
    resetState,
  } = useOTP(otpInputRef);

  const handleOTPSubmit = async (email: string) => {
    if (otp.length === 6) {
      const success = await verifyOTP({
        email,
        otp,
      });

      if (success) {
        setShowOTPModal(false);
        resetState();

        return true;
      }
    }

    return false;
  };

  const handleResendOTP = async (email: string) => {
    if (email && canResend) {
      if (!isLocal && !isTesting) {
        setCanResend(false);
        setResendTimer(30);
      }
      resetState();
      await issueOTP(email);
    }
  };

  const initiateOTP = async (email: string) => {
    setShowOTPModal(true);
    await issueOTP(email);
    if (!isLocal && !isTesting) {
      setCanResend(false);
      setResendTimer(30);
    }
  };

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
    showOTPModal,
    setShowOTPModal,
    otp,
    setOTP,
    isOTPLoading,
    otpError,
    canResend,
    resendTimer,
    handleOTPSubmit,
    handleResendOTP,
    initiateOTP,
  };
};
