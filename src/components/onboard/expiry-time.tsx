import { useEffect, useState } from "react";
import { Progress } from "@nextui-org/progress";
import { Clock } from "lucide-react";

import { cn } from "@/utils/cn";
import { formatDuration } from "@/utils/helpers";

interface ExpiryTimerProps {
  expiryTime: number; // Unix timestamp in seconds
  onExpire?: () => void;
  variant?: "inline" | "fixed";
}

export function ExpiryTimer({ expiryTime, onExpire, variant = "inline" }: ExpiryTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [progress, setProgress] = useState(100);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = Math.max(0, expiryTime - now);

      return remaining;
    };

    const totalDuration = expiryTime - Math.floor(Date.now() / 1000);
    const initialTimeLeft = calculateTimeLeft();

    setTimeLeft(initialTimeLeft);

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();

      setTimeLeft(remaining);
      setProgress((remaining / totalDuration) * 100);

      if (remaining <= 0) {
        clearInterval(timer);
        onExpire?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiryTime, onExpire]);

  // Handle scroll detection for mobile
  useEffect(() => {
    if (variant === "fixed") {
      const handleScroll = () => {
        setIsScrolled(window.scrollY > 100);
      };

      window.addEventListener("scroll", handleScroll);

      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, [variant]);

  const isWarning = timeLeft < 300;
  const color = isWarning ? "danger" : "warning";

  if (variant === "inline") {
    return (
      <div className="flex items-center gap-2 text-sm text-foreground/80">
        <TimerContent showProgress color={color} isWarning={isWarning} progress={progress} timeLeft={timeLeft} />
      </div>
    );
  }

  return (
    <>
      {/* Desktop navbar */}
      <div className="hidden md:block fixed top-0 left-0 right-0 h-8 bg-background/50 backdrop-blur-xl border-b border-border/20 z-40">
        <div className="h-full max-w-3xl mx-auto px-16 flex items-center justify-center">
          <TimerContent showProgress color={color} isWarning={isWarning} progress={progress} timeLeft={timeLeft} />
        </div>
      </div>

      {/* Mobile bottom sheet */}
      <div
        className={cn(
          "md:hidden fixed bottom-0 left-0 right-0 px-4 py-2.5 bg-content1 border-t border-border z-50",
          isScrolled ? "translate-y-0" : "translate-y-full",
          "transition-transform duration-200"
        )}
      >
        <TimerContent
          color={color}
          isWarning={isWarning}
          progress={progress}
          showProgress={false}
          timeLeft={timeLeft}
        />
      </div>
    </>
  );
}

// Extracted timer content into a separate component for reuse
function TimerContent({
  timeLeft,
  isWarning,
  progress,
  color,
  showProgress = true,
}: {
  timeLeft: number;
  isWarning: boolean;
  progress: number;
  color: "warning" | "danger";
  showProgress?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3", !showProgress && "w-full justify-between")}>
      <div className="flex items-center gap-2">
        <Clock className={cn("w-3.5 h-3.5 shrink-0", isWarning && "text-danger")} />
        <span className="font-medium text-xs text-foreground/70 whitespace-nowrap">Session expires in</span>
      </div>
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "font-mono text-xs whitespace-nowrap",
            isWarning ? "text-danger font-medium" : "text-foreground/70"
          )}
        >
          {formatDuration(timeLeft)}
        </span>
        {showProgress && (
          <Progress
            aria-label="Session expiry progress"
            classNames={{
              base: "w-[60px]",
              track: cn("border border-border/20", isWarning && "!border-danger/20"),
              indicator: cn(isWarning ? "bg-danger" : "bg-foreground", "opacity-20"),
            }}
            color={color}
            size="sm"
            value={progress}
          />
        )}
      </div>
    </div>
  );
}
