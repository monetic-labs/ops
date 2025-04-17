"use client";

// Import the component previously used for the 'Members' tab
import MembersTab from "@/components/users/members-tab";
import { useUser } from "@/contexts/UserContext"; // Assuming MembersTab needs user info

export default function UsersMembersPage() {
  const { user } = useUser(); // Example: Fetch user if needed by component
  // Pass necessary props, like userId
  return <MembersTab userId={user?.id || ""} isCreateModalOpen={false} setIsCreateModalOpen={() => {}} />;
}
