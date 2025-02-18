import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@nextui-org/modal";
import { Button } from "@nextui-org/button";
import { Select, SelectItem } from "@nextui-org/select";
import { Chip } from "@nextui-org/chip";
import { ScrollShadow } from "@nextui-org/scroll-shadow";
import { Avatar } from "@nextui-org/avatar";
import { SharedSelection } from "@nextui-org/system";

import { formatStringToTitleCase } from "@/utils/helpers";
import { useAccounts } from "@/hooks/useAccounts";
import { Account, Operator } from "@/types/account";

export function DeployAccountModal({
  isOpen,
  onClose,
  onDeploy,
  accounts,
  selectedAccount,
  selectedOperators,
  setSelectedOperators,
  threshold,
  setThreshold,
}: {
  isOpen: boolean;
  onClose: () => void;
  onDeploy: () => void;
  accounts: Account[];
  selectedAccount: Account;
  selectedOperators: Operator[];
  setSelectedOperators: (operators: Operator[]) => void;
  threshold: number;
  setThreshold: (threshold: number) => void;
}) {
  const { getAvailableOperators } = useAccounts();
  const availableOperators = getAvailableOperators();

  const handleOperatorChange = (keys: SharedSelection) => {
    if (keys === "all") {
      setSelectedOperators(availableOperators.map((op) => ({ ...op, hasSigned: false })));
      return;
    }

    const selected = Array.from(keys)
      .map((key) => availableOperators.find((op) => op.address === key))
      .filter((op): op is Operator => !!op)
      .map((op) => ({ ...op, hasSigned: false }));

    setSelectedOperators(selected);
    setThreshold(1);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      classNames={{
        backdrop: "bg-[#000000]/50 backdrop-opacity-40",
        base: "border-content3",
        body: "py-6",
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <h2 className="text-xl font-bold">Deploy {selectedAccount.name} Account</h2>
            </ModalHeader>
            <ModalBody>
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-foreground/90">About Operators</h3>
                  <p className="text-sm text-foreground/60">
                    Operators are users with access to initiate transactions. The threshold is the required number of
                    operators to approve a transaction.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="operator-select" className="text-sm font-medium text-foreground/90">
                      Select Operators
                    </label>
                    <Select
                      id="operator-select"
                      items={availableOperators}
                      selectionMode="multiple"
                      placeholder="Select account operators"
                      selectedKeys={new Set(selectedOperators.map((op) => op.address))}
                      onSelectionChange={(keys) => handleOperatorChange(keys)}
                      classNames={{
                        trigger: "bg-content2 data-[hover=true]:bg-content3",
                        value: "text-foreground/90",
                      }}
                      renderValue={(items) => (
                        <ScrollShadow className="w-full flex gap-2 flex-wrap py-2" hideScrollBar>
                          {items.map((item) => (
                            <Chip
                              key={item.key}
                              variant="flat"
                              color="primary"
                              classNames={{
                                base: "bg-content3",
                                content: "text-foreground/90",
                              }}
                            >
                              {item.data?.name}
                            </Chip>
                          ))}
                        </ScrollShadow>
                      )}
                    >
                      {(operator) => (
                        <SelectItem key={operator.address} textValue={operator.name}>
                          <div className="flex gap-2 items-center">
                            <Avatar
                              name={operator.name}
                              size="sm"
                              classNames={{
                                base: "bg-content3",
                                name: "text-foreground/90",
                              }}
                            />
                            <div className="flex flex-col">
                              <span className="text-small">{operator.name}</span>
                              {operator.role && (
                                <span className="text-xs text-foreground/60">
                                  {formatStringToTitleCase(operator.role)}
                                </span>
                              )}
                            </div>
                          </div>
                        </SelectItem>
                      )}
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="threshold-select" className="text-sm font-medium text-foreground/90">
                      Approval Threshold
                    </label>
                    <Select
                      id="threshold-select"
                      placeholder={selectedOperators.length === 0 ? "Select a threshold" : "Select required approvals"}
                      selectedKeys={selectedOperators.length > 0 ? new Set([threshold.toString()]) : new Set()}
                      selectionMode="single"
                      onSelectionChange={(keys) => {
                        const value = Array.from(keys)[0];
                        if (value) {
                          setThreshold(parseInt(value.toString()));
                        }
                      }}
                      isDisabled={selectedOperators.length === 0}
                      classNames={{
                        trigger: "bg-content2 data-[hover=true]:bg-content3",
                        value: "text-foreground/90",
                        description: `${selectedOperators.length === 1 ? "text-yellow-500" : "text-foreground/60"}`,
                      }}
                      renderValue={(item) => {
                        if (selectedOperators.length === 0) {
                          return "Select a threshold";
                        }
                        const num = item[0]?.key;
                        return num
                          ? `${num} of ${selectedOperators.length} ${selectedOperators.length === 1 ? "operator" : "operators"} required`
                          : "Select a threshold";
                      }}
                      description={
                        selectedOperators.length === 1
                          ? "Warning: Relying on one operator risks losing access if their account is compromised."
                          : "A higher threshold means more security but requires more operators to approve transactions."
                      }
                    >
                      {selectedOperators.length > 0 ? (
                        Array.from({ length: selectedOperators.length }, (_, i) => i + 1).map((num) => (
                          <SelectItem key={num.toString()}>
                            {num} of {selectedOperators.length}{" "}
                            {selectedOperators.length === 1 ? "operator" : "operators"} required
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem key="1">1 operator required</SelectItem>
                      )}
                    </Select>
                  </div>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose} className="font-medium">
                Cancel
              </Button>
              <Button
                color="primary"
                onPress={onDeploy}
                className="font-medium"
                isDisabled={selectedOperators.length === 0}
              >
                Deploy Account
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
