'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Tabs, Tab } from '@nextui-org/tabs';
import { FormCard } from '@/components/onboard/form-card';
import { FormInput } from '@/components/onboard/form-input';
import { FormButton } from '@/components/onboard/form-button';
import { MerchantFormData } from '@/data/merchant';
import { useLogin } from '@/hooks/auth/useLogin';
import { useVerify } from '@/hooks/auth/useVerify';
import { Input } from '@nextui-org/input';
import { Button } from '@nextui-org/button';
import { useRouter } from 'next/navigation';

const OTP_LENGTH = 6;

export const KYBMerchantForm: React.FC<{ onCancel: () => void }> = ({ onCancel }) => {
  const [activeTab, setActiveTab] = useState('company-info');
  const { control, handleSubmit, formState: { errors }, getValues } = useForm<MerchantFormData>();
  const [otp, setOtp] = useState('');
  const [isOtpComplete, setIsOtpComplete] = useState(false);
  const [otpSubmitted, setOtpSubmitted] = useState(false);
  const { login, isLoading: isLoginLoading, error: loginError } = useLogin();
  const { verify, isLoading: isVerifyLoading, error: verifyError } = useVerify();
  const otpInputs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  const handleOtpChange = (index: number, value: string) => {
    const newOtp = otp.split('');
    newOtp[index] = value;
    const updatedOtp = newOtp.join('');
    setOtp(updatedOtp);

    if (value !== '' && index < OTP_LENGTH - 1) {
      otpInputs.current[index + 1]?.focus();
    }

    if (updatedOtp.length === OTP_LENGTH) {
      setIsOtpComplete(true);
      setTimeout(() => setIsOtpComplete(false), 1000);
      handleVerify();
    } else {
      setIsOtpComplete(false);
    }
  };

  const handleVerify = async () => {
    const email = getValues('owner.email');
    if (email && otp.length === OTP_LENGTH) {
      setOtpSubmitted(true);
      await verify(email, otp);
      setOtp('');
      otpInputs.current[0]?.focus();
      setTimeout(() => setOtpSubmitted(false), 2000);
    }
  };

  const handleResendOTP = async () => {
    const email = getValues('owner.email');
    if (email) {
      await login(email);
    }
  };

  const onSubmitStep = async (step: number) => {
    const data = getValues();
    console.log(`Step ${step} data:`, data);

    if (step === 2) {
      // Combine data from steps 1 and 2 and send to pylon service
      const combinedData = {
        company: data.company,
        owner: data.owner,
      };
      console.log('Combined data to send to pylon service:', combinedData);
      // TODO: Implement pylon service integration
      // await sendToPylonService(combinedData);
    }

    // Move to the next tab
    const tabKeys = ['company-info', 'company-owner', 'documents', 'validate'];
    const nextTabIndex = tabKeys.indexOf(activeTab) + 1;
    if (nextTabIndex < tabKeys.length) {
      setActiveTab(tabKeys[nextTabIndex]);
    }
  };


const handleCancel = () => {
    router.push('/auth');
  };

  const renderCompanyInfo = () => (
    <>
      <FormInput
        control={control}
        name="company.name"
        label="Company Name"
        errorMessage={errors.company?.name?.message}
      />
      <FormInput
        control={control}
        name="company.email"
        label="Company Email"
        errorMessage={errors.company?.email?.message}
      />
      <FormInput
        control={control}
        name="company.mailingAddress"
        label="Entity Mailing Address"
        errorMessage={errors.company?.mailingAddress?.message}
      />
      <FormInput
        control={control}
        name="company.settlementAddress"
        label="Settlement Address"
        placeholder="0xdeadbeef"
        errorMessage={errors.company?.settlementAddress?.message}
      />
       <div className="flex justify-between">
         <div className="w-1/2">
           <FormButton onClick={() => onSubmitStep(1)}>Step 1: Submit Company Info</FormButton>
         </div>
         <div className="w-1/2">
           <FormButton onClick={handleCancel}>Cancel</FormButton>
         </div>
       </div>
    </>
  );

  const renderCompanyOwner = () => (
    <>
      <FormInput
        control={control}
        name="owner.firstName"
        label="First Name"
        errorMessage={errors.owner?.firstName?.message}
      />
      <FormInput
        control={control}
        name="owner.lastName"
        label="Last Name"
        errorMessage={errors.owner?.lastName?.message}
      />
      <FormInput
        control={control}
        name="owner.email"
        label="Email"
        errorMessage={errors.owner?.email?.message}
      />
      <FormInput
        control={control}
        name="owner.phone"
        label="Phone"
        errorMessage={errors.owner?.phone?.message}
      />
      {/* Add a toggle for additional representatives here */}
      <div className="flex justify-between">
         <div className="w-1/2">
           <FormButton onClick={() => onSubmitStep(2)}>Step 2: Submit Owner Info</FormButton>
         </div>
         <div className="w-1/2">
           <FormButton onClick={handleCancel}>Cancel</FormButton>
         </div>
       </div>
    </>
  );

  const renderDocuments = () => (
    <>
    <div className="h-96">
      {/* Add your iframe for document flow here */}
      <iframe src="your-document-flow-url" className="w-full h-full" />
    </div>
    <div className="flex justify-between">
         <div className="w-1/2">
           <FormButton onClick={() => onSubmitStep(3)}>Step 3: Submit Documents</FormButton>
         </div>
         <div className="w-1/2">
           <FormButton onClick={handleCancel}>Cancel</FormButton>
         </div>
       </div>
    </>
  );

  const renderValidate = () => (
    <div className="space-y-4">
      <p className="text-notpurple-100">Enter the 6-digit OTP sent to your email.</p>
      <div className="flex flex-col items-center space-y-2">
        <div className="flex justify-center space-x-2">
          {Array.from({ length: OTP_LENGTH }).map((_, index) => (
            <input
              key={index}
              ref={(el) => { otpInputs.current[index] = el; }}
              type="text"
              maxLength={1}
              value={otp[index] || ''}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Backspace' && !otp[index] && index > 0) {
                  otpInputs.current[index - 1]?.focus();
                }
              }}
              className={`w-10 h-12 text-center text-xl border-2 rounded-md bg-charyo-500 text-white 
                ${isOtpComplete ? 'animate-flash border-ualert-500' : otpSubmitted ? 'border-green-500' : 'border-gray-300'}
                focus:border-ualert-500 focus:outline-none`}
            />
          ))}
        </div>
        {otpSubmitted && (
          <p className="text-notpurple-500 mt-2">OTP submitted</p>
        )}
      </div>
      <Button
        onClick={handleResendOTP}
        disabled={isLoginLoading}
        className="bg-ualert-500 text-white hover:bg-ualert-600"
      >
        Resend OTP
      </Button>
      {(loginError || verifyError) && (
        <p className="text-ualert-500 mt-2">{loginError || verifyError}</p>
      )}
    </div>
  );

  return (
    <FormCard title="KYB Merchant Onboarding">
        <Tabs selectedKey={activeTab} onSelectionChange={(key) => setActiveTab(key as string)}>
          <Tab key="company-info" title="Company Info">
            {renderCompanyInfo()}
          </Tab>
          <Tab key="company-owner" title="Company Owner">
            {renderCompanyOwner()}
          </Tab>
          <Tab key="documents" title="Documents">
            {renderDocuments()}
          </Tab>
          <Tab key="validate" title="Validate">
            {renderValidate()}
          </Tab>
        </Tabs>

    </FormCard>
  );
};
