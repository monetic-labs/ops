import { Signer } from "@/types/account";
import { formatStringToTitleCase } from "@/utils/helpers";

import { Button } from "@nextui-org/button";
import { Avatar } from "@nextui-org/avatar";

export function SignersView({ signers }: { signers: Signer[] }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Active Signers</h3>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90" size="sm">
          Add Signer
        </Button>
      </div>
      <div className="space-y-2">
        {signers.map((signer) => (
          <div
            key={signer.address}
            className="flex items-center justify-between p-4 bg-content2/50 hover:bg-content2/70 transition-colors rounded-lg"
          >
            <div className="flex items-center gap-3">
              <Avatar
                name={signer.name}
                size="sm"
                src={signer.image}
                classNames={{
                  base: "bg-content3",
                  name: "text-foreground/90",
                }}
              />
              <div>
                <p className="font-medium">{signer.name}</p>
                {signer.role && <p className="text-sm text-foreground/60">{formatStringToTitleCase(signer.role)}</p>}
              </div>
            </div>
            <Button className="bg-content3/50 hover:bg-content3" size="sm" variant="flat">
              Manage
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
