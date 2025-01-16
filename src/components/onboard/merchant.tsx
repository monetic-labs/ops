"use client";
import { useEffect, useState } from "react";
import { Circle, CheckCircle, FileEdit as Edit } from "lucide-react";
import { Accordion, AccordionItem } from "@nextui-org/accordion";
import { Input } from "@nextui-org/input";
import { Select, SelectItem } from "@nextui-org/select";
import { DatePicker } from "@nextui-org/date-picker";
import { today, getLocalTimeZone, parseDate } from "@internationalized/date";
import { Button } from "@nextui-org/button";
import { Divider } from "@nextui-org/divider";
import { z } from "zod";
import {
  useForm,
  SubmitHandler,
  useFieldArray,
  FormProvider,
  useFormContext,
  useWatch,
  Controller,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAddress } from "viem";
import { Checkbox } from "@nextui-org/checkbox";

import postcodeMap from "@/data/postcodes-map.json";

import { AccountUsers } from "./account-users";

// Add validation patterns
const birthdayRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
const phoneRegex = /^[0-9]{9,15}$/;
const ssnRegex = /^(?:\d{3}-?\d{2}-?\d{4})$/;
const postcodeRegex = /^[0-9]{5}$/;

// Define schemas for each step
const companyDetailsSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters").max(100, "Company name is too long"),
  companyEmail: z.string().email("Please enter a valid email address"),
  companyWebsite: z
    .string()
    .transform((val) => {
      let url = val.trim().toLowerCase();

      url = url.replace(/^https?:\/\//, "");
      url = url.replace(/^www\./, "");

      return url;
    })
    .pipe(
      z
        .string()
        .min(1, "Website is required")
        .regex(/^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/, "Please enter a valid domain")
    )
    .optional(),
  postcode: z
    .string()
    .regex(postcodeRegex, "Please enter a valid postal code")
    .refine((val) => postcodeMap[val] !== undefined, "Postcode not found"),
  city: z.string().min(2, "City name is too short"),
  state: z.string().length(2, "Please use 2-letter state code"),
  streetAddress1: z.string().min(5, "Please enter a valid street address"),
  streetAddress2: z.string().optional(),
});

// Define company types enum
const CardCompanyType = {
  SOLE_PROPRIETORSHIP: "sole_proprietorship",
  LLC: "llc",
  C_CORP: "c_corp",
  S_CORP: "s_corp",
  PARTNERSHIP: "partnership",
  LP: "lp",
  LLP: "llp",
  NONPROFIT: "nonprofit",
} as const;

const companyAccountSchema = z.object({
  settlementAddress: z
    .string()
    .min(42, "Settlement address must be 42 characters")
    .max(42, "Settlement address must be 42 characters")
    .refine((val) => isAddress(val), "Please enter a valid hex address"),
  companyRegistrationNumber: z
    .string()
    .min(1, "Registration number is required")
    .max(12, "Registration number cannot exceed 12 characters")
    .regex(/^\d+$/, "Please enter a valid registration number"),
  companyTaxId: z.string().regex(/^\d{2}-\d{7}$/, "Please enter a valid Tax ID (XX-XXXXXXX)"),
  companyType: z.enum(
    [
      CardCompanyType.SOLE_PROPRIETORSHIP,
      CardCompanyType.LLC,
      CardCompanyType.C_CORP,
      CardCompanyType.S_CORP,
      CardCompanyType.PARTNERSHIP,
      CardCompanyType.LP,
      CardCompanyType.LLP,
      CardCompanyType.NONPROFIT,
    ],
    {
      errorMap: () => ({ message: "Please select a valid company type" }),
    }
  ),
  companyDescription: z.string().max(100, "Description cannot exceed 100 characters").optional(),
});

// Update the role enum
export const UserRole = {
  BENEFICIAL_OWNER: "beneficial_owner",
  REPRESENTATIVE: "representative",
} as const;

const userDetailsSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name cannot exceed 50 characters")
    .regex(/^[a-zA-Z\s-']+$/, "First name can only contain letters, spaces, hyphens, and apostrophes"),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name cannot exceed 50 characters")
    .regex(/^[a-zA-Z\s-']+$/, "Last name can only contain letters, spaces, hyphens, and apostrophes"),
  email: z.string().email("Please enter a valid email").max(50, "Email cannot exceed 50 characters"),
  phoneNumber: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^\d+$/, "Phone number can only contain digits")
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number cannot exceed 15 digits"),
  roles: z
    .array(z.enum([UserRole.BENEFICIAL_OWNER, UserRole.REPRESENTATIVE]))
    .min(1, "At least one role must be selected"),
  countryOfIssue: z.string().min(1, "Country is required"),
  birthDate: z
    .string()
    .min(1, "Birth date is required")
    .regex(birthdayRegex, "Birth date must be in YYYY-MM-DD format")
    .refine((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      return age >= 18;
    }, "Must be at least 18 years old"),
  socialSecurityNumber: z
    .string()
    .min(1, "SSN is required")
    .regex(ssnRegex, "Please enter a valid SSN (XXX-XX-XXXX)")
    .transform((val) => val.replace(/\D/g, "")),
  streetAddress1: z
    .string()
    .min(1, "Street address is required")
    .min(5, "Street address must be at least 5 characters")
    .max(100, "Street address cannot exceed 100 characters"),
  streetAddress2: z.string().max(100, "Street address cannot exceed 100 characters").optional(),
  city: z
    .string()
    .min(1, "City is required")
    .min(2, "City must be at least 2 characters")
    .max(50, "City cannot exceed 50 characters")
    .regex(/^[a-zA-Z\s-']+$/, "City can only contain letters, spaces, hyphens, and apostrophes"),
  state: z
    .string()
    .min(1, "State is required")
    .length(2, "Please use 2-letter state code")
    .regex(/^[A-Z]+$/, "State must be in uppercase letters"),
  postcode: z
    .string()
    .min(1, "Postcode is required")
    .regex(postcodeRegex, "Please enter a valid postal code")
    .refine((val) => postcodeMap[val] !== undefined, "Postcode not found"),
});

const accountUsersSchema = z.object({
  users: z
    .array(
      z.object({
        firstName: z
          .string()
          .min(2, "First name must be at least 2 characters")
          .max(50, "First name cannot exceed 50 characters")
          .regex(/^[a-zA-Z\s-']+$/, "First name can only contain letters, spaces, hyphens, and apostrophes"),
        lastName: z
          .string()
          .min(2, "Last name must be at least 2 characters")
          .max(50, "First name cannot exceed 50 characters")
          .regex(/^[a-zA-Z\s-']+$/, "Last name can only contain letters, spaces, hyphens, and apostrophes"),
        email: z
          .string()
          .min(1, "Email is required")
          .email("Please enter a valid email")
          .max(100, "Email cannot exceed 100 characters"),
        phoneNumber: z
          .string()
          .min(1, "Phone number is required")
          .regex(/^\d+$/, "Phone number can only contain digits")
          .min(9, "Phone number must be at least 9 digits")
          .max(15, "Phone number cannot exceed 15 digits"),
        roles: z
          .array(z.enum([UserRole.BENEFICIAL_OWNER, UserRole.REPRESENTATIVE]))
          .min(1, "At least one role must be selected"),
        countryOfIssue: z.string().min(1, "Country is required"),
        birthDate: z
          .string()
          .min(1, "Birth date is required")
          .regex(birthdayRegex, "Birth date must be in YYYY-MM-DD format")
          .refine((date) => {
            const birthDate = new Date(date);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();

            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
              age--;
            }

            return age >= 18;
          }, "Must be at least 18 years old"),
        socialSecurityNumber: z
          .string()
          .min(1, "SSN is required")
          .regex(ssnRegex, "Please enter a valid SSN (XXX-XX-XXXX)")
          .transform((val) => val.replace(/\D/g, "")),
        streetAddress1: z
          .string()
          .min(1, "Street address is required")
          .min(5, "Street address must be at least 5 characters")
          .max(100, "Street address cannot exceed 100 characters"),
        streetAddress2: z.string().max(100, "Street address cannot exceed 100 characters").optional(),
        city: z
          .string()
          .min(1, "City is required")
          .min(2, "City must be at least 2 characters")
          .max(50, "City cannot exceed 50 characters")
          .regex(/^[a-zA-Z\s-']+$/, "City can only contain letters, spaces, hyphens, and apostrophes"),
        state: z
          .string()
          .min(1, "State is required")
          .length(2, "Please use 2-letter state code")
          .regex(/^[A-Z]+$/, "State must be in uppercase letters"),
        postcode: z
          .string()
          .min(1, "Postcode is required")
          .regex(postcodeRegex, "Please enter a valid postal code")
          .refine((val) => postcodeMap[val] !== undefined, "Postcode not found"),
      })
    )
    .min(1, "At least one user is required")
    .refine(
      (users) => users.some((user) => user.roles.includes(UserRole.BENEFICIAL_OWNER)),
      "At least one Beneficial Owner is required"
    )
    .refine(
      (users) => users.some((user) => user.roles.includes(UserRole.REPRESENTATIVE)),
      "At least one Representative is required"
    ),
});

const termsSchema = z.object({
  acceptedBillPay: z.boolean().refine((val) => val === true, {
    message: "You must accept the Bill Pay Agreement",
  }),
  acceptedCardProgram: z.boolean().refine((val) => val === true, {
    message: "You must accept the Card Program Agreement",
  }),
  acceptedTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept all terms and conditions",
  }),
});

// Combine all schemas into the main schema
const schema = z.object({
  ...companyDetailsSchema.shape,
  ...companyAccountSchema.shape,
  ...accountUsersSchema.shape,
  ...termsSchema.shape,
});

type FormData = z.infer<typeof schema>;

// Helper function to get fields for current step
const getFieldsForStep = (step: number): (keyof FormData)[] => {
  switch (step) {
    case 1:
      return Object.keys(companyDetailsSchema.shape) as (keyof FormData)[];
    case 2:
      return Object.keys(companyAccountSchema.shape) as (keyof FormData)[];
    case 3:
      // For Account Users step, we only validate roles
      return ["users"];
    case 4:
      // For User Details step, we validate personal information
      return ["users"];
    case 5:
      return Object.keys(termsSchema.shape) as (keyof FormData)[];
    default:
      return [];
  }
};

// Create a helper component for optional label
const OptionalLabel = () => <span className="text-xs text-default-400 ml-1">(Optional)</span>;

// Simplify the FormField component
export const FormField = ({
  name,
  label,
  isOptional,
  value,
  onChange,
  formatValue,
  ...props
}: {
  name: string;
  label: string;
  isOptional?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  formatValue?: (value: string) => string;
} & Omit<React.ComponentProps<typeof Input>, "name" | "label">) => {
  const {
    register,
    formState: { errors },
    setValue,
  } = useFormContext();

  // Handle nested field errors (e.g., users.0.email)
  const getNestedError = (path: string) => {
    return path.split(".").reduce((acc: any, part) => acc?.[part], errors);
  };

  const error = getNestedError(name);
  const errorMessage = error?.message;

  // Handle value formatting if provided
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    if (formatValue) {
      const formattedValue = formatValue(newValue);

      setValue(name, formattedValue);
    } else if (onChange) {
      onChange(e);
    }
  };

  // If value and onChange are provided, use them (controlled input)
  // Otherwise, use register (uncontrolled input)
  const inputProps =
    value !== undefined && onChange
      ? { value, onChange: handleChange }
      : {
          ...register(name),
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            register(name).onChange(e);
            if (formatValue) {
              const formattedValue = formatValue(e.target.value);

              setValue(name, formattedValue);
            }
          },
        };

  return (
    <Input
      {...props}
      {...inputProps}
      classNames={{
        ...props.classNames,
        input: `${props.classNames?.input || ""} ${error ? "border-red-500" : ""}`,
      }}
      errorMessage={errorMessage}
      isInvalid={!!error}
      label={
        <>
          {label}
          {isOptional && <OptionalLabel />}
        </>
      }
    />
  );
};

export const KYBMerchantForm = ({ initialEmail }: { initialEmail: string }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const methods = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      companyEmail: initialEmail,
      acceptedTerms: false,
      users: [
        {
          firstName: "",
          lastName: "",
          email: initialEmail,
          phoneNumber: "",
          roles: [UserRole.BENEFICIAL_OWNER, UserRole.REPRESENTATIVE],
        },
      ],
    },
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isValidating },
    trigger,
    watch,
    setError,
    clearErrors,
    register,
    setValue,
  } = methods;

  // Watch postcode changes
  const postcode = watch("postcode");

  useEffect(() => {
    const postcodeValue = postcode || "";

    if (postcodeValue && postcodeMap[postcodeValue]) {
      const data = postcodeMap[postcodeValue];

      setValue("city", data.city || "", { shouldValidate: true });
      setValue("state", data.stateAbbreviation || "", { shouldValidate: true });
    }
  }, [postcode, setValue]);

  const currentStepFields = getFieldsForStep(currentStep);
  const currentStepValues = useWatch({
    control,
    name: currentStepFields,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "users",
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsSubmitting(true);
    try {
      // Handle form submission
      console.log(data);
      // Add your API call here
    } catch (error: any) {
      // Handle API errors by setting form errors
      if (error.response?.data?.errors) {
        Object.entries(error.response.data.errors).forEach(([key, value]) => {
          setError(key as any, {
            type: "manual",
            message: value as string,
          });
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    switch (currentStep) {
      case 3: {
        const users = watch("users");

        console.log("Current users:", users); // Debug log

        // First check if Person 1's required fields are filled
        const person1 = users[0];

        console.log("Person 1 details:", person1); // Debug log

        // Validate Person 1's fields
        const isValidPerson1 =
          person1 &&
          person1.firstName?.length >= 2 &&
          person1.lastName?.length >= 2 &&
          person1.email &&
          person1.phoneNumber?.length >= 9;

        console.log("Is Person 1 valid:", isValidPerson1); // Debug log

        if (!isValidPerson1) {
          setError("users", {
            type: "manual",
            message: "Please fill out all required fields for Person 1",
          });

          return;
        }

        // Then check roles
        const hasBeneficialOwner = users.some((user) => user.roles?.includes(UserRole.BENEFICIAL_OWNER));
        const hasRepresentative = users.some((user) => user.roles?.includes(UserRole.REPRESENTATIVE));

        console.log("Has Beneficial Owner:", hasBeneficialOwner); // Debug log
        console.log("Has Representative:", hasRepresentative); // Debug log

        if (!hasBeneficialOwner || !hasRepresentative) {
          setError("users", {
            type: "manual",
            message: "At least one Beneficial Owner and one Representative are required",
          });

          return;
        }

        // If we get here, everything is valid
        clearErrors("users");

        // Ensure all users have the required fields initialized
        const updatedUsers = users.map((user: any) => ({
          ...user,
          countryOfIssue: user.countryOfIssue || "",
          birthDate: user.birthDate || "",
          socialSecurityNumber: user.socialSecurityNumber || "",
          streetAddress1: user.streetAddress1 || "",
          streetAddress2: user.streetAddress2 || "",
          city: user.city || "",
          state: user.state || "",
          postcode: user.postcode || "",
        }));

        setValue("users", updatedUsers);

        setCurrentStep((prev) => Math.min(prev + 1, steps.length));

        return;
      }
      default: {
        const fields = getFieldsForStep(currentStep);
        const isStepValid = await trigger(fields);

        console.log("Step validation result:", isStepValid); // Debug log
        if (isStepValid) {
          setCurrentStep((prev) => Math.min(prev + 1, steps.length));
        }
      }
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const steps = [
    {
      number: "1",
      title: "Company Account",
      content: (
        <div className="space-y-4">
          <FormField label="Company Name" name="companyName" placeholder="Algersoft" />
          <FormField label="Company Email" name="companyEmail" placeholder="hello@algersoft.com" />
          <FormField
            isOptional
            label="Company Website"
            name="companyWebsite"
            placeholder="example.com"
            startContent={
              <div className="pointer-events-none flex items-center">
                <span className="text-default-400 text-small">https://</span>
              </div>
            }
            type="text"
          />
          <div className="flex space-x-4">
            <FormField label="Postcode" name="postcode" placeholder="10001" />
            <FormField
              isDisabled
              label="City"
              name="city"
              placeholder="New York"
              value={watch("city")}
              onChange={(e) => setValue("city", e.target.value)}
            />
            <FormField
              isDisabled
              label="State"
              name="state"
              placeholder="NY"
              value={watch("state")}
              onChange={(e) => setValue("state", e.target.value)}
            />
          </div>
          <FormField label="Street Address 1" name="streetAddress1" placeholder="123 Main St" />
          <FormField isOptional label="Street Address 2" name="streetAddress2" placeholder="Apt 4B" />
          <div className="flex justify-end space-x-4">
            <Button
              className="bg-[#E31B88] text-white hover:bg-[#cc0077]"
              color="default"
              isDisabled={isValidating}
              onClick={handleNext}
            >
              Next
            </Button>
          </div>
        </div>
      ),
    },
    {
      number: "2",
      title: "Company Details",
      content: (
        <div className="space-y-4">
          <FormField
            label="Settlement Address"
            maxLength={42}
            name="settlementAddress"
            placeholder="0x1234567890123456789012345678901234567890"
          />
          <FormField
            label="Company Registration Number"
            maxLength={12}
            name="companyRegistrationNumber"
            placeholder="1234567"
          />
          <FormField label="Company Tax ID" maxLength={10} name="companyTaxId" placeholder="12-3456789" />
          <Select
            fullWidth
            label="Company Type"
            placeholder="Select Company Type"
            {...register("companyType")}
            errorMessage={errors.companyType?.message}
          >
            <SelectItem key="sole_proprietorship" value={CardCompanyType.SOLE_PROPRIETORSHIP}>
              Sole Proprietorship
            </SelectItem>
            <SelectItem key="llc" value={CardCompanyType.LLC}>
              Limited Liability Company (LLC)
            </SelectItem>
            <SelectItem key="c_corp" value={CardCompanyType.C_CORP}>
              C Corporation
            </SelectItem>
            <SelectItem key="s_corp" value={CardCompanyType.S_CORP}>
              S Corporation
            </SelectItem>
            <SelectItem key="partnership" value={CardCompanyType.PARTNERSHIP}>
              Partnership
            </SelectItem>
            <SelectItem key="lp" value={CardCompanyType.LP}>
              Limited Partnership (LP)
            </SelectItem>
            <SelectItem key="llp" value={CardCompanyType.LLP}>
              Limited Liability Partnership (LLP)
            </SelectItem>
            <SelectItem key="nonprofit" value={CardCompanyType.NONPROFIT}>
              Nonprofit Corporation
            </SelectItem>
          </Select>
          <FormField
            isOptional
            label="Company Description"
            maxLength={100}
            name="companyDescription"
            placeholder="Describe your company"
          />
          <div className="flex justify-end space-x-4">
            <Button onClick={handlePrevious}>Previous</Button>
            <Button
              className="bg-[#E31B88] text-white hover:bg-[#cc0077]"
              color="default"
              isDisabled={isValidating}
              onClick={handleNext}
            >
              Next
            </Button>
          </div>
        </div>
      ),
    },
    {
      number: "3",
      title: "Account Users",
      content: (
        <div className="space-y-4">
          <AccountUsers />
          <div className="flex justify-end space-x-4">
            <Button variant="bordered" onClick={handlePrevious}>
              Previous
            </Button>
            <Button
              className="bg-[#E31B88] text-white hover:bg-[#cc0077]"
              color="default"
              isDisabled={isValidating}
              onClick={handleNext}
            >
              Next
            </Button>
          </div>
        </div>
      ),
    },
    {
      number: "4",
      title: "User Details",
      content: (
        <div className="space-y-8">
          {fields.map((user, index) => (
            <div key={user.id} className="space-y-4 p-4 border border-default-200 rounded-lg">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold">
                  Person {index + 1}: {watch(`users.${index}.firstName`)} {watch(`users.${index}.lastName`)}
                </h2>
                <div className="text-sm text-default-400">
                  {watch(`users.${index}.roles`).map((role: string) => (
                    <span key={role} className="mr-2">
                      {role
                        .split("_")
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(" ")}
                    </span>
                  ))}
                </div>
              </div>
              <Select
                isRequired
                errorMessage={errors?.users?.[index]?.countryOfIssue?.message}
                isInvalid={!!errors?.users?.[index]?.countryOfIssue}
                label="Country of Issue (for ID)"
                placeholder="Select country"
                selectedKeys={watch(`users.${index}.countryOfIssue`) ? [watch(`users.${index}.countryOfIssue`)] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0];

                  setValue(`users.${index}.countryOfIssue`, selected as string, { shouldValidate: true });
                }}
              >
                <SelectItem key="usa" value="usa">
                  USA
                </SelectItem>
                <SelectItem key="canada" value="canada">
                  Canada
                </SelectItem>
              </Select>
              <Controller
                control={control}
                name={`users.${index}.birthDate`}
                render={({ field }) => (
                  <DatePicker
                    classNames={{
                      input: "max-w-full",
                    }}
                    errorMessage={errors?.users?.[index]?.birthDate?.message}
                    isInvalid={!!errors?.users?.[index]?.birthDate}
                    label="Birth Date"
                    maxValue={today(getLocalTimeZone())}
                    value={field.value ? parseDate(field.value) : null}
                    onChange={(date) => {
                      if (date) {
                        const formattedDate = date.toString().split("T")[0];

                        field.onChange(formattedDate);
                      } else {
                        field.onChange(undefined);
                      }
                    }}
                  />
                )}
              />
              <Controller
                control={control}
                name={`users.${index}.socialSecurityNumber`}
                render={({ field }) => (
                  <Input
                    {...field}
                    errorMessage={errors?.users?.[index]?.socialSecurityNumber?.message}
                    isInvalid={!!errors?.users?.[index]?.socialSecurityNumber}
                    label="Social Security Number"
                    maxLength={9}
                    placeholder="123456789"
                  />
                )}
              />
              <div className="grid grid-cols-3 gap-4">
                <Controller
                  control={control}
                  name={`users.${index}.postcode`}
                  render={({ field }) => (
                    <Input
                      {...field}
                      errorMessage={errors?.users?.[index]?.postcode?.message}
                      isInvalid={!!errors?.users?.[index]?.postcode}
                      label="Postcode"
                      placeholder="12345"
                      onChange={(e) => {
                        field.onChange(e);
                        const postcodeValue = e.target.value;

                        if (postcodeValue && postcodeMap[postcodeValue]) {
                          const data = postcodeMap[postcodeValue];

                          setValue(`users.${index}.city`, data.city || "", { shouldValidate: true });
                          setValue(`users.${index}.state`, data.stateAbbreviation || "", { shouldValidate: true });
                        }
                      }}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name={`users.${index}.city`}
                  render={({ field }) => (
                    <Input
                      {...field}
                      errorMessage={errors?.users?.[index]?.city?.message}
                      isDisabled={true}
                      isInvalid={!!errors?.users?.[index]?.city}
                      label="City"
                      placeholder="New York"
                    />
                  )}
                />
                <Controller
                  control={control}
                  name={`users.${index}.state`}
                  render={({ field }) => (
                    <Input
                      {...field}
                      errorMessage={errors?.users?.[index]?.state?.message}
                      isDisabled={true}
                      isInvalid={!!errors?.users?.[index]?.state}
                      label="State"
                      placeholder="NY"
                    />
                  )}
                />
              </div>
              <Controller
                control={control}
                name={`users.${index}.streetAddress1`}
                render={({ field }) => (
                  <Input
                    {...field}
                    errorMessage={errors?.users?.[index]?.streetAddress1?.message}
                    isInvalid={!!errors?.users?.[index]?.streetAddress1}
                    label="Street Address 1"
                    placeholder="123 Main St"
                  />
                )}
              />
              <Controller
                control={control}
                name={`users.${index}.streetAddress2`}
                render={({ field }) => (
                  <Input
                    {...field}
                    errorMessage={errors?.users?.[index]?.streetAddress2?.message}
                    isInvalid={!!errors?.users?.[index]?.streetAddress2}
                    label="Street Address 2"
                    placeholder="Apt 4B"
                  />
                )}
              />
              {index < fields.length - 1 && <Divider className="my-4" />}
            </div>
          ))}
          <div className="flex justify-end space-x-4">
            <Button variant="bordered" onClick={handlePrevious}>
              Previous
            </Button>
            <Button
              className="bg-[#E31B88] text-white hover:bg-[#cc0077]"
              color="default"
              isDisabled={isValidating}
              onClick={handleNext}
            >
              Next
            </Button>
          </div>
        </div>
      ),
    },
    {
      number: "5",
      title: "Terms and Conditions",
      content: (
        <div className="space-y-6">
          <div className="rounded-xl border border-default-200 bg-content1 p-6">
            <div className="space-y-6">
              {/* Services Overview */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg">Rain Card</h3>
                  <div className="text-sm">
                    <a
                      className="text-primary hover:text-primary-600"
                      href="https://www.raincards.xyz/legal/docs/corporate-card-terms"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      Terms of Service
                    </a>
                    <span> and </span>
                    <a
                      className="text-primary hover:text-primary-600"
                      href="https://www.raincards.xyz/legal/docs/privacy-policy"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      Privacy Policy
                    </a>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg">Bill Pay</h3>
                  <div className="text-sm">
                    <a
                      className="text-primary hover:text-primary-600"
                      href="https://www.bridge.xyz/legal"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      Terms of Service
                    </a>
                    <span> and </span>
                    <a
                      className="text-primary hover:text-primary-600"
                      href="https://www.bridge.xyz/legal"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      Privacy Policy
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Agreement Checkbox */}
          <div className="p-4 rounded-xl bg-[#0A0A0A] border border-[#1f1f1f]">
            <Controller
              control={control}
              defaultValue={false}
              name="acceptedTerms"
              render={({ field: { onChange, value } }) => (
                <Checkbox
                  color="primary"
                  isInvalid={!!errors.acceptedTerms}
                  isSelected={value}
                  onValueChange={(checked) => {
                    onChange(checked);
                    setValue("acceptedBillPay", checked);
                    setValue("acceptedCardProgram", checked);
                  }}
                >
                  I accept all terms and conditions for Rain Card and Bill Pay services, including Backpack&apos;s
                  platform terms
                </Checkbox>
              )}
            />
            {errors.acceptedTerms && (
              <p className="text-danger text-xs mt-1">You must accept all terms and conditions to proceed</p>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-end space-x-4 mt-8">
            <Button variant="bordered" onClick={handlePrevious}>
              Previous
            </Button>
            <Button
              className="bg-[#E31B88] text-white hover:bg-[#cc0077]"
              color="default"
              isDisabled={!watch("acceptedTerms") || isValidating}
              onClick={handleNext}
            >
              Next
            </Button>
          </div>
        </div>
      ),
    },
    {
      number: "6",
      title: "Review",
      content: (
        <div className="space-y-8">
          {/* Company Information */}
          <div className="rounded-xl border border-default-200 bg-content1 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Company Information</h2>
                <Button
                  className="text-[#E31B88] hover:text-[#cc0077]"
                  size="sm"
                  startContent={<Edit className="w-4 h-4" />}
                  variant="light"
                  onClick={() => setCurrentStep(1)}
                >
                  Edit
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-default-500">Company Name</p>
                  <p className="font-medium">{watch("companyName")}</p>
                </div>
                <div>
                  <p className="text-sm text-default-500">Company Email</p>
                  <p className="font-medium">{watch("companyEmail")}</p>
                </div>
                <div>
                  <p className="text-sm text-default-500">Company Website</p>
                  <p className="font-medium">{watch("companyWebsite") ? `https://${watch("companyWebsite")}` : "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-default-500">Address</p>
                  <p className="font-medium">
                    {watch("streetAddress1")}
                    {watch("streetAddress2") && `, ${watch("streetAddress2")}`}
                  </p>
                  <p className="font-medium">
                    {watch("city")}, {watch("state")} {watch("postcode")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Company Details */}
          <div className="rounded-xl border border-default-200 bg-content1 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Company Details</h2>
                <Button
                  className="text-[#E31B88] hover:text-[#cc0077]"
                  size="sm"
                  startContent={<Edit className="w-4 h-4" />}
                  variant="light"
                  onClick={() => setCurrentStep(2)}
                >
                  Edit
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-default-500">Settlement Address</p>
                  <p className="font-medium break-all">{watch("settlementAddress")}</p>
                </div>
                <div>
                  <p className="text-sm text-default-500">Registration Number</p>
                  <p className="font-medium">{watch("companyRegistrationNumber")}</p>
                </div>
                <div>
                  <p className="text-sm text-default-500">Tax ID</p>
                  <p className="font-medium">{watch("companyTaxId")}</p>
                </div>
                <div>
                  <p className="text-sm text-default-500">Company Type</p>
                  <p className="font-medium">
                    {watch("companyType")
                      ?.split("_")
                      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(" ")}
                  </p>
                </div>
                {watch("companyDescription") && (
                  <div className="col-span-2">
                    <p className="text-sm text-default-500">Description</p>
                    <p className="font-medium">{watch("companyDescription")}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Users Information */}
          <div className="rounded-xl border border-default-200 bg-content1 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Account Users</h2>
                <Button
                  className="text-[#E31B88] hover:text-[#cc0077]"
                  size="sm"
                  startContent={<Edit className="w-4 h-4" />}
                  variant="light"
                  onClick={() => setCurrentStep(3)}
                >
                  Edit
                </Button>
              </div>
              <div className="space-y-6">
                {fields.map((field, index) => {
                  const user = watch(`users.${index}`);

                  return (
                    <div key={field.id} className="p-4 bg-default-50 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">
                          Person {index + 1}: {user.firstName} {user.lastName}
                          {index === 0 && <span className="text-sm text-primary ml-2">(Your details)</span>}
                        </h3>
                        <div className="flex gap-2">
                          {user.roles.map((role: string) => (
                            <span key={role} className="px-2 py-1 text-xs rounded-full bg-default-200 text-default-600">
                              {role
                                .split("_")
                                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                                .join(" ")}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-default-500">Email</p>
                          <p className="font-medium">{user.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-default-500">Phone</p>
                          <p className="font-medium">{user.phoneNumber}</p>
                        </div>
                        <div>
                          <p className="text-sm text-default-500">Country of Issue</p>
                          <p className="font-medium">{user.countryOfIssue?.toUpperCase()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-default-500">Birth Date</p>
                          <p className="font-medium">{user.birthDate}</p>
                        </div>
                        <div>
                          <p className="text-sm text-default-500">Social Security Number</p>
                          <p className="font-medium">XXX-XX-{user.socialSecurityNumber?.slice(-4)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-default-500">Address</p>
                          <p className="font-medium">
                            {user.streetAddress1}
                            {user.streetAddress2 && `, ${user.streetAddress2}`}
                          </p>
                          <p className="font-medium">
                            {user.city}, {user.state} {user.postcode}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="rounded-xl border border-default-200 bg-content1 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Terms and Conditions</h2>
                <Button
                  className="text-[#E31B88] hover:text-[#cc0077]"
                  size="sm"
                  startContent={<Edit className="w-4 h-4" />}
                  variant="light"
                  onClick={() => setCurrentStep(5)}
                >
                  Edit
                </Button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <p className="text-sm">Accepted Rain Card Terms of Service and Privacy Policy</p>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <p className="text-sm">Accepted Bill Pay Terms of Service and Privacy Policy</p>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <p className="text-sm">Accepted Backpack Platform Terms</p>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Section */}
          <div className="flex justify-end space-x-4">
            <Button variant="bordered" onClick={handlePrevious}>
              Previous
            </Button>
            <Button
              className="bg-[#E31B88] text-white hover:bg-[#cc0077]"
              isDisabled={!isValid || isSubmitting}
              isLoading={isSubmitting}
              type="submit"
            >
              Submit Application
            </Button>
          </div>
        </div>
      ),
    },
  ];

  const CircleWithNumber = ({ number }: { number: string }) => (
    <div className="relative flex items-center justify-center w-10 h-10">
      <Circle className="w-10 h-10 text-white" />
      <span className="absolute text-white font-bold">{number}</span>
    </div>
  );

  const CheckCircleIcon = () => (
    <div className="flex items-center justify-center w-10 h-10">
      <CheckCircle className="w-10 h-10 text-green-500" />
    </div>
  );

  return (
    <FormProvider {...methods}>
      <form noValidate className="max-w-3xl mx-auto" onSubmit={handleSubmit(onSubmit)}>
        {/* <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Merchant Onboarding</h1>
            <div className="text-sm text-gray-600">
              Step {currentStep} of {steps.length}
            </div>
          </div>
          <div className="w-full bg-gray-200 h-2 rounded-full">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            />
          </div>
        </div> */}

        <Accordion
          className="bg-charyo-500"
          selectedKeys={[currentStep.toString()]}
          variant="shadow"
          onSelectionChange={(keys) => {
            if (Array.isArray(keys) && keys.length > 0) {
              const newStep = Number(keys[0]);

              // Only allow moving to previous steps or the next available step
              if (newStep <= currentStep || newStep === currentStep + 1) {
                setCurrentStep(newStep);
              }
            }
          }}
        >
          {steps.map((step, index) => (
            <AccordionItem
              key={step.number}
              aria-label={step.title}
              classNames={{
                title: "text-lg font-bold",
                heading: "pointer-events-none cursor-default",
                content: "p-6",
              }}
              isDisabled={index > currentStep}
              startContent={
                currentStep > Number(step.number) ? <CheckCircleIcon /> : <CircleWithNumber number={step.number} />
              }
              title={step.title}
            >
              {step.content}
            </AccordionItem>
          ))}
        </Accordion>
      </form>
    </FormProvider>
  );
};
