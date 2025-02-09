import { Button } from "@nextui-org/button";

export function OperatorsView() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Active Operators</h3>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90" size="sm">
          Add Operator
        </Button>
      </div>
      <div className="space-y-2">
        {/* Example Operator */}
        <div className="flex items-center justify-between p-4 bg-content2/50 hover:bg-content2/70 transition-colors rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-content3" />
            <div>
              <p className="font-medium">John Doe</p>
              <p className="text-sm text-foreground/60">Added 2 months ago</p>
            </div>
          </div>
          <Button size="sm" variant="flat" className="bg-content3/50 hover:bg-content3">
            Manage
          </Button>
        </div>
      </div>
    </div>
  );
}
