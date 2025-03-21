import React from "react";
import { Info, AlertTriangle } from "lucide-react";
import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { Accordion, AccordionItem } from "@nextui-org/accordion";

interface DocumentTipsProps {
  hideAlert?: boolean;
}

export function DocumentTips({ hideAlert = false }: DocumentTipsProps) {
  return (
    <Card className="bg-content1/90 backdrop-blur-sm border border-border rounded-xl shadow-sm">
      <CardHeader className="flex gap-3">
        <Info className="text-primary" size={24} />
        <div className="flex flex-col">
          <p className="text-lg font-semibold">Document Upload Tips</p>
          <p className="text-small text-default-500">Follow these guidelines to avoid verification delays</p>
        </div>
      </CardHeader>
      <CardBody>
        {!hideAlert && (
          <div className="mb-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-warning-50 border border-warning-200">
              <AlertTriangle className="text-warning mt-0.5 flex-shrink-0" size={18} />
              <p className="text-sm font-medium text-warning-700">
                We're currently experiencing review delays of up to several days. Providing complete and accurate
                documentation upfront will help expedite your verification.
              </p>
            </div>
          </div>
        )}

        <Accordion>
          <AccordionItem
            key="common-issues"
            aria-label="Common Rejection Reasons"
            title="Common Rejection Reasons"
            classNames={{
              title: "text-medium font-semibold",
            }}
          >
            <ul className="list-disc pl-5 text-sm text-default-700 space-y-2">
              <li>Formation documents not stamped/filed with Secretary of State</li>
              <li>Invalid proof of address (invoices, documents older than 90 days, virtual addresses)</li>
              <li>Unacceptable ownership documents (spreadsheets or unsigned/unclear cap tables)</li>
            </ul>
          </AccordionItem>

          <AccordionItem
            key="business-ownership"
            aria-label="Business Ownership Documents"
            title="Business Ownership Document Requirements"
            classNames={{
              title: "text-medium font-semibold",
            }}
          >
            <div className="text-sm text-default-700 space-y-2">
              <p>Documentation must confirm all individual beneficial owners who own 25%+ of the entity.</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Documents must be dated and signed by a verified control person, lawyer, or CPA</li>
                <li>100% of ownership must be clearly accounted for</li>
                <li>If owned by another entity, subsidiary ownership documentation is required</li>
              </ul>
            </div>
          </AccordionItem>

          <AccordionItem
            key="proof-of-address"
            aria-label="Proof of Address Requirements"
            title="Proof of Address Requirements"
            classNames={{
              title: "text-medium font-semibold",
            }}
          >
            <div className="text-sm text-default-700 space-y-2">
              <p>For businesses:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Document confirming current operating address</li>
                <li>Issued within the last 90 days</li>
                <li>No PO boxes or virtual addresses</li>
                <li>Accepted: Bank statements, utility bills, government letters, current lease</li>
              </ul>
            </div>
          </AccordionItem>
        </Accordion>
      </CardBody>
    </Card>
  );
}
