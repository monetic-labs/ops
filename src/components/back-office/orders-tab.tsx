import React, { useEffect, useState } from "react";
import { Input } from "@nextui-org/input";
import { Button } from "@nextui-org/button";
import { usePylon } from "@backpack-fux/pylon-sdk";
import { Card, CardHeader, CardBody } from "@nextui-org/card";
interface Order {
  orderLink: string;
  expiresAt: string;
}

export default function CreateOrders() {
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);

  const pylon = usePylon();

  useEffect(() => {
    // Load order history from local storage on component mount
    const savedHistory = localStorage.getItem("orderHistory");
    if (savedHistory) {
      setOrderHistory(JSON.parse(savedHistory));
    }
  }, []);

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
          subtotal: parseFloat(amount),
          currency: "USD",
        },
      });

      const newOrder: Order = {
        orderLink: response.orderLink,
        expiresAt: response.expiresAt,
      };

      setCurrentOrder(newOrder);
      setOrderId(response.orderLink);

      // Add new order to history and save to local storage
      const updatedHistory = [newOrder, ...orderHistory].slice(0, 10); // Keep last 10 orders
      setOrderHistory(updatedHistory);
      localStorage.setItem("orderHistory", JSON.stringify(updatedHistory));
    } catch (err) {
      setError("Failed to create order. Please try again.");
      console.error("Order creation error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 mx-auto">
      <Card>
        <CardHeader>Create New Order</CardHeader>
        <CardBody className="space-y-4">
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
          <Button onClick={handleCreateOrder} disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Order"}
          </Button>
          {error && <p className="text-red-500">{error}</p>}
        </CardBody>
      </Card>

      {currentOrder && (
        <Card>
          <CardHeader>Current Orders</CardHeader>
          <CardBody>
            <p>
              Order Link:{" "}
              <a href={currentOrder.orderLink} target="_blank" rel="noopener noreferrer">
                {currentOrder.orderLink}
              </a>
            </p>
            <p>Expires At: {new Date(currentOrder.expiresAt).toLocaleString()}</p>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>Order History</CardHeader>
        <CardBody>
          {orderHistory.length > 0 ? (
            <ul className="space-y-2">
              {orderHistory.map((order, index) => (
                <li key={index}>
                  <a href={order.orderLink} target="_blank" rel="noopener noreferrer">
                    {order.orderLink}
                  </a>
                  <p className="text-sm text-gray-500">Expires: {new Date(order.expiresAt).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p>No order history available.</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
