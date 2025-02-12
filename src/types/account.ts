import { LucideIcon } from "lucide-react";

export interface Account {
  id: string;
  name: string;
  balance?: number;
  currency: string;
  icon: LucideIcon;
  disabled?: boolean;
  comingSoon?: boolean;
  isCreateAccount?: boolean;
}
