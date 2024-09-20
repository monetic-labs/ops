import React, { useState } from "react";
import { Input } from "@nextui-org/input";
import { Button } from "@nextui-org/button";
import { Snippet } from "@nextui-org/snippet";
import { usePylon } from "@backpack-fux/pylon-sdk";

export default function CreateOrders() {
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pylon = usePylon();

  const handleCreateOrder = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await pylon.createOrderLink({
        customer: {
          email: email,
          phone: phone,
        },
        order: {
          subtotal: parseFloat(amount), // Assuming amount should be a number
          currency: "USD",
        },
      });

      setOrderId(response.orderLink); // Assuming the response includes an id field
      // Handle successful order creation (e.g., show a success message)
    } catch (err) {
      setError("Failed to create order. Please try again.");
      console.error("Order creation error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Snippet symbol="#" variant="flat">
          {orderId || "Generated Order ID"}
        </Snippet>
      </div>
      <Input
        label="Customer Email"
        placeholder="Enter customer email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input
        label="Customer Phone"
        placeholder="Enter customer phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <Input
        label="Amount"
        placeholder="Enter amount"
        startContent={
          <div className="pointer-events-none flex items-center">
            <span className="text-default-400 text-small">$</span>
          </div>
        }
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <Button color="primary" onPress={handleCreateOrder}>
        Create Order
      </Button>
    </div>
  );
}
