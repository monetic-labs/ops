"use client";

import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import { XIcon } from "lucide-react";

interface EmailRecoveryProps {
  configuredEmails: { email: string; isVerified: boolean }[];
  emailInput: string;
  setEmailInput: (value: string) => void;
  handleAddEmail: () => Promise<void>;
  handleRemoveEmail: (email: string) => Promise<void>;
}

const EmailRecovery: React.FC<EmailRecoveryProps> = ({
  configuredEmails,
  emailInput,
  setEmailInput,
  handleAddEmail,
  handleRemoveEmail,
}) => {
  return (
    <div className="p-4 space-y-4">
      {/* Show existing email guardians */}
      {configuredEmails.length > 0 && (
        <div className="mb-4 space-y-2">
          {configuredEmails.map((email) => (
            <div key={email.email} className="flex items-center justify-between bg-default-100 p-2.5 rounded-md">
              <span className="text-sm">{email.email}</span>
              <Button
                isIconOnly
                className="min-w-0 h-7 w-7"
                size="sm"
                variant="light"
                onPress={() => handleRemoveEmail(email.email)}
              >
                <XIcon size={16} />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add new email form - simplified without verification */}
      <div className="flex gap-2">
        <Input
          className="flex-grow"
          placeholder="Enter your email address"
          radius="sm"
          size="sm"
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
        />
        <Button
          className="px-4 bg-teal-600 text-white"
          color="primary"
          isDisabled={!emailInput || configuredEmails.some((e) => e.email === emailInput)}
          radius="sm"
          size="md"
          onPress={handleAddEmail}
        >
          Add Email
        </Button>
      </div>
      <p className="text-xs text-foreground/60 mt-2">
        For enhanced security, use emails of trusted friends and family.
      </p>
    </div>
  );
};

export default EmailRecovery;
