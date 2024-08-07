import { Card, CardBody, CardHeader } from "@nextui-org/card";

export default function SpentCard() {
  return (
    <Card className="w-1/4 bg-charyo-500/60">
      <CardHeader className="flex-col items-start px-4 pt-2 pb-0">
        <p className="text-tiny uppercase font-bold">Spent</p>
        <small className="text-default-500">
          Amount spent from your locked balance
        </small>
      </CardHeader>
      <CardBody className="py-2">
        <h4 className="font-bold text-large">$5,000.00</h4>
      </CardBody>
    </Card>
  );
}
