import { Card, CardBody, CardHeader } from "@nextui-org/card";

export default function PendingCard() {
  return (
    <Card className="flex-grow bg-charyo-500/60">
      <CardHeader className="flex-col items-start px-4 pt-2 pb-0">
        <p className="text-tiny uppercase font-bold">Pending</p>
        <small className="text-default-500">Transactions in the process of settling</small>
      </CardHeader>
      <CardBody className="py-2">
        <h4 className="font-bold text-large">$2,000.00</h4>
      </CardBody>
    </Card>
  );
}
