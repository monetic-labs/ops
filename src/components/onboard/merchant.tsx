'use client';

import { useState } from 'react';
import { Control, FieldErrors, useForm } from 'react-hook-form';

import { FormButton } from '@/components/onboard/form-button';
import { FormCard } from '@/components/onboard/form-card';
import { FormInput } from '@/components/onboard/form-input';
import { MerchantFormData } from '@/data/merchant';

interface MerchantFormProps {
  control: Control<MerchantFormData>;
  errors: FieldErrors<MerchantFormData>;
  onNext: () => void;
  onPrevious: () => void;
  onSubmit?: (data: Partial<MerchantFormData>) => void;
  onCancel?: () => void;
}

const CompanyInformationStep: React.FC<MerchantFormProps> = ({
  control,
  errors,
  onNext,
  onCancel,
}: MerchantFormProps) => (
  <>
    <FormCard title="Company Information">
      <p className="text-notpurple-200">KYB Provided by Persona</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="col-span-1 md:col-span-2">
          <FormInput
            control={control}
            errorMessage={errors.company?.name?.message}
            label="Company Name"
            name="company.name"
          />
        </div>
        <div className="col-span-1 md:col-span-2">
          <FormInput
            control={control}
            errorMessage={errors.company?.email?.message}
            label="Company Email"
            name="company.email"
          />
        </div>
        <div className="col-span-1 md:col-span-2">
          <h3 className="text-lg font-semibold mb-2 text-notpurple-100">Registered Address</h3>
        </div>
        <div className="col-span-1 md:col-span-2">
          <FormInput
            control={control}
            errorMessage={errors.company?.registeredAddress?.street1?.message}
            label="Street Address 1"
            name="company.registeredAddress.street1"
          />
        </div>
        <div className="col-span-1 md:col-span-2">
          <FormInput
            control={control}
            errorMessage={errors.company?.registeredAddress?.street2?.message}
            label="Street Address 2 (Optional)"
            name="company.registeredAddress.street2"
          />
        </div>
        <div>
          <FormInput
            control={control}
            errorMessage={errors.company?.registeredAddress?.city?.message}
            label="City"
            name="company.registeredAddress.city"
          />
        </div>
        <div>
          <FormInput
            control={control}
            errorMessage={errors.company?.registeredAddress?.postcode?.message}
            label="Postcode"
            name="company.registeredAddress.postcode"
          />
        </div>
        <div>
          <FormInput
            control={control}
            errorMessage={errors.company?.registeredAddress?.state?.message}
            label="State"
            name="company.registeredAddress.state"
          />
        </div>
        <div>
          <FormInput
            control={control}
            errorMessage={errors.company?.registeredAddress?.country?.message}
            helperText="Enter a 2-letter ISO country code"
            label="Country Code"
            maxLength={2}
            name="company.registeredAddress.country"
            placeholder="e.g. US, GB"
          />
        </div>
      </div>
      <div className="mt-6 flex justify-between">
        <FormButton className="w-[48%] bg-charyo-500 hover:bg-charyo-600" onClick={onCancel}>
          Cancel
        </FormButton>
        <FormButton className="w-[48%]" onClick={onNext}>
          Next
        </FormButton>
      </div>
    </FormCard>
  </>
);

const RepresentativeInformationStep: React.FC<MerchantFormProps> = ({
  control,
  errors,
  onPrevious,
  onNext,
}: MerchantFormProps) => (
  <>
    <FormCard title="Company Owner Info">
      <FormInput
        control={control}
        errorMessage={errors.representatives?.[0]?.name?.message}
        label="First Name"
        name="representatives.0.name"
      />
      <FormInput
        control={control}
        errorMessage={errors.representatives?.[0]?.surname?.message}
        label="Last Name"
        name="representatives.0.surname"
      />
      <FormInput
        control={control}
        errorMessage={errors.representatives?.[0]?.email?.message}
        label="Email"
        name="representatives.0.email"
      />
      <FormInput
        control={control}
        errorMessage={errors.representatives?.[0]?.phoneNumber?.message}
        label="Phone Number"
        name="representatives.0.phoneNumber"
      />
      <div className="flex justify-between mt-4">
        <FormButton onClick={onPrevious}>Previous</FormButton>
        <FormButton onClick={onNext}>Next</FormButton>
      </div>
    </FormCard>
  </>
);

