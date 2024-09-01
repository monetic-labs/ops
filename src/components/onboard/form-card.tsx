import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { ReactNode } from "react";

interface FormCardProps {
  title: string;
  children: ReactNode;
}

export const FormCard: React.FC<FormCardProps> = ({ title, children }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <Card className="w-full max-w-3xl mx-auto bg-charyo-700/60 backdrop-blur-md text-notpurple-100 p-6 rounded-lg shadow-lg">
        <CardHeader>
          <h2 className="text-2xl font-bold text-notpurple-100 mb-4">
            {title}
          </h2>
        </CardHeader>
        <CardBody>{children}</CardBody>
      </Card>
    </div>
  );
};
