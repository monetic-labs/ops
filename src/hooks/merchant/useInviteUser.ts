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

      // Simulate sending a URL to the user
      console.log(`URL sent to user: https://example.com/invite?email=${data.email}`);
    } catch (err) {
      setError("Failed to invite user. Please try again.");
      console.error("Error inviting user:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return { inviteUser, isLoading, error };
};