"use client";

import { Accordion, AccordionItem } from "@nextui-org/accordion";
import { Circle, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@nextui-org/input";
import { Button } from "@nextui-org/button";
import { User } from "@/data";
import { Select, SelectItem } from "@nextui-org/select";
import { AccountUsers } from "./account-users";
import { Divider } from "@nextui-org/divider";
import { z } from "zod";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Define your validation schema using Zod
const schema = z.object({
  companyName: z.string().min(1, "Company name is required").max(2, "Company name must be 2 characters or less"),
  companyEmail: z.string().email("Invalid email address"),
  companyWebsite: z.string().transform((value) => {
    switch (true) {
      case value.startsWith("https://"):
        return value.slice(8);
      case value.startsWith("http://"):
        return value.slice(7);
      case value.startsWith("www."):
        return value.slice(4);
      default:
        return value;
    }
  }),
  postcode: z.string().min(1, "Postcode is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  streetAddress1: z.string().min(1, "Street address is required"),
  streetAddress2: z.string().optional(),

  settlementAddress: z.string().min(1, "Settlement address is required"),
  companyEIN: z.string().min(1, "Company EIN is required"),
  companyType: z.string().min(1, "Company type is required"),
  companyDescription: z.string().min(1, "Company description is required"),
});

type FormData = z.infer<typeof schema>;

export const KYBMerchantForm = ({ initialEmail }: { initialEmail: string }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [users, setUsers] = useState<User[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isValidating },
    trigger,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit: SubmitHandler<FormData> = (data) => {
    // Handle form submission
    console.log(data);
  };

  const steps = [
    {
      number: "1",
      title: "Company Details",
      content: (
        <div className="space-y-4">
          <Input
            label="Company Name"
            placeholder="Algersoft"
            fullWidth
            {...register("companyName", {
              onChange: () => trigger("companyName"),
            })}
            isInvalid={!!errors.companyName}
            errorMessage={errors.companyName?.message}
          />
          <Input
            label="Company Email"
            placeholder="hello@algersoft.com"
            fullWidth
            {...register("companyEmail", {
              onChange: () => trigger("companyEmail"),
            })}
            isInvalid={!!errors.companyEmail}
            errorMessage={errors.companyEmail?.message}
          />
          <Input
            label="Company Website"
            placeholder="algersoft.com"
            type="url"
            fullWidth
            startContent={
              <div className="pointer-events-none flex items-center">
                <span className="text-default-400 text-small">https://</span>
              </div>
            }
            {...register("companyWebsite", {
              onChange: () => trigger("companyWebsite"),
            })}
            isInvalid={!!errors.companyWebsite}
            errorMessage={errors.companyWebsite?.message}
          />
          <div className="flex space-x-4">
            <Input
              label="Postcode"
              placeholder="10001"
              fullWidth
              {...register("postcode", {
                onChange: () => trigger("postcode"),
              })}
              isInvalid={!!errors.postcode}
              errorMessage={errors.postcode?.message}
            />
            <Input
              label="City"
              placeholder="New York"
              fullWidth
              {...register("city", {
                onChange: () => trigger("city"),
              })}
              isInvalid={!!errors.city}
              errorMessage={errors.city?.message}
            />
            <Input
              label="State"
              placeholder="NY"
              fullWidth
              {...register("state", {
                onChange: () => trigger("state"),
              })}
              isInvalid={!!errors.state}
              errorMessage={errors.state?.message}
            />
          </div>
          <Input
            label="Street Address 1"
            placeholder="123 Main St"
            fullWidth
            {...register("streetAddress1", {
              onChange: () => trigger("streetAddress1"),
            })}
            isInvalid={!!errors.streetAddress1}
            errorMessage={errors.streetAddress1?.message}
          />
          <Input
            label="Street Address 2"
            placeholder="Apt 4B"
            fullWidth
            {...register("streetAddress2", {
              onChange: () => trigger("streetAddress2"),
            })}
            isInvalid={!!errors.streetAddress2}
            errorMessage={errors.streetAddress2?.message}
          />
          <div className="flex justify-end space-x-4">
            <Button
              onClick={async () => {
                const isValid = await trigger();
                return isValid && setCurrentStep(currentStep + 1);
              }}
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
          <Input
            label="Settlement Address"
            placeholder="Enter settlement address"
            fullWidth
            {...register("settlementAddress", {
              onChange: () => trigger("settlementAddress"),
            })}
            isInvalid={!!errors.settlementAddress}
            errorMessage={errors.settlementAddress?.message}
          />
          <Input
            label="Company EIN"
            placeholder="Enter company EIN"
            fullWidth
            {...register("companyEIN", {
              onChange: () => trigger("companyEIN"),
            })}
            isInvalid={!!errors.companyEIN}
            errorMessage={errors.companyEIN?.message}
          />
          <Input
            label="Company Type"
            placeholder="Enter company type"
            fullWidth
            {...register("companyType")}
            errorMessage={errors.companyType?.message}
          />
          <Input
            label="Company Description"
            placeholder="Enter company description"
            fullWidth
            {...register("companyDescription")}
            errorMessage={errors.companyDescription?.message}
          />
          <div className="flex justify-end space-x-4">
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
          <div className="flex justify-end space-x-4">
            <Button onClick={() => setCurrentStep(currentStep - 1)}>Previous</Button>
            <Button onClick={() => setCurrentStep(currentStep + 1)}>Next</Button>
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
            <Button type="submit">Submit</Button>
          </div>
        </div>
      ),
    },
    {
      number: "5",
      title: "Terms and Conditions",
      content: (
        <div className="space-y-4">
          <div className="space-y-4 p-4 border rounded-md">
            <h2 className="text-lg font-bold">Bill Pay Agreement</h2>
            <p>
              The Rain Corporate Card (&quot;Rain Card&quot;) is a business card issued to the Account holder under the
              Rain Platform Agreement and the Rain Corporate Card Agreement. The Rain Corporate Card is issued by Third
              National (&quot;Issuer&quot;).
              <a href="https://www.raincards.xyz/" className="text-blue-500">
                Terms of Service
              </a>
              and
              <a href="https://www.raincards.xyz/" className="text-blue-500">
                Privacy Policy
              </a>
              .
            </p>
          </div>
          <div className="space-y-4 p-4 border rounded-md">
            <h3 className="text-md font-semibold">Card Program Agreement</h3>
            <p>
              The Rain Corporate Card (&quot;Rain Card&quot;) is a business card issued to the Account holder under the
              Rain Platform Agreement and the Rain Corporate Card Agreement. The Rain Corporate Card is issued by Third
              National (&quot;Issuer&quot;).
              <a href="https://www.raincards.xyz/" className="text-blue-500">
                Terms of Service
              </a>
              and
              <a href="https://www.raincards.xyz/" className="text-blue-500">
                Privacy Policy
              </a>
              .
            </p>
          </div>
          <div className="flex justify-end space-x-4">
            <div className="flex justify-end space-x-4">
              <Button onClick={() => setCurrentStep(currentStep - 1)}>Previous</Button>
              <Button onClick={() => setCurrentStep(currentStep + 1)}>Next</Button>
            </div>
          </div>
        </div>
      ),
    },
    {
      number: "6",
      title: "Document Upload",
      content: (
        <div className="space-y-4">
          <div className="flex justify-end space-x-4">
            <Button onClick={() => setCurrentStep(currentStep - 1)}>Previous</Button>
            <Button className="bg-ualert-500 text-white" onClick={() => setCurrentStep(currentStep + 1)}>
              Next
            </Button>
          </div>
        </div>
      ),
    },
    {
      number: "7",
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
    <form onSubmit={handleSubmit(onSubmit)}>
      <Accordion
        variant="shadow"
        className="bg-charyo-500"
        selectedKeys={[currentStep.toString()]}
        onSelectionChange={(keys) => {
          if (keys.size > 0) {
            setCurrentStep(Number(Array.from(keys)[0]));
          }
        }}
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
    </form>
  );
};
