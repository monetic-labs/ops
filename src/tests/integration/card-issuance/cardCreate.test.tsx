import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CardStatus, CardType } from "@backpack-fux/pylon-sdk";

import pylon from "@/libs/pylon-sdk";
import CreateCardModal from "@/components/card-issuance/card-create";

vi.mock("@/libs/pylon-sdk", () => ({
  default: {
    createVirtualCard: vi.fn(),
    createPhysicalCard: vi.fn(),
  },
}));

describe("CreateCardModal", () => {
  const mockOnClose = vi.fn();
  let defaultProps: {
    isOpen: boolean;
    onClose: typeof mockOnClose;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    defaultProps = {
      isOpen: true,
      onClose: mockOnClose,
    };
  });

  describe("Virtual Card Creation", () => {
    const fillVirtualCardForm = async () => {
      fireEvent.change(screen.getByTestId("card-displayName"), { target: { value: "Test Card" } });
      fireEvent.change(screen.getByTestId("card-firstName"), { target: { value: "John" } });
      fireEvent.change(screen.getByTestId("card-lastName"), { target: { value: "Doe" } });
      fireEvent.change(screen.getByTestId("card-email"), { target: { value: "john@example.com" } });
      fireEvent.change(screen.getByTestId("card-limitAmount"), { target: { value: "1000" } });

      fireEvent.click(screen.getByTestId("card-limitCycle"));

      await waitFor(async () => {
        expect(screen.getByTestId("MONTH")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByTestId("MONTH"));
    };

    it("should render virtual card form by default", () => {
      render(<CreateCardModal {...defaultProps} />);

      expect(screen.getByTestId("card-selector")).toBeInTheDocument();
      expect(screen.getByTestId("card-displayName")).toBeInTheDocument();
      expect(screen.getByTestId("card-limitAmount")).toBeInTheDocument();
      expect(screen.getByTestId("card-selector")).toHaveValue(CardType.VIRTUAL);
    });

    it("should successfully create a virtual card", async () => {
      render(<CreateCardModal {...defaultProps} />);

      await fillVirtualCardForm();
      fireEvent.click(screen.getByTestId("card-createButton"));

      await waitFor(() => {
        expect(pylon.createVirtualCard).toHaveBeenCalledWith({
          displayName: "Test Card",
          limit: { amount: 1000, frequency: "MONTH" },
          owner: {
            firstName: "John",
            lastName: "Doe",
            email: "john@example.com",
          },
          status: CardStatus.ACTIVE,
        });
      });
    });

    it("should handle virtual card creation error", async () => {
      const error = new Error("API Error");

      vi.mocked(pylon.createVirtualCard).mockRejectedValueOnce(error);

      render(<CreateCardModal {...defaultProps} />);
      await fillVirtualCardForm();
      fireEvent.click(screen.getByTestId("card-createButton"));

      await waitFor(() => {
        expect(screen.getByText("API Error")).toBeInTheDocument();
      });
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe("Physical Card Creation", () => {
    const fillPhysicalCardForm = async () => {
      fireEvent.click(screen.getByTestId("card-selector"));
      await waitFor(() => {
        expect(screen.getByTestId("card-physical")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByTestId("card-physical"));

      // Fill basic card details
      fireEvent.change(screen.getByTestId("card-displayName"), { target: { value: "Test Card" } });
      fireEvent.change(screen.getByTestId("card-firstName"), { target: { value: "John" } });
      fireEvent.change(screen.getByTestId("card-lastName"), { target: { value: "Doe" } });
      fireEvent.change(screen.getByTestId("card-email"), { target: { value: "john@example.com" } });
      fireEvent.change(screen.getByTestId("card-limitAmount"), { target: { value: "1000" } });

      fireEvent.click(screen.getByTestId("card-limitCycle"));

      await waitFor(async () => {
        expect(screen.getByTestId("MONTH")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByTestId("MONTH"));

      // Fill shipping details
      fireEvent.change(screen.getByTestId("card-address"), { target: { value: "123 Main St" } });
      fireEvent.change(screen.getByTestId("card-city"), { target: { value: "New York" } });
      fireEvent.change(screen.getByTestId("card-postalCode"), { target: { value: "10001" } });
      fireEvent.click(screen.getByTestId("card-country"));
      await waitFor(async () => {
        expect(screen.getByTestId("US")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByTestId("US"));
      fireEvent.click(screen.getByTestId("card-region"));
      await waitFor(async () => {
        expect(screen.getByTestId("NY")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByTestId("NY"));
      fireEvent.change(screen.getByTestId("card-phoneNumber"), { target: { value: "1234567890" } });
      fireEvent.change(screen.getByTestId("card-phoneCountryCode"), { target: { value: "1" } });
      fireEvent.click(screen.getByTestId("card-shippingMethod"));
      await waitFor(async () => {
        expect(screen.getByTestId("STANDARD")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByTestId("STANDARD"));
    };

    it("should successfully create a physical card", async () => {
      render(<CreateCardModal {...defaultProps} />);

      await fillPhysicalCardForm();
      fireEvent.click(screen.getByTestId("card-createButton"));

      await waitFor(() => {
        expect(pylon.createPhysicalCard).toHaveBeenCalledWith({
          displayName: "Test Card",
          limit: {
            amount: "1000",
            frequency: "MONTH",
          },
          owner: {
            email: "john@example.com",
            firstName: "John",
            lastName: "Doe",
          },
          shipping: {
            city: "New York",
            country: "US",
            countryCode: "US",
            line1: "123 Main St",
            line2: "",
            phoneCountryCode: "1",
            phoneNumber: "1234567890",
            postalCode: "10001",
            region: "NY",
            shippingMethod: "STANDARD",
            street1: "123 Main St",
            street2: "",
          },
          status: "ACTIVE",
        });
      });
    });

    it("should handle physical card creation error", async () => {
      const error = new Error("Physical Card API Error");

      vi.mocked(pylon.createPhysicalCard).mockRejectedValueOnce(error);

      render(<CreateCardModal {...defaultProps} />);
      await fillPhysicalCardForm();
      fireEvent.click(screen.getByText("Create Card"));

      await waitFor(() => {
        expect(screen.getByText("Physical Card API Error")).toBeInTheDocument();
      });
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe("Form Validation", () => {
    const fillVirtualCardForm = async () => {
      fireEvent.change(screen.getByTestId("card-displayName"), { target: { value: "Test Card" } });
      fireEvent.change(screen.getByTestId("card-firstName"), { target: { value: "John" } });
      fireEvent.change(screen.getByTestId("card-lastName"), { target: { value: "Doe" } });
      fireEvent.change(screen.getByTestId("card-email"), { target: { value: "john@example.com" } });
      fireEvent.change(screen.getByTestId("card-limitAmount"), { target: { value: "1000" } });

      fireEvent.click(screen.getByTestId("card-limitCycle"));

      await waitFor(async () => {
        expect(screen.getByTestId("MONTH")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByTestId("MONTH"));
    };

    it("should validate required fields for virtual card", async () => {
      render(<CreateCardModal {...defaultProps} />);

      fireEvent.click(screen.getByTestId("card-createButton"));

      await waitFor(() => {
        expect(screen.getByText(/Enter valid card name/i)).toBeInTheDocument();
        expect(screen.getByText(/Please enter valid first name/i)).toBeInTheDocument();
        expect(screen.getByText(/Please enter valid last name/i)).toBeInTheDocument();
        expect(screen.getByText(/Invalid email/i)).toBeInTheDocument();
      });
    });

    it("should validate required fields for physical card", async () => {
      render(<CreateCardModal {...defaultProps} />);

      fireEvent.click(screen.getByTestId("card-selector"));
      await waitFor(() => {
        expect(screen.getByTestId("card-physical")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByTestId("card-physical"));

      await fillVirtualCardForm();

      fireEvent.click(screen.getByTestId("card-createButton"));

      await waitFor(() => {
        expect(screen.getAllByText(/Please select a country/i).length).toBeGreaterThan(0);
      });
    });

    it("should validate email format", async () => {
      render(<CreateCardModal {...defaultProps} />);

      fireEvent.change(screen.getByTestId("card-email"), { target: { value: "invalid-email" } });
      fireEvent.click(screen.getByTestId("card-createButton"));

      await waitFor(() => {
        expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
      });
    });
  });
});
