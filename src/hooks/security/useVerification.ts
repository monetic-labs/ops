import { useState } from "react";

export const useVerification = () => {
  const [currentEmail, setCurrentEmail] = useState("");
  const [verifyingEmail, setVerifyingEmail] = useState<string | null>(null);
  const [otpValue, setOtpValue] = useState("");
  const [currentPhone, setCurrentPhone] = useState("");
  const [verifyingPhone, setVerifyingPhone] = useState<string | null>(null);
  const [phoneOtpValue, setPhoneOtpValue] = useState("");

  const clearEmailVerification = () => {
    setVerifyingEmail(null);
    setOtpValue("");
    setCurrentEmail("");
  };

  const clearPhoneVerification = () => {
    setVerifyingPhone(null);
    setPhoneOtpValue("");
    setCurrentPhone("");
  };

  return {
    emailVerification: {
      currentEmail,
      verifyingEmail,
      otpValue,
      setCurrentEmail,
      setVerifyingEmail,
      setOtpValue,
      clearEmailVerification,
    },
    phoneVerification: {
      currentPhone,
      verifyingPhone,
      phoneOtpValue,
      setCurrentPhone,
      setVerifyingPhone,
      setPhoneOtpValue,
      clearPhoneVerification,
    },
  };
};
