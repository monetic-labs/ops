import React from "react";
import { Button } from "@nextui-org/button";
import { Divider } from "@nextui-org/divider";

import { MerchantFormData } from "@/validations/merchant";

interface ReviewProps {
  data: MerchantFormData;
  onSubmit: () => void;
  onEdit: (step: string) => void;
}

export function Review({ data, onSubmit, onEdit }: ReviewProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Review Your Information</h2>

      <section>
        <h3 className="text-xl font-semibold mb-2">Company Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p>
              <strong>Company Name:</strong> {data.company.name}
            </p>
            <p>
              <strong>DBA Name:</strong> {data.company.email}
            </p>
            <p>
              <strong>Tax ID:</strong> {data.company.registeredAddress.postcode}
            </p>
            <p>
              <strong>Company Type:</strong> {data.company.registeredAddress.country}
            </p>
          </div>
          <div>
            <p>
              <strong>Address:</strong> {data.company.registeredAddress.street1}
            </p>
            <p>
              <strong>City:</strong> {data.company.registeredAddress.city}
            </p>
            <p>
              <strong>State:</strong> {data.company.registeredAddress.state}
            </p>
            <p>
              <strong>Zip Code:</strong> {data.company.registeredAddress.postcode}
            </p>
          </div>
        </div>
        <Button size="sm" variant="light" onPress={() => onEdit("company-info")}>
          Edit
        </Button>
      </section>

      <Divider />

      <section>
        <h3 className="text-xl font-semibold mb-2">Company Owners</h3>
        {data.representatives.map((rep, index) => (
          <div key={index} className="mb-4">
            <h4 className="text-lg font-medium">Owner {index + 1}</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p>
                  <strong>Name:</strong> {rep.name} {rep.surname}
                </p>
                <p>
                  <strong>Email:</strong> {rep.email}
                </p>
                <p>
                  <strong>Phone:</strong> {rep.phoneNumber}
                </p>
              </div>
              <div>
                <p>
                  <strong>Wallet Address:</strong> {rep.walletAddress}
                </p>
              </div>
            </div>
          </div>
        ))}
        <Button size="sm" variant="light" onPress={() => onEdit("company-owner")}>
          Edit
        </Button>
      </section>

      <Divider />

      <div className="mt-8 flex justify-end space-x-4">
        <Button color="primary" onPress={onSubmit}>
          Confirm and Submit
        </Button>
      </div>
    </div>
  );
}
