import {
  ISO3166Alpha2Country,
  ISO3166Alpha3Country,
  PersonRole,
  RecoveryWalletMethod,
  RecoveryWalletGenerateInput,
} from "@backpack-fux/pylon-sdk";
import { Address } from "viem";
import { UseFormSetError } from "react-hook-form";

import { WebAuthnHelper } from "@/utils/webauthn";
import { LocalStorage, OnboardingState } from "@/utils/localstorage";
import { FormData, UserRole } from "@/validations/onboard/schemas";
import { BACKPACK_GUARDIAN_ADDRESS } from "@/utils/constants";
import { createAndSendSponsoredUserOp, sendUserOperation } from "@/utils/safe";
import pylon from "@/libs/pylon-sdk";
import { createEnableModuleTransaction, createAddGuardianTransaction } from "@/utils/socialRecovery";

interface SubmitHandlerParams {
  formData: FormData;
  onboardingState: OnboardingState;
  updateStatusStep: (step: number, isComplete: boolean) => void;
  setError: UseFormSetError<FormData>;
  onSuccess: () => void;
}

export const handleSubmit = async ({
  formData,
  onboardingState,
  updateStatusStep,
  setError,
  onSuccess,
}: SubmitHandlerParams) => {
  try {
    // Quick signature check to verify user still has the passkey
    const webauthnHelper = new WebAuthnHelper({
      credentialId: onboardingState.credentials.credentialId,
      publicKey: onboardingState.credentials.publicKey,
    });

    try {
      await webauthnHelper.verifyPasskey();
    } catch (error) {
      setError("companyName", {
        type: "validate",
        message: "Please verify your passkey before submitting",
      });

      return;
    }

    // First create the merchant account to get the JWT
    const response = await pylon.createMerchant({
      settlementAddress: onboardingState.settlementAddress,
      isTermsOfServiceAccepted: formData.acceptedTerms,
      company: {
        name: formData.companyName,
        email: formData.companyEmail,
        website: `https://${formData.companyWebsite}`,
        type: formData.companyType,
        registrationNumber: formData.companyRegistrationNumber,
        taxId: formData.companyTaxId,
        description: formData.companyDescription || undefined,
        registeredAddress: {
          street1: formData.streetAddress1,
          street2: formData.streetAddress2 || undefined,
          city: formData.city,
          postcode: formData.postcode,
          state: formData.state,
          country: ISO3166Alpha2Country.US,
        },
        controlOwner: {
          firstName: formData.users[0].firstName,
          lastName: formData.users[0].lastName,
          email: formData.users[0].email,
          phoneCountryCode: formData.users[0].phoneNumber.extension,
          phoneNumber: formData.users[0].phoneNumber.number,
          nationalId: formData.users[0].socialSecurityNumber,
          countryOfIssue: formData.users[0].countryOfIssue,
          birthDate: formData.users[0].birthDate,
          walletAddress: onboardingState.walletAddress,
          address: {
            line1: formData.users[0].streetAddress1,
            line2: formData.users[0].streetAddress2 || undefined,
            city: formData.users[0].city,
            region: formData.users[0].state,
            postalCode: formData.users[0].postcode,
            countryCode: ISO3166Alpha2Country.US,
            country: ISO3166Alpha3Country.USA,
          },
        },
        ultimateBeneficialOwners: formData.users
          .filter((user) => user.roles.includes(UserRole.BENEFICIAL_OWNER))
          .map((user) => ({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phoneCountryCode: user.phoneNumber.extension,
            phoneNumber: user.phoneNumber.number,
            nationalId: user.socialSecurityNumber,
            countryOfIssue: user.countryOfIssue,
            birthDate: user.birthDate,
            address: {
              line1: user.streetAddress1,
              line2: user.streetAddress2 || undefined,
              city: user.city,
              region: user.state,
              postalCode: user.postcode,
              countryCode: ISO3166Alpha2Country.US,
              country: ISO3166Alpha3Country.USA,
            },
          })),
        representatives: formData.users
          .filter((user) => user.roles.includes(UserRole.REPRESENTATIVE))
          .map((user) => ({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phoneCountryCode: user.phoneNumber.extension,
            phoneNumber: user.phoneNumber.number,
            nationalId: user.socialSecurityNumber,
            countryOfIssue: user.countryOfIssue,
            birthDate: user.birthDate,
            address: {
              line1: user.streetAddress1,
              line2: user.streetAddress2 || undefined,
              city: user.city,
              region: user.state,
              postalCode: user.postcode,
              countryCode: ISO3166Alpha2Country.US,
              country: ISO3166Alpha3Country.USA,
            },
          })),
      },
      users: formData.users
        .filter((user) => user.hasDashboardAccess)
        .map((user, index) => {
          const role = user.dashboardRole as PersonRole;

          return {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phoneCountryCode: user.phoneNumber.extension,
            phoneNumber: user.phoneNumber.number,
            birthDate: user.birthDate,
            nationalId: user.socialSecurityNumber,
            countryOfIssue: user.countryOfIssue,
            walletAddress: index === 0 ? onboardingState.walletAddress : undefined,
            role,
            passkeyId: index === 0 ? onboardingState.credentials.credentialId : undefined,
            address: {
              line1: user.streetAddress1,
              line2: user.streetAddress2 || undefined,
              city: user.city,
              region: user.state,
              postalCode: user.postcode,
              countryCode: ISO3166Alpha2Country.US,
              country: ISO3166Alpha3Country.USA,
            },
          };
        }),
    });

    // Update first status step
    updateStatusStep(0, true);

    if (response) {
      // Now that we have created the merchant, generate recovery wallets
      const ownerUser = formData.users[0];
      const recoveryInputs: RecoveryWalletGenerateInput[] = [
        { identifier: ownerUser.email, method: RecoveryWalletMethod.EMAIL },
        { identifier: ownerUser.phoneNumber.number, method: RecoveryWalletMethod.PHONE },
      ];

      const recoveryWallets = await pylon.generateRecoveryWallets(recoveryInputs);

      // Create social recovery transactions
      const guardianAddresses = [
        BACKPACK_GUARDIAN_ADDRESS as Address,
        ...recoveryWallets.map((wallet) => wallet.publicAddress as Address),
      ];

      // Create enable module and add guardian transactions
      const enableModuleTx = createEnableModuleTransaction(onboardingState.walletAddress);
      const addGuardianTxs = guardianAddresses.map((address) => createAddGuardianTransaction(address, BigInt(2)));

      const socialRecoveryTxs = [enableModuleTx, ...addGuardianTxs];

      // Create and sponsor user operation
      const { userOp, hash } = await createAndSendSponsoredUserOp(onboardingState.walletAddress, socialRecoveryTxs, {
        signer: onboardingState.credentials.publicKey,
        isWebAuthn: true,
      });

      // Sign the operation
      const signature = await webauthnHelper.signMessage(hash);

      // Send the operation
      const response = await sendUserOperation(
        onboardingState.walletAddress,
        userOp,
        {
          signer: onboardingState.credentials.publicKey,
          signature: signature.signature,
        },
        false // not init since account already deployed
      );

      // Wait for receipt
      const receipt = await response.included();

      if (!receipt.success) {
        throw new Error("Failed to setup social recovery");
      }

      // Update second status step
      updateStatusStep(1, true);

      // Store user data with consolidated state management
      LocalStorage.setAuth(onboardingState.credentials, true);

      // Update final status step
      updateStatusStep(2, true);

      // Call success callback
      onSuccess();
    }
  } catch (error: any) {
    console.error("error: ", error);
    if (error.response?.data?.errors) {
      Object.entries(error.response.data.errors).forEach(([key, value]) => {
        // Only set error for known form fields
        if (key in formData) {
          setError(key as keyof FormData, {
            type: "required",
            message: value as string,
          });
        }
      });
    } else {
      setError("companyName", {
        type: "validate",
        message: error.message || "An unknown error occurred",
      });
    }
    throw error;
  }
};
