import { Circle, CheckCircle } from "lucide-react";

export const CircleWithNumber = ({ number }: { number: string | number }) => (
  <div className="relative flex items-center justify-center w-10 h-10 group">
    <div className="absolute inset-0 rounded-full bg-primary/5 transform transition-all duration-200 group-hover:scale-110" />
    <Circle className="w-10 h-10 text-primary/80 stroke-[1.5]" />
    <span className="absolute text-primary font-semibold">{number}</span>
  </div>
);

export const CheckCircleIcon = () => (
  <div className="relative flex items-center justify-center w-10 h-10 group">
    <div className="absolute inset-0 rounded-full bg-primary/5 transform transition-all duration-200 group-hover:scale-110" />
    <CheckCircle className="w-10 h-10 text-primary stroke-[1.5] transform transition-all duration-200 group-hover:scale-105" />
  </div>
);
