import React, { useEffect, useRef } from "react";
import { Client } from "persona";

interface PersonaVerificationProps {
  kycLink: string;
  onComplete: (inquiryId: string, status: string) => void;
  onCancel: () => void;
  onError: (error: any) => void;
}

const PersonaVerification: React.FC<PersonaVerificationProps> = ({ kycLink, onComplete, onCancel, onError }) => {
  const personaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (kycLink && personaRef.current) {
      const url = new URL(kycLink);
      const templateId = url.searchParams.get("inquiry-template-id");
      const environmentId = url.searchParams.get("environment-id");
      const developerId = url.searchParams.get("developer-id");
      const referenceId = url.searchParams.get("reference-id");

      if (templateId && environmentId && referenceId && developerId) {
        const client = new Client({
          templateId: templateId,
          environmentId: environmentId,
          referenceId: referenceId,
          fields: {
            developer_id: developerId,
          },
          onComplete: ({ inquiryId, status }) => {
            onComplete(inquiryId, status);
          },
          onCancel,
          onError,
        });

        client.open();
      }
    }
  }, [kycLink, onComplete, onCancel, onError]);

  return <div ref={personaRef} className="w-full h-96" />;
};

export default PersonaVerification;
