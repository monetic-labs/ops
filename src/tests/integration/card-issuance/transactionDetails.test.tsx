import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TransactionDetailsModal from "@/components/card-issuance/card-txns";

describe("TransactionDetailsModal", () => {
  const mockOnClose = vi.fn();
  const mockTransaction: any = {
    id: "txn-123",
    createdAt: new Date("2024-01-01T12:00:00Z").toISOString(),
    amount: 12345,
    currency: "USD",
    status: "COMPLETED",
    merchantCategory: "GROCERIES",
    merchantCard: {
      id: "card-456",
      displayName: "My Debit Card",
      lastFour: "6789",
      cardOwner: {
        firstName: "Alice",
        lastName: "Johnson",
        email: "alice@example.com",
      },
    },
  };

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    transaction: mockTransaction,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders transaction details correctly", () => {
    render(<TransactionDetailsModal {...defaultProps} />);

    expect(screen.getByText("Transaction Receipt")).toBeInTheDocument();
    expect(screen.getByText("Transaction ID: txn-123")).toBeInTheDocument();

    expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
    expect(screen.getByText("My Debit Card (**** 6789)")).toBeInTheDocument();
    expect(screen.getByText("GROCERIES")).toBeInTheDocument();
    expect(screen.getByText("123.5 USD")).toBeInTheDocument();
  });

  it("displays the correct amount with currency", () => {
    render(<TransactionDetailsModal {...defaultProps} />);

    expect(screen.getByText("123.5 USD")).toBeInTheDocument();
  });

  it("applies dynamic status styling", () => {
    render(<TransactionDetailsModal {...defaultProps} />);

    const status = screen.getByText("COMPLETED");
    expect(status).toBeInTheDocument();
    expect(status).toHaveClass("text-ugh-400");
  });

  it("closes the modal when Close button is clicked", async () => {
    render(<TransactionDetailsModal {...defaultProps} />);

    fireEvent.click(screen.getByText("Close"));

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("displays a pending status with appropriate styling", () => {
    const pendingTransaction = { ...mockTransaction, status: "PENDING" };
    render(<TransactionDetailsModal {...defaultProps} transaction={pendingTransaction} />);

    const status = screen.getByText("PENDING");
    expect(status).toBeInTheDocument();
    expect(status).toHaveClass("text-yellow-500");
  });

  it("displays a failed status with appropriate styling", () => {
    const failedTransaction = { ...mockTransaction, status: "FAILED" };
    render(<TransactionDetailsModal {...defaultProps} transaction={failedTransaction} />);

    const status = screen.getByText("FAILED");
    expect(status).toBeInTheDocument();
    expect(status).toHaveClass("text-red-500");
  });
});
