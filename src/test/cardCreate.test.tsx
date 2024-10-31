import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import pylon from "@/libs/pylon-sdk";
import CreateCardModal from "@/components/card-issuance/card-create";
import { CardStatus, CardType } from "@backpack-fux/pylon-sdk";

vi.mock("@/libs/pylon-sdk", () => ({
  default: {
    createVirtualCard: vi.fn(),
    createPhysicalCard: vi.fn(),
  },
}));

describe("CreateCardModal", () => {
  const mockOnClose = vi.fn();
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Virtual Card Creation", () => {
    const fillVirtualCardForm = async (user: ReturnType<typeof userEvent.setup>) => {
      await user.type(screen.getByTestId("card-displayName"), "Test Card");
      await user.type(screen.getByTestId("card-firstName"), "John");
      await user.type(screen.getByTestId("card-lastName"), "Doe");
      await user.type(screen.getByTestId("card-email"), "john@example.com");
      await user.type(screen.getByTestId("card-limitAmount"), "1000");
      await user.click(screen.getByTestId("card-limitCycle"));

      await waitFor(async () => {
        expect(screen.getByText("Month")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Month"));
    };

    it("should render virtual card form by default", () => {
      render(<CreateCardModal {...defaultProps} />);

      expect(screen.getByTestId("card-selector")).toBeInTheDocument();
      expect(screen.getByTestId("card-displayName")).toBeInTheDocument();
      expect(screen.getByTestId("card-limitAmount")).toBeInTheDocument();
      expect(screen.getByTestId("card-selector")).toHaveValue(CardType.VIRTUAL);
    });

    it("should successfully create a virtual card", async () => {
      const user = userEvent.setup();
      render(<CreateCardModal {...defaultProps} />);

      await fillVirtualCardForm(user);

      await user.click(screen.getByTestId("card-createButton"));

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

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should handle virtual card creation error", async () => {
      const user = userEvent.setup();
      const error = new Error("API Error");
      vi.mocked(pylon.createVirtualCard).mockRejectedValueOnce(error);

      render(<CreateCardModal {...defaultProps} />);
      await fillVirtualCardForm(user);
      await user.click(screen.getByTestId("card-createButton"));

      await waitFor(() => {
        expect(screen.getByText("API Error")).toBeInTheDocument();
      });
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe("Physical Card Creation", () => {
    const fillPhysicalCardForm = async (user: ReturnType<typeof userEvent.setup>) => {
      await user.click(screen.getByTestId("card-selector"));
      await waitFor(() => {
        expect(screen.getByTestId("card-physical")).toBeInTheDocument();
      });
      await user.click(screen.getByTestId("card-physical"));

      // Fill shipping details
      await user.type(screen.getByTestId("card-address"), "123 Main St");
      await user.type(screen.getByTestId("card-city"), "New York");
      await user.type(screen.getByTestId("card-postalCode"), "10001");
      await user.click(screen.getByTestId("card-country"));
      await waitFor(async () => {
        expect(screen.getByText("United States")).toBeInTheDocument();
      });
      await user.click(screen.getByText("United States"));
      await user.click(screen.getByTestId("card-region"));
      await waitFor(async () => {
        expect(screen.getByText("New York")).toBeInTheDocument();
      });
      await user.click(screen.getByText("New York"));
      await user.type(screen.getByTestId("card-phoneNumber"), "1234567890");
      await user.type(screen.getByTestId("card-phoneCountryCode"), "1");
      await user.click(screen.getByTestId("card-shippingMethod"));
      await waitFor(async () => {
        expect(screen.getByText("Standard")).toBeInTheDocument();
      });
      await user.click(screen.getByText("Standard"));

      // Fill basic card details
      await user.type(screen.getByTestId("card-address"), "123 Main St");
      await user.type(screen.getByTestId("card-city"), "New York");
      await user.type(screen.getByTestId("card-displayName"), "Test Card");
      await user.type(screen.getByTestId("card-firstName"), "John");
      await user.type(screen.getByTestId("card-lastName"), "Doe");
      await user.type(screen.getByTestId("card-email"), "john@example.com");
      await user.type(screen.getByTestId("card-limitAmount"), "1000");
      await user.click(screen.getByTestId("card-limitCycle"));

      await waitFor(async () => {
        expect(screen.getByText("Month")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Month"));
    };

    it("should show shipping details when physical card is selected", async () => {
      const user = userEvent.setup();
      render(<CreateCardModal {...defaultProps} />);

      await user.click(screen.getByTestId("card-selector"));
      await waitFor(() => {
        expect(screen.getByTestId("card-physical")).toBeInTheDocument();
      });
      await user.click(screen.getByTestId("card-physical"));

      await waitFor(() => {
        expect(screen.getByTestId("card-address2")).toBeInTheDocument();
      });
    });

    it("should successfully create a physical card", async () => {
      const user = userEvent.setup();
      render(<CreateCardModal {...defaultProps} />);

      await fillPhysicalCardForm(user);
      await user.click(screen.getByText("Create Card"));

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

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should handle physical card creation error", async () => {
      const user = userEvent.setup();
      const error = new Error("Physical Card API Error");
      vi.mocked(pylon.createPhysicalCard).mockRejectedValueOnce(error);

      render(<CreateCardModal {...defaultProps} />);
      await fillPhysicalCardForm(user);
      await user.click(screen.getByText("Create Card"));

      await waitFor(() => {
        expect(screen.getByText("Physical Card API Error")).toBeInTheDocument();
      });
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe("Form Validation", () => {
    const fillVirtualCardForm = async (user: ReturnType<typeof userEvent.setup>) => {
      await user.type(screen.getByTestId("card-displayName"), "Test Card");
      await user.type(screen.getByTestId("card-firstName"), "John");
      await user.type(screen.getByTestId("card-lastName"), "Doe");
      await user.type(screen.getByTestId("card-email"), "john@example.com");
      await user.type(screen.getByTestId("card-limitAmount"), "1000");
      await user.click(screen.getByTestId("card-limitCycle"));

      await waitFor(async () => {
        expect(screen.getByText("Month")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Month"));
      await user.type(screen.getByTestId("card-displayName"), "Test Card");
      await user.type(screen.getByTestId("card-firstName"), "John");
    };

    it("should validate required fields for virtual card", async () => {
      const user = userEvent.setup();
      render(<CreateCardModal {...defaultProps} />);

      await user.click(screen.getByTestId("card-createButton"));

      await waitFor(() => {
        expect(screen.getByText(/Enter valid card name/i)).toBeInTheDocument();
        expect(screen.getByText(/Please enter valid first name/i)).toBeInTheDocument();
        expect(screen.getByText(/Please enter valid last name/i)).toBeInTheDocument();
        expect(screen.getByText(/Invalid email/i)).toBeInTheDocument();
      });
    });

    it("should validate required fields for physical card", async () => {
      const user = userEvent.setup();
      render(<CreateCardModal {...defaultProps} />);

      await user.click(screen.getByTestId("card-selector"));
      await waitFor(() => {
        expect(screen.getByTestId("card-physical")).toBeInTheDocument();
      });
      await user.click(screen.getByTestId("card-physical"));

      await fillVirtualCardForm(user);

      await user.click(screen.getByTestId("card-createButton"));

      await waitFor(() => {
        expect(screen.getAllByText(/Please select a country/i)[0]).toBeInTheDocument();
      });
    });

    it("should validate email format", async () => {
      const user = userEvent.setup();
      render(<CreateCardModal {...defaultProps} />);

      await user.type(screen.getByTestId("card-email"), "invalid-email");
      await user.click(screen.getByTestId("card-createButton"));

      await waitFor(() => {
        expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
      });
    });
  });
});
