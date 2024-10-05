// import React, { useState } from "react";
// import { Button } from "@nextui-org/button";
// import { MerchantCreateOutput } from "@backpack-fux/pylon-sdk";
// import dynamic from "next/dynamic";

// const PersonaVerification = dynamic(() => import("./persona-verification"), { ssr: false });

// interface DocumentsProps {
//   handleCancel: () => void;
//   onSubmitStep: (step: number) => void;
//   stepCompletion: { step1: boolean; step2: boolean; step3: boolean };
//   merchantResponse: MerchantCreateOutput | null;
// }

// export const Documents: React.FC<DocumentsProps> = ({
//   handleCancel,
//   onSubmitStep,
//   stepCompletion,
//   merchantResponse,
// }) => {
//   const [useHostedFlow, setUseHostedFlow] = useState(false);
//   const kycLink = merchantResponse?.data.kycLink || null;
//   const tosLink = merchantResponse?.data.tosLink || null;

//   const handleKYCRedirect = () => {
//     if (kycLink) {
//       window.open(kycLink, "_blank");
//     }
//   };

//   const handlePersonaComplete = (inquiryId: string, status: string) => {
//     console.log(`Inquiry ${inquiryId} completed with status ${status}`);
//     // Handle completion, e.g., update your backend
//   };

//   const handlePersonaCancel = () => {
//     console.log("User canceled verification");
//     setUseHostedFlow(true);
//   };

//   const handlePersonaError = (error: any) => {
//     console.error("Error during verification:", error);
//     setUseHostedFlow(true);
//   };

//   return (
//     <div className="space-y-4">
//       {useHostedFlow ? (
//         <div className="mb-4">
//           <h3 className="text-lg font-semibold mb-2">KYC Verification</h3>
//           <p>Please complete your KYC verification by clicking the button below:</p>
//           <Button className="mt-2" onClick={handleKYCRedirect}>
//             Start KYC Verification
//           </Button>
//         </div>
//       ) : (
//         kycLink && (
//           <PersonaVerification
//             kycLink={kycLink}
//             onCancel={handlePersonaCancel}
//             onComplete={handlePersonaComplete}
//             onError={handlePersonaError}
//           />
//         )
//       )}
//       {tosLink && (
//         <div className="mb-4">
//           <h3 className="text-lg font-semibold mb-2">Terms of Service</h3>
//           <iframe
//             className="w-full h-96 border border-gray-300 rounded"
//             src={tosLink}
//             title="Terms of Service Document"
//           />
//         </div>
//       )}
//       <div className="flex justify-between">
//         <Button className="text-notpurple-500" variant="light" onClick={handleCancel}>
//           Cancel
//         </Button>
//         <Button
//           className={`bg-ualert-500 ${!stepCompletion.step2 ? "button-disabled" : ""}`}
//           isDisabled={!stepCompletion.step2}
//           onClick={() => onSubmitStep(3)}
//         >
//           Submit Documents
//         </Button>
//       </div>
//     </div>
//   );
// };
