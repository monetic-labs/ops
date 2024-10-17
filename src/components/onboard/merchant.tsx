"use client";

import { Accordion, AccordionItem } from "@nextui-org/accordion";
import { Circle, CheckCircle } from "lucide-react";
import { useState } from "react";
import { Input } from "@nextui-org/input";
import { Button } from "@nextui-org/button";
import { User } from "@/data";
import { Select, SelectItem } from "@nextui-org/select";
import { AccountUsers } from "./account-users";
import { Divider } from "@nextui-org/divider";

export const KYBMerchantForm = ({ initialEmail }: { initialEmail: string }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [users, setUsers] = useState<User[]>([]);

  const defaultContent =
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";

  const steps = [
    {
      number: "1",
      title: "Company Details",
      content: (
        <div className="space-y-4">
          <Input label="Company Name" placeholder="Enter company name" fullWidth />
          <Input label="Company Email" placeholder="Enter company email" fullWidth />
          <Input label="Company Website" placeholder="Enter company website" fullWidth />
          <div className="flex space-x-4">
            <Input label="Postcode" placeholder="Enter postcode" fullWidth />
            <Input label="City" placeholder="Enter city" fullWidth />
            <Input label="State" placeholder="Enter state" fullWidth />
          </div>
          <Input label="Street Address 1" placeholder="Enter street address 1" fullWidth />
          <Input label="Street Address 2" placeholder="Enter street address 2" fullWidth />
          <div className="flex justify-end space-x-4">
            <Button onClick={() => setCurrentStep(currentStep + 1)}>Next</Button>
          </div>
        </div>
      ),
    },
    {
      number: "2",
      title: "Company Details",
      content: (
        <div className="space-y-4">
          <Input label="Settlement Address" placeholder="Enter settlement address" fullWidth />
          <Input label="Company EIN" placeholder="Enter company EIN" fullWidth />
          <Input label="Company Type" placeholder="Enter company type" fullWidth />
          <Input label="Company Description" placeholder="Enter company description" fullWidth />
          <div className="flex justify-between space-x-4">
            <Button onClick={() => setCurrentStep(currentStep - 1)}>Previous</Button>
            <Button onClick={() => setCurrentStep(currentStep + 1)}>Next</Button>
          </div>
        </div>
      ),
    },
    {
      number: "3",
      title: "Account Users",
      content: (
        <div className="space-y-4">
          <AccountUsers users={users} setUsers={setUsers} />
          <div className="flex justify-between space-x-4">
            <Button onClick={() => setCurrentStep(currentStep - 1)}>Previous</Button>
            <div className="flex justify-end space-x-4">
              <Button onClick={() => setCurrentStep(currentStep + 1)}>Next</Button>
            </div>
          </div>
        </div>
      ),
    },
    {
      number: "4",
      title: "User Details",
      content: (
        <div className="space-y-4">
          {users.map((user) => (
            <div key={user.id} className="space-y-4">
              <h1 className="text-lg font-bold">
                {user.firstName} {user.lastName}
              </h1>
              <Select label="Country of Issue" placeholder="Select country" fullWidth value={user.countryOfIssue}>
                <SelectItem key="usa" value="usa">
                  USA
                </SelectItem>
                <SelectItem key="canada" value="canada">
                  Canada
                </SelectItem>
              </Select>
              <Input
                label="Birth Date"
                placeholder="Enter birth date"
                fullWidth
                value={user.birthDate}
                onChange={(e) =>
                  setUsers(users.map((u) => (u.id === user.id ? { ...u, birthDate: e.target.value } : u)))
                }
              />
              <Input
                label="Social Security Number"
                placeholder="Enter social security number"
                fullWidth
                value={user.socialSecurityNumber}
                onChange={(e) =>
                  setUsers(users.map((u) => (u.id === user.id ? { ...u, socialSecurityNumber: e.target.value } : u)))
                }
              />
              <div className="flex space-x-4">
                <Input
                  label="Postcode"
                  placeholder="Enter postcode"
                  fullWidth
                  value={user.postcode}
                  onChange={(e) =>
                    setUsers(users.map((u) => (u.id === user.id ? { ...u, postcode: e.target.value } : u)))
                  }
                />
                <Input
                  label="City"
                  placeholder="Enter city"
                  fullWidth
                  value={user.city}
                  onChange={(e) => setUsers(users.map((u) => (u.id === user.id ? { ...u, city: e.target.value } : u)))}
                />
                <Input
                  label="State"
                  placeholder="Enter state"
                  fullWidth
                  value={user.state}
                  onChange={(e) => setUsers(users.map((u) => (u.id === user.id ? { ...u, state: e.target.value } : u)))}
                />
              </div>
              <Input
                label="Street Address 1"
                placeholder="Enter street address 1"
                fullWidth
                value={user.streetAddress1}
                onChange={(e) =>
                  setUsers(users.map((u) => (u.id === user.id ? { ...u, streetAddress1: e.target.value } : u)))
                }
              />
              <Input
                label="Street Address 2"
                placeholder="Enter street address 2"
                fullWidth
                value={user.streetAddress2}
                onChange={(e) =>
                  setUsers(users.map((u) => (u.id === user.id ? { ...u, streetAddress2: e.target.value } : u)))
                }
              />
            </div>
          ))}
          <div className="flex justify-end space-x-4">
            <Button onClick={() => setCurrentStep(currentStep - 1)}>Previous</Button>
            <Button onClick={() => setCurrentStep(currentStep + 1)}>Next</Button>
          </div>
        </div>
      ),
    },
    {
      number: "5",
      title: "Review",
      content: (
        <div className="space-y-4">
          <h1 className="text-lg font-bold">Company Information</h1>
          <Divider />
          <h1 className="text-lg font-bold">Users Information</h1>
          {users.map((user) => (
            <div key={user.id} className="p-4 border rounded-md">
              <h2 className="text-lg font-bold">
                {user.firstName} {user.lastName}
              </h2>
              <p>Email: {user.email}</p>
              <p>Phone: {user.phoneNumber}</p>
              <p>Role: {user.role}</p>
              <p>Country of Issue: {user.countryOfIssue || "N/A"}</p>
              <p>Birth Date: {user.birthDate || "N/A"}</p>
              <p>Social Security Number: {user.socialSecurityNumber || "N/A"}</p>
              <p>
                Address:{" "}
                {`${user.streetAddress1 || ""} ${user.streetAddress2 || ""}, ${user.city || ""}, ${user.state || ""}, ${
                  user.postcode || ""
                }`}
              </p>
            </div>
          ))}
          <div className="flex justify-end space-x-4">
            <Button onClick={() => setCurrentStep(currentStep - 1)}>Previous</Button>
            <Button onClick={() => setCurrentStep(currentStep + 1)}>Next</Button>
          </div>
        </div>
      ),
    },
    {
      number: "6",
      title: "Terms and Conditions",
      content: (
        <div className="space-y-4">
          <div className="space-y-4 p-4 border rounded-md">
            <h2 className="text-lg font-bold">Bill Pay Agreement</h2>
            <p>
              The Rain Corporate Card ("Rain Card") is a business card issued to the Account holder under the Rain
              Platform Agreement and the Rain Corporate Card Agreement. The Rain Corporate Card is issued by Third
              National ("Issuer").
              <a href="#" className="text-blue-500">
                Terms of Service
              </a>
              and
              <a href="#" className="text-blue-500">
                Privacy Policy
              </a>
              .
            </p>
            <Button className="bg-pink-500 text-white" onClick={() => setCurrentStep(currentStep + 1)}>
              Accept Terms
            </Button>
          </div>
          <div className="space-y-4 p-4 border rounded-md">
            <h3 className="text-md font-semibold">Card Program Agreement</h3>
            <p>
              The Rain Corporate Card ("Rain Card") is a business card issued to the Account holder under the Rain
              Platform Agreement and the Rain Corporate Card Agreement. The Rain Corporate Card is issued by Third
              National ("Issuer").
              <a href="#" className="text-blue-500">
                Terms of Service
              </a>
              and
              <a href="#" className="text-blue-500">
                Privacy Policy
              </a>
              .
            </p>
            <Button className="bg-ualert-500 text-white" onClick={() => setCurrentStep(currentStep + 1)}>
              Accept Terms
            </Button>
          </div>
          <div className="flex justify-end space-x-4">
            <Button onClick={() => setCurrentStep(currentStep - 1)}>Previous</Button>
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
    <Accordion
      variant="shadow"
      className="bg-charyo-500"
      selectedKeys={[currentStep.toString()]}
      onSelectionChange={(keys) => setCurrentStep(Number(keys))}
    >
      {steps.map((step) => (
        <AccordionItem
          key={step.number}
          startContent={
            currentStep > Number(step.number) ? <CheckCircleIcon /> : <CircleWithNumber number={step.number} />
          }
          aria-label={step.title}
          title={step.title}
          classNames={{
            title: "text-lg font-bold",
          }}
        >
          {step.content}
        </AccordionItem>
      ))}
    </Accordion>
  );
};
