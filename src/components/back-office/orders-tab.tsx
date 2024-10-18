import React, { useEffect, useState } from "react";
import { Input } from "@nextui-org/input";
import { Button } from "@nextui-org/button";
import { Snippet } from "@nextui-org/snippet";

import { GetOrderLinksOutput } from "@backpack-fux/pylon-sdk";
import { Card, CardHeader, CardBody } from "@nextui-org/card";
import Countdown from "@/components/generics/countdown";
import pylon from "@/libs/pylon-sdk";
import { Accordion, AccordionItem } from "@nextui-org/accordion";
import { z } from "zod";

const orderSchema = z.object({
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid amount"),
});

export default function CreateOrders() {
  const [order, setOrder] = useState<{
    email: string;
    phone: string;
    amount: string;
  }>({
    email: "",
    phone: "",
    amount: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentOrders, setCurrentOrders] = useState<GetOrderLinksOutput[]>([]);
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    phone?: string;
    amount?: string;
  }>({});
  const [touched, setTouched] = useState<{
    email?: boolean;
    phone?: boolean;
    amount?: boolean;
  }>({});

  useEffect(() => {
    // Fetch active orders from Pylon
    fetchCurrentOrders();
  }, []);

  useEffect(() => {
    // Validate form data whenever it changes
    const result = orderSchema.safeParse(order);
    if (!result.success) {
      const errors: { [key: string]: string } = {};
      result.error.issues.forEach((issue) => {
        errors[issue.path[0]] = issue.message;
      });
      setValidationErrors(errors);
    } else {
      setValidationErrors({});
    }
  }, [order]);

  useEffect(() => {
    // Trigger hook when currentOrders changes
    console.log("Current orders updated:", currentOrders);
  }, [currentOrders]);

  const fetchCurrentOrders = async () => {
    try {
      const orders = await pylon.getOrderLinks();
      setCurrentOrders(orders);
    } catch (err) {
      console.error("Failed to fetch current orders:", err);
    }
  };

  const handleCreateOrder = async () => {
    setIsLoading(true);
    setError(null);

    // Validate form data
    const result = orderSchema.safeParse(order);
    if (!result.success) {
      const errors: { [key: string]: string } = {};
      result.error.issues.forEach((issue) => {
        errors[issue.path[0]] = issue.message;
      });
      setValidationErrors(errors);
      setIsLoading(false);
      return;
    }

    try {
      const response = await pylon.createOrderLink({
        customer: {
          email: order.email,
          phone: order.phone,
        },
        order: {
          subtotal: parseFloat(order.amount),
          currency: "USD",
        },
      });

      // Extract order ID from the order link
      const orderId = response.orderLink.substring(response.orderLink.lastIndexOf("/") + 1);

      // TODO: append newOrder to currentOrders
      const newOrder: GetOrderLinksOutput = {
        id: orderId,
        customer: {
          email: order.email,
          phone: order.phone,
        },
        order: {
          subtotal: parseFloat(order.amount),
          currency: "USD",
        },
        expiresAt: response.expiresAt,
      };
      setCurrentOrders([...currentOrders, newOrder]);

      // Clear input fields
      setOrder({
        email: "",
        phone: "",
        amount: "",
      });
      setValidationErrors({});
      setTouched({});
    } catch (err) {
      setError("Failed to create order. Please try again.");
      console.error("Order creation error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteOrder = async (orderLink: string) => {
    const orderId = orderLink.substring(orderLink.lastIndexOf("/") + 1);
    try {
      await pylon.deleteOrderLink(orderId);
      setCurrentOrders(currentOrders.filter((order) => order.id !== orderId));
    } catch (err) {
      console.error("Failed to delete order:", err);
    }
  };

  const handleBlur = (field: keyof typeof order) => {
    setTouched({ ...touched, [field]: true });
  };

  return (
    <div className="space-y-6 mx-auto">
      <Card>
        <CardHeader>Create New Order</CardHeader>
        <CardBody className="space-y-4">
          <div>
            <Input
              label="Customer Email"
              placeholder="Enter customer email"
              value={order.email}
              onChange={(e) => setOrder({ ...order, email: e.target.value })}
              onBlur={() => handleBlur("email")}
            />
            {touched.email && validationErrors.email && <p className="text-red-500">{validationErrors.email}</p>}
          </div>
          <div>
            <Input
              label="Customer Phone"
              placeholder="Enter customer phone"
              value={order.phone}
              onChange={(e) => setOrder({ ...order, phone: e.target.value })}
              onBlur={() => handleBlur("phone")}
            />
            {touched.phone && validationErrors.phone && <p className="text-red-500">{validationErrors.phone}</p>}
          </div>
          <div>
            <Input
              label="Amount"
              placeholder="Enter amount"
              startContent={
                <div className="pointer-events-none flex items-center">
                  <span className="text-default-400 text-small">$</span>
                </div>
              }
              value={order.amount}
              onChange={(e) => setOrder({ ...order, amount: e.target.value })}
              onBlur={() => handleBlur("amount")}
            />
            {touched.amount && validationErrors.amount && <p className="text-ualert-500">{validationErrors.amount}</p>}
          </div>
          <Button isDisabled={Object.keys(validationErrors).length > 0} onClick={handleCreateOrder}>
            {isLoading ? "Creating..." : "Create Order"}
          </Button>
          {error && <p className="text-ualert-500">{error}</p>}
        </CardBody>
      </Card>

      {currentOrders.length > 0 && (
        <Card>
          <CardHeader>Current Orders</CardHeader>
          <Accordion variant="splitted">
            {currentOrders.map((order, index) => (
              <AccordionItem
                key={index}
                aria-label={`Order ${index + 1}`}
                title={`${order.customer.email} (${order.customer.phone}) - $${order.order.subtotal} ${order.order.currency}`}
              >
                <div className="relative">
                  <Snippet hideSymbol variant="bordered" size="md">
                    {order.id}
                  </Snippet>
                  <p className="mt-2">Expires in {<Countdown expiresAt={order.expiresAt} />}</p>
                  <Button onClick={() => handleDeleteOrder(order.id)} className="absolute top-0 right-0 bg-ualert-500">
                    Delete
                  </Button>
                </div>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>
      )}
    </div>
  );
}
