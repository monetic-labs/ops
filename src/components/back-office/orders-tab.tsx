import React, { useState } from "react";
import { Input } from "@nextui-org/input";
import { Button } from "@nextui-org/button";
import { Snippet } from "@nextui-org/snippet";

export default function CreateOrders() {
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");

  const handleCreateOrder = () => {
    // Implement order creation logic here
    console.log("Creating order:", { orderId, email, phone, amount });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Order ID</label>
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