'use client';

import { useState, useRef, useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Tabs, Tab } from '@nextui-org/tabs';
import { FormCard } from '@/components/onboard/form-card';
import { MerchantFormData } from '@/data/merchant';
import { Input } from '@nextui-org/input';
import { Button } from '@nextui-org/button';
import { useRouter } from 'next/navigation';
import { useIssueOTP, useVerifyOTP } from '@/hooks/auth/useOTP';
import { verify } from 'crypto';

const OTP_LENGTH = 6;

export const KYBMerchantForm: React.FC<{ onCancel: () => void }> = ({ onCancel }) => {
  const [activeTab, setActiveTab] = useState('company-info');
  const { control, handleSubmit, formState: { errors }, getValues } = useForm<MerchantFormData>();
  const [otp, setOtp] = useState('');
  const [isOtpComplete, setIsOtpComplete] = useState(false);
  const [otpSubmitted, setOtpSubmitted] = useState(false);
  const { issueOTP, isLoading: isIssueLoading, error: issueError } = useIssueOTP();
  const { verifyOTP, isLoading: isVerifyLoading, error: verifyError } = useVerifyOTP();
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
      handleVerify(updatedOtp);
    } else {
      setIsOtpComplete(false);
    }
  };

  const handleVerify = async (otpValue: string) => {
    const email = getValues('owner.email');
    if (email && otpValue.length === OTP_LENGTH) {
      setOtpSubmitted(true);
      const response = await verifyOTP({ email, otp: otpValue });
      if (response) {
        console.log("OTP verified successfully");
        // Handle successful verification (e.g., move to next step)
      }
      setOtp('');
      otpInputs.current[0]?.focus();
      setTimeout(() => setOtpSubmitted(false), 2000);
    }
  };

  const handleResendOTP = async () => {
    const email = getValues('owner.email');
    if (email) {
      await issueOTP(email);
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
    <div className="space-y-4">
      <Controller
        name="company.name"
        control={control}
        rules={{ required: 'Company name is required' }}
        render={({ field }) => (
          <Input
            {...field}
            label="Company Name"
            placeholder="Enter company name"
            isInvalid={!!errors.company?.name}
            errorMessage={errors.company?.name?.message}
          />
        )}
      />
      <Controller
        name="company.email"
        control={control}
        rules={{ required: 'Company email is required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' } }}
        render={({ field }) => (
          <Input
            {...field}
            label="Company Email"
            placeholder="Enter company email"
            isInvalid={!!errors.company?.email}
            errorMessage={errors.company?.email?.message}
          />
        )}
      />
      <Controller
        name="company.mailingAddress"
        control={control}
        rules={{ required: 'Mailing address is required' }}
        render={({ field }) => (
          <Input
            {...field}
            label="Entity Mailing Address"
            placeholder="Enter mailing address"
            isInvalid={!!errors.company?.mailingAddress}
            errorMessage={errors.company?.mailingAddress?.message}
          />
        )}
      />
      <Controller
        name="company.settlementAddress"
        control={control}
        rules={{ required: 'Settlement address is required' }}
        render={({ field }) => (
          <Input
            {...field}
            label="Settlement Address"
            placeholder="Enter settlement address"
            isInvalid={!!errors.company?.settlementAddress}
            errorMessage={errors.company?.settlementAddress?.message}
          />
        )}
      />
      <div className="flex justify-between mt-4">
        <Button onClick={handleCancel} color="danger">Cancel</Button>
        <Button onClick={() => onSubmitStep(1)} color="primary">Step 1: Submit Company Info</Button>
      </div>
    </div>
  );

  const renderCompanyOwner = () => (
    <div className="space-y-4">
      <Controller
        name="owner.firstName"
        control={control}
        rules={{ required: 'Owner name is required' }}
        render={({ field }) => (
          <Input
            {...field}
            label="Owner Name"
            placeholder="Enter owner name"
            isInvalid={!!errors.owner?.firstName}
            errorMessage={errors.owner?.firstName?.message}
          />
        )}
      />
      <Controller
        name="owner.email"
        control={control}
        rules={{ required: 'Owner email is required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' } }}
        render={({ field }) => (
          <Input
            {...field}
            label="Owner Email"
            placeholder="Enter owner email"
            isInvalid={!!errors.owner?.email}
            errorMessage={errors.owner?.email?.message}
          />
        )}
      />
      <Controller
        name="owner.phone"
        control={control}
        rules={{ required: 'Owner phone is required' }}
        render={({ field }) => (
          <Input
            {...field}
            label="Owner Phone"
            placeholder="Enter owner phone"
            isInvalid={!!errors.owner?.phone}
            errorMessage={errors.owner?.phone?.message}
          />
        )}
      />
      <div className="flex justify-between mt-4">
        <Button onClick={handleCancel} color="danger">Cancel</Button>
        <Button onClick={() => onSubmitStep(2)} color="primary">Step 2: Submit Owner Info</Button>
      </div>
    </div>
  );

  const renderDocuments = () => (
    <>
      <div className="h-96">
        {/* Add your iframe for document flow here */}
        <iframe src="your-document-flow-url" className="w-full h-full" />
      </div>
      <div className="flex justify-between mt-4">
        <Button onClick={handleCancel} color="danger">Cancel</Button>
        <Button onClick={() => onSubmitStep(3)} color="primary">Step 3: Submit Documents</Button>
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
        disabled={isIssueLoading}
        className="bg-ualert-500 text-white hover:bg-ualert-600"
      >
        Resend OTP
      </Button>
      {(issueError || verifyError) && (
        <p className="text-ualert-500 mt-2">{issueError || verifyError}</p>
      )}
      <div className="flex justify-between mt-4">
        <Button onClick={handleCancel} color="danger">Cancel</Button>
        <Button onClick={() => onSubmitStep(4)} color="primary">Step 4: Complete Validation</Button>
      </div>
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
