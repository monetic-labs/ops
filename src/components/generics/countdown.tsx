import React, { useEffect, useState } from "react";

const calculateTimeLeft = (expiresAt: string) => {
  const expirationDate = new Date(expiresAt);
  const now = new Date();
  return expirationDate.getTime() - now.getTime();
};

const formatTimeLeft = (timeLeft: number) => {
  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
  return `${hours}h ${minutes}m ${seconds}s`;
};

const Countdown: React.FC<{ expiresAt: string }> = ({ expiresAt }) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(expiresAt));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(expiresAt));
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  return timeLeft <= 0 ? "Expired" : formatTimeLeft(timeLeft);
};

export default Countdown;