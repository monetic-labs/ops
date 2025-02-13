import { toast as sonnerToast } from "sonner";

interface ToastOptions {
  title: string;
  description?: string;
  duration?: number;
  variant?: "default" | "destructive";
}

export function useToast() {
  const toast = ({ title, description, duration = 3000, variant = "default" }: ToastOptions) => {
    if (variant === "destructive") {
      sonnerToast.error(title, {
        description,
        duration,
      });
    } else {
      sonnerToast(title, {
        description,
        duration,
      });
    }
  };

  return { toast };
}
