import React, { useState, useEffect } from "react";
import { Progress } from "@nextui-org/progress";
import { useForm } from "react-hook-form";
import { ModalBody, ModalContent, ModalHeader } from "@nextui-org/modal";

import ModalFooterWithSupport from "@/components/generics/footer-modal-support";
import { FormModal } from "@/components/generics/form-modal";

interface PortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RevenueEvent {
  date: string;
  amount: number;
}

// Mock data for revenue events
const revenueEvents: RevenueEvent[] = [
  { date: "2023-01-01", amount: 5000 },
  { date: "2023-01-15", amount: 7000 },
  { date: "2023-02-01", amount: 8000 },
  { date: "2023-02-15", amount: 6000 },
  { date: "2023-03-01", amount: 9000 },
  { date: "2023-03-15", amount: 7500 },
  { date: "2023-04-01", amount: 10000 },
  { date: "2023-04-15", amount: 8000 },
  { date: "2023-05-01", amount: 11000 },
  { date: "2023-05-15", amount: 9000 },
  { date: "2023-06-01", amount: 12000 },
  { date: "2023-06-15", amount: 10000 },
  { date: "2023-07-01", amount: 13000 },
  { date: "2023-07-15", amount: 11000 },
  { date: "2023-08-01", amount: 14000 },
  { date: "2023-08-15", amount: 12000 },
  { date: "2023-09-01", amount: 15000 },
  { date: "2023-09-15", amount: 13000 },
  { date: "2023-10-01", amount: 16000 },
  { date: "2023-10-15", amount: 14000 },
  { date: "2023-11-01", amount: 17000 },
  { date: "2023-11-15", amount: 15000 },
  { date: "2023-12-01", amount: 18000 },
];

const expectedPeriodRevenue = 50000; // Expected revenue for the period

const PortfolioModal: React.FC<PortfolioModalProps> = ({ isOpen, onClose }) => {
  const { control, handleSubmit } = useForm();
  const [zipCode, setZipCode] = useState<string>("");
  const [estimatedCosts, setEstimatedCosts] = useState<number | null>(null);

  // New state variables for revenue metrics
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [revenueEventCount, setRevenueEventCount] = useState<number>(0);
  const [averageRevenueEventSize, setAverageRevenueEventSize] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      computeRevenueMetrics();
    }
  }, [isOpen]);

  const computeRevenueMetrics = () => {
    const total = revenueEvents.reduce((sum, event) => sum + event.amount, 0);

    setTotalRevenue(total);

    const count = revenueEvents.length;

    setRevenueEventCount(count);

    const average = count > 0 ? total / count : 0;

    setAverageRevenueEventSize(average);
  };

  return (
    <FormModal
      isOpen={isOpen}
      isValid={true}
      title="Portfolio Overview"
      onClose={onClose}
      onSubmit={handleSubmit(() => {})}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">Portfolio Overview</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {/* Revenue for Period */}
            <div className="p-4 rounded-md space-y-4 font-mono">
              <h4 className="font-semibold text-lg mb-2">Revenue for Period</h4>
              <div className="flex justify-between">
                <span>Total Revenue:</span>
                <span className="font-medium">${totalRevenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Revenue Events:</span>
                <span className="font-medium">{revenueEventCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Average Event Size:</span>
                <span className="font-medium">${averageRevenueEventSize.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Expected Revenue:</span>
                <span className="font-medium">${expectedPeriodRevenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Progress:</span>
                <span className="font-medium">{((totalRevenue / expectedPeriodRevenue) * 100).toFixed(2)}%</span>
              </div>
              <Progress color="primary" value={(totalRevenue / expectedPeriodRevenue) * 100} />
            </div>
          </div>
        </ModalBody>
        <ModalFooterWithSupport
          actions={[
            {
              label: "Close",
              onClick: onClose,
            },
          ]}
          onSupportClick={() => {}}
        />
      </ModalContent>
    </FormModal>
  );
};

export default PortfolioModal;