const WalletInformationStep: React.FC<MerchantFormProps> = ({
  control,
  errors,
  onPrevious,
  onSubmit,
}) => {
  console.log('WalletInformationStep rendered');

  return (
    <>
      <FormCard title="Wallet Information">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = (e.target as HTMLFormElement).elements.namedItem(
              'walletAddress'
            ) as HTMLInputElement;

            console.log('Form submitted in WalletInformationStep, wallet address:', formData.value);
            onSubmit?.({ walletAddress: formData.value });
          }}
        >
          <FormInput
            control={control}
            errorMessage={errors.walletAddress?.message}
            label="Wallet Address"
            name="walletAddress"
            placeholder="0xdeadbeef"
          />
          <div className="flex justify-between mt-4">
            <FormButton type="button" onClick={onPrevious}>
              Previous
            </FormButton>
            <FormButton type="submit">Submit</FormButton>
          </div>
        </form>
      </FormCard>
    </>
  );
};

export const KYBMerchantForm: React.FC<{ onCancel: () => void }> = ({ onCancel }) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<MerchantFormData>>({
    representatives: [
      {
        name: '',
        surname: '',
        email: '',
        phoneNumber: '',
      },
    ],
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<MerchantFormData>({
    defaultValues: formData,
    mode: 'onBlur',
  });

  const updateFormData = (data: Partial<MerchantFormData>) => {
    setFormData((prevData) => ({ ...prevData, ...data }));
  };

  const onSubmit = async (data: MerchantFormData) => {
    console.log('onSubmit called with data:', data);
    setIsSubmitting(true);
    try {
      console.log('Preparing to call createMerchant');
      const merchantData = {
        ...formData,
        ...data,
        company: {
          ...data.company,
          registeredAddress: {
            ...data.company.registeredAddress,
            country: data.company.registeredAddress.country.toUpperCase(),
          },
        },
        fee: 0,
        compliance: undefined,
      };

      console.log('Merchant data prepared:', merchantData);
      //const response = await pylonService.createMerchant(merchantData);

      //console.log('Merchant created successfully:', response);
      // Handle successful submission (e.g., show success message, redirect)
    } catch (error) {
      console.error('Error in createMerchant:', error);
      // Handle error (e.g., show error message)
    } finally {
      setIsSubmitting(false);
      console.log('Submission process completed');
    }
  };

  const handleStepSubmit = (data: Partial<MerchantFormData>) => {
    console.log('handleStepSubmit called with data:', data);
    updateFormData(data);
    if (step < 3) {
      setStep(step + 1);
    } else {
      console.log('Final form data before submission:', { ...formData, ...data });
      onSubmit({ ...formData, ...data } as MerchantFormData);
    }
  };

  const renderStep = () => {
    const commonProps = {
      control,
      errors,
      onSubmit: handleStepSubmit,
    };

    console.log('Rendering step:', step);

    switch (step) {
      case 1:
        return (
          <CompanyInformationStep
            {...commonProps}
            onCancel={onCancel}
            onNext={() => handleStepSubmit(getValues())}
            onPrevious={() => {}}
          />
        );
      case 2:
        return (
          <RepresentativeInformationStep
            {...commonProps}
            onNext={() => handleStepSubmit(getValues())}
            onPrevious={() => setStep(1)}
          />
        );
      case 3:
        return (
          <WalletInformationStep
            {...commonProps}
            onNext={() => handleStepSubmit(getValues())}
            onPrevious={() => setStep(2)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      {renderStep()}
      {isSubmitting && (
        <div className="fixed inset-0 bg-charyo-700/60 backdrop-blur-md flex items-center justify-center">
          <p className="text-notpurple-100 text-xl">Submitting...</p>
        </div>
      )}
    </div>
  );
};
