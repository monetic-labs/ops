import { SocialRecoveryModule, SocialRecoveryModuleGracePeriodSelector } from "abstractionkit";
import {
  ISO3166Alpha2Country,
  ISO3166Alpha3Country,
  PersonRole,
  RecoveryWalletMethod,
  RecoveryWalletGenerateInput,
} from "@backpack-fux/pylon-sdk";

import { WebAuthnHelper } from "@/utils/webauthn";
import { WebAuthnSafeAccountHelper } from "@/utils/safeAccount";
import { LocalStorage } from "@/utils/localstorage";
import { FormData, UserRole } from "@/validations/onboard/schemas";
import { OnboardingState } from "@/contexts/AccountContext";
import { BACKPACK_GUARDIAN_ADDRESS } from "@/utils/constants";
import pylon from "@/libs/pylon-sdk";

interface SubmitHandlerParams {
  formData: FormData;
  onboardingState: OnboardingState;
  updateStatusStep: (step: number, isComplete: boolean) => void;
  setError: (field: any, error: { type: string; message: string }) => void;
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
      credentialId: onboardingState.credentialId,
      publicKey: {
        x: BigInt(onboardingState.publicKeyCoordinates.x),
        y: BigInt(onboardingState.publicKeyCoordinates.y),
      },
    });

    try {
      await webauthnHelper.verifyPasskey();
    } catch (error) {
      setError("root", {
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
            passkeyId: index === 0 ? onboardingState.passkeyId : undefined,
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

      // Initialize social recovery module with 7 days grace period
      const srm = new SocialRecoveryModule(SocialRecoveryModuleGracePeriodSelector.After7Days);

      // Create enable module transaction
      const enableModuleTransaction = srm.createEnableModuleMetaTransaction(onboardingState.walletAddress);
      const addGuardianTransactions = [
        srm.createAddGuardianWithThresholdMetaTransaction(BACKPACK_GUARDIAN_ADDRESS, BigInt(2)),
        ...recoveryWallets.map((wallet) =>
          srm.createAddGuardianWithThresholdMetaTransaction(wallet.publicAddress, BigInt(2))
        ),
      ];

      // Create WebAuthn safe account helper for executing transactions
      const individualAccount = new WebAuthnSafeAccountHelper({
        x: BigInt(onboardingState.publicKeyCoordinates.x),
        y: BigInt(onboardingState.publicKeyCoordinates.y),
      });

      // Execute social recovery module setup transactions
      const userOperation = await individualAccount.createSponsoredUserOp([
        enableModuleTransaction,
        ...addGuardianTransactions,
      ]);

      // Sign and send the user operation
      const userOpHash = individualAccount.getUserOpHash(userOperation);
      const signature = await webauthnHelper.signMessage(userOpHash);

      await individualAccount.signAndSendUserOp(userOperation, signature);

      // Update second status step
      updateStatusStep(1, true);

      // Store user data with consolidated state management
      LocalStorage.setSafeUser(
        onboardingState.publicKeyCoordinates,
        onboardingState.walletAddress,
        onboardingState.settlementAddress,
        onboardingState.passkeyId,
        true
      );
      // Only mark passkey as registered after successful merchant creation
      LocalStorage.setPasskeyRegistered(onboardingState.passkeyId);

      // Update final status step
      updateStatusStep(2, true);

      // Call success callback
      onSuccess();
    }
  } catch (error: any) {
    console.error("error: ", error);
    if (error.response?.data?.errors) {
      Object.entries(error.response.data.errors).forEach(([key, value]) => {
        setError(key as any, {
          type: "required",
          message: value as string,
        });
      });
    } else {
      setError("root", {
        type: "validate",
        message: error.message,
      });
    }
    throw error;
  }
};
