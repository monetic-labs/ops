import { useState } from "react";
import { AddUserSchema } from "@/validations/onboard";

interface UseInviteUserReturn {
  inviteUser: (data: AddUserSchema) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export const useInviteUser = (): UseInviteUserReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inviteUser = async (data: AddUserSchema) => {
    setIsLoading(true);
    setError(null);

    try {
      // Mocking the call to the Pylon service
      console.log("Inviting user with data:", data);

      // Simulate a delay for the mock call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Simulate sending URLs to the users
      data.forEach((user, index) => {
        const inviteUrl = new URL("https://example.com/invite");
        if (user.email) inviteUrl.searchParams.append("email", user.email);
        if (user.phoneNumber) inviteUrl.searchParams.append("phoneNumber", user.phoneNumber);
        console.log(`URL sent to user ${index + 1}:`, inviteUrl.toString());
      });
    } catch (err) {
      setError("Failed to invite user(s). Please try again.");
      console.error("Error inviting user(s):", err);
    } finally {
      setIsLoading(false);
    }
  };

  return { inviteUser, isLoading, error };
};