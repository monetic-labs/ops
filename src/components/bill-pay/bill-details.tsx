import { Button } from "@nextui-org/button";
import { Divider } from "@nextui-org/divider";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@nextui-org/modal";
import { TransactionListItem } from "@backpack-fux/pylon-sdk";

interface BillPayDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  billPay: TransactionListItem;
}

export default function BillPayDetailsModal({ isOpen, onClose, billPay }: BillPayDetailsModalProps) {
  return (
    <Modal isOpen={isOpen} size="lg" onClose={onClose}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col items-center">
              <h2 className="text-2xl font-bold">Transaction Details</h2>
              <p className="text-sm text-gray-500">ID: {billPay.id}</p>
            </ModalHeader>
            <Divider />
            <ModalBody>
              <div className="space-y-4 font-mono">
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="font-bold">{billPay.status}</span>
                </div>
                <div className="flex justify-between">
                  <span>Processor:</span>
                  <span>{billPay.processor}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span>{billPay.paymentMethod}</span>
                </div>
                <Divider />
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>
                    {billPay.subtotal / 100} {billPay.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tip Amount:</span>
                  <span>
                    {billPay.tipAmount / 100} {billPay.currency}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>
                    {billPay.total / 100} {billPay.currency}
                  </span>
                </div>
                <Divider />
                <div className="flex justify-between">
                  <span>Created At:</span>
                  <span>{new Date(billPay.createdAt).toLocaleString()}</span>
                </div>
                <Divider />
                <div>
                  <h3 className="font-bold mb-2">Billing Address:</h3>
                  <p>
                    {billPay.billingAddress.firstName} {billPay.billingAddress.lastName}
                  </p>
                  <p>{billPay.billingAddress.address1}</p>
                  {billPay.billingAddress.address2 && <p>{billPay.billingAddress.address2}</p>}
                  {billPay.billingAddress.address3 && <p>{billPay.billingAddress.address3}</p>}
                  <p>
                    {billPay.billingAddress.city}, {billPay.billingAddress.state} {billPay.billingAddress.postalCode}
                  </p>
                  <p>{billPay.billingAddress.countryCode}</p>
                </div>
                <Divider />
                <div>
                  <h3 className="font-bold mb-2">Shipping Address:</h3>
                  <p>
                    {billPay.shippingAddress.firstName} {billPay.shippingAddress.lastName}
                  </p>
                  <p>{billPay.shippingAddress.address1}</p>
                  {billPay.shippingAddress.address2 && <p>{billPay.shippingAddress.address2}</p>}
                  {billPay.shippingAddress.address3 && <p>{billPay.shippingAddress.address3}</p>}
                  <p>
                    {billPay.shippingAddress.city}, {billPay.shippingAddress.state} {billPay.shippingAddress.postalCode}
                  </p>
                  <p>{billPay.shippingAddress.countryCode}</p>
                </div>
              </div>
            </ModalBody>
            <Divider />
            <ModalFooter className="flex justify-center">
              <Button className="bg-ualert-500 text-notpurple-500" onPress={onClose}>
                Close
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
