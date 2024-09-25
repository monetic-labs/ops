import { Card, CardBody, CardHeader } from "@nextui-org/card";
import useAccountContracts from "@/hooks/account-contracts/useAccountContracts";

export default function SpentCard() {
  const { spent, isLoading } = useAccountContracts();

  return (
    <Card className="flex-grow bg-charyo-500/60">
      <CardHeader className="flex-col items-start px-4 pt-2 pb-0">
        <p className="text-tiny uppercase font-bold">Spent</p>
        <small className="text-default-500">Amount spent from your locked balance</small>
      </CardHeader>
      <CardBody className="py-2">
        <h4 className="font-bold text-large">
          {isLoading ? "Loading..." : `$${spent.toFixed(2)}`}
        </h4>
      </CardBody>
    </Card>
  );
}