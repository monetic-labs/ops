import { Circle, CheckCircle } from "lucide-react";

export const CircleWithNumber = ({ number }: { number: string }) => (
  <div className="relative flex items-center justify-center w-10 h-10">
    <Circle className="w-10 h-10 text-ualert-500" />
    <span className="absolute text-notpurple-500 font-bold">{number}</span>
  </div>
);

export const CheckCircleIcon = () => (
  <div className="flex items-center justify-center w-10 h-10">
    <CheckCircle className="w-10 h-10 text-ualert-500" />
  </div>
);
