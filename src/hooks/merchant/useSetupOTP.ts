import { useState, useRef, useCallback } from "react";

import { useIssueOTP, useVerifyOTP } from "@/hooks/auth/useOTP";
import { otpConfig } from "@/config/otp";

export const useSetupOTP = (initialEmail: string) => {
  const [otp, setOtp] = useState("");
  const [isOtpComplete, setIsOtpComplete] = useState(false);
  const [otpSubmitted, setOtpSubmitted] = useState(false);
  const { issueOTP, isLoading: isIssueLoading, error: issueError } = useIssueOTP();
  const { verifyOTP, isLoading: isVerifyLoading, error: verifyError } = useVerifyOTP();
  const otpInputs = useRef<(HTMLInputElement | null)[]>([]);

  const initiateOTP = useCallback(
    async (email: string) => {
      try {
        const response = await issueOTP(email);

        if (response) {
          console.log("OTP issued successfully");

          return true;
        } else {
          console.error("Failed to issue OTP");

          return false;
        }
      } catch (error) {
        console.error("Error issuing OTP:", error);

        return false;
      }
    },
    [issueOTP]
  );

  const handleOtpChange = useCallback(
    (index: number, value: string) => {
      const newOtp = otp.split("");

      newOtp[index] = value;
      const updatedOtp = newOtp.join("");

      setOtp(updatedOtp);

      if (value !== "" && index < otpConfig.length - 1) {
        otpInputs.current[index + 1]?.focus();
      }

      if (updatedOtp.length === otpConfig.length) {
        setIsOtpComplete(true);
        setTimeout(() => setIsOtpComplete(false), 1000);
        handleVerify(updatedOtp);
      } else {
        setIsOtpComplete(false);
      }
    },
    [otp]
  );

  const handleVerify = useCallback(
    async (otpValue: string) => {
      if (otpValue.length === otpConfig.length) {
        setOtpSubmitted(true);
        const response = await verifyOTP({ email: initialEmail, otp: otpValue });

        if (response) {
          console.log("OTP verified successfully");
          // Handle successful verification (e.g., move to next step)
        }
        setOtp("");
        otpInputs.current[0]?.focus();
        setTimeout(() => setOtpSubmitted(false), 2000);
      }
    },
    [initialEmail, verifyOTP]
  );

  const handleResendOTP = useCallback(async () => {
    await issueOTP(initialEmail);
  }, [initialEmail, issueOTP]);

  return {
    otp,
    isOtpComplete,
    otpSubmitted,
    otpInputs,
    handleOtpChange,
    handleVerify,
    handleResendOTP,
    isIssueLoading,
    issueError,
    verifyError,
    initiateOTP,
  };
};
