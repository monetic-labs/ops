import { User } from "@/prompts/v0/helpers/graph";

export const mockUser: User = {
    id: "test-user-1",
    role: "standard",
    permissions: ["user-auth", "transfer-basic"]
};

export const mockAdminUser: User = {
    id: "admin-1",
    role: "admin",
    permissions: ["user-auth", "admin-access", "transfer-all"]
};