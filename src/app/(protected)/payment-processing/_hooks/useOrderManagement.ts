import { useState, useEffect, useCallback, useRef } from "react";
import { PaymentListOutput, PaymentListItem, PaymentSSEEventType } from "@monetic-labs/sdk";
import { useRouter } from "next/navigation";

import pylon from "@/libs/monetic-sdk";

export const useOrderManagement = () => {
  const [state, setState] = useState<{
    isLoading: boolean;
    error: string | null;
    payments: PaymentListItem[];
  }>({
    isLoading: true,
    error: null,
    payments: [],
  });
  const effectRan = useRef(false);

  const router = useRouter();

  const sortPaymentsByDate = useCallback((payments: PaymentListItem[]) => {
    return [...payments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, []);

  const updatePayments = useCallback(
    (updater: (prev: PaymentListItem[]) => PaymentListItem[]) => {
      setState((prevState) => ({
        ...prevState,
        payments: sortPaymentsByDate(updater(prevState.payments)),
      }));
    },
    [sortPaymentsByDate]
  );

  const handleInitialList = useCallback(
    (data: PaymentListItem[]) => {
      setState((prevState) => ({
        ...prevState,
        isLoading: false,
        payments: sortPaymentsByDate(data),
      }));
    },
    [sortPaymentsByDate]
  );

  const handlePaymentUpdated = useCallback(
    (updatedPayment: PaymentListItem) => {
      console.log("Updated payment:", updatedPayment);
      updatePayments((prevPayments) => {
        const existingIndex = prevPayments.findIndex((p) => p.id === updatedPayment.id);

        if (existingIndex !== -1) {
          const newPayments = [...prevPayments];

          newPayments[existingIndex] = updatedPayment;

          return newPayments;
        }

        return [updatedPayment, ...prevPayments];
      });
    },
    [updatePayments]
  );

  const handlePaymentUpdate = useCallback(
    (data: PaymentListOutput) => {
      switch (data.type) {
        case PaymentSSEEventType.KEEP_ALIVE:
          // These are just to keep the connection alive, no need to update state
          break;
        case PaymentSSEEventType.INITIAL_LIST:
          handleInitialList(data.data.payments);
          break;
        case PaymentSSEEventType.PAYMENT_UPDATED:
          handlePaymentUpdated(data.data);
          break;
        default:
          setState((prevState) => ({
            ...prevState,
            error: "Unknown payment update type",
          }));
          console.warn("Unknown payment update type:", data);
      }
    },
    [handleInitialList, handlePaymentUpdated]
  );

  useEffect(() => {
    if (effectRan.current === true) {
      return;
    }
    effectRan.current = true;

    let closeConnection: (() => void) | undefined;

    const setupConnection = async () => {
      setState((prevState) => ({ ...prevState, isLoading: true, error: null }));
      try {
        closeConnection = await pylon.getPaymentList(handlePaymentUpdate);
      } catch (error) {
        console.error("Failed to set up payment list:", error);
        setState((prevState) => ({
          ...prevState,
          error: "Failed to connect to payment list",
        }));
      } finally {
        setState((prevState) => ({ ...prevState, isLoading: false }));
      }
    };

    setupConnection();

    return () => {
      if (closeConnection) {
        closeConnection();
      }
    };
  }, [handlePaymentUpdate, router]);

  return state;
};
