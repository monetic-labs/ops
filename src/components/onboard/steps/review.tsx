"use client";

import { useFormContext } from "react-hook-form";
import { CheckCircle, Edit } from "lucide-react";
import { Button } from "@nextui-org/button";
import { FormData } from "@/validations/onboard/schemas";
import { formatCompanyType, formatEIN, formatPhoneNumber, truncateAddress } from "@/utils/helpers";

export const ReviewStep = ({ onStepChange }: { onStepChange: (step: number) => void }) => {
  const { watch } = useFormContext<FormData>();
  const formData = watch();

  const EditButton = ({ step }: { step: number }) => (
    <Button
      className="text-[#E31B88] hover:text-[#cc0077]"
      onClick={() => onStepChange(step)}
      size="sm"
      variant="light"
    >
      <Edit className="text-[#E31B88] hover:text-[#cc0077]" size={16} />
      Edit
    </Button>
  );

  return (
    <div className="mb-8 space-y-8">
      {/* Company Information */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Company Information</h3>
          <EditButton step={1} />
        </div>
        <div className="grid grid-cols-2 gap-4 rounded-lg border border-default-200 p-4">
          <div>
            <p className="text-sm text-default-500">Company Name</p>
            <p>{formData.companyName}</p>
          </div>
          <div>
            <p className="text-sm text-default-500">Company Email</p>
            <p>{formData.companyEmail}</p>
          </div>
          {formData.companyWebsite && (
            <div>
              <p className="text-sm text-default-500">Company Website</p>
              <p>{formData.companyWebsite}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-default-500">Address</p>
            <p>
              {formData.streetAddress1}
              {formData.streetAddress2 && <span>, {formData.streetAddress2}</span>}
            </p>
            <p>
              {formData.city}, {formData.state} {formData.postcode}
            </p>
          </div>
        </div>
      </div>

      {/* Company Details */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Company Details</h3>
          <EditButton step={2} />
        </div>
        <div className="grid grid-cols-2 gap-4 rounded-lg border border-default-200 p-4">
          <div>
            <p className="text-sm text-default-500">Settlement Address</p>
            <p>{truncateAddress(formData.settlementAddress)}</p>
          </div>
          <div>
            <p className="text-sm text-default-500">Registration Number</p>
            <p>{formData.companyRegistrationNumber}</p>
          </div>
          <div>
            <p className="text-sm text-default-500">Tax ID</p>
            <p>{formatEIN(formData.companyTaxId)}</p>
          </div>
          <div>
            <p className="text-sm text-default-500">Company Type</p>
            <p>{formatCompanyType(formData.companyType)}</p>
          </div>
          {formData.companyDescription && (
            <div className="col-span-2">
              <p className="text-sm text-default-500">Company Description</p>
              <p>{formData.companyDescription}</p>
            </div>
          )}
        </div>
      </div>

      {/* Account Users */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Account Users</h3>
          <EditButton step={3} />
        </div>
        <div className="space-y-6">
          {formData.users.map((user, index) => (
            <div key={index} className="rounded-lg border border-default-200 p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-default-500">Name</p>
                  <p>
                    {user.firstName} {user.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-default-500">Email</p>
                  <p>{user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-default-500">Phone</p>
                  <p>{formatPhoneNumber(user.phoneNumber.number, user.phoneNumber.extension)}</p>
                </div>
                <div>
                  <p className="text-sm text-default-500">Roles</p>
                  <div className="flex flex-wrap gap-2">
                    {user.roles.map((role) => (
                      <span
                        key={role}
                        className="inline-flex items-center gap-1 rounded-full bg-default-100 px-2 py-1 text-xs"
                      >
                        <CheckCircle className="h-3 w-3" />
                        {role
                          .split("_")
                          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(" ")}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Terms and Conditions</h3>
          <EditButton step={5} />
        </div>
        <div className="rounded-lg border border-default-200 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <p>All terms and conditions accepted</p>
          </div>
        </div>
      </div>
    </div>
  );
};
