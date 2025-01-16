import { useEffect, useRef } from "react";
import io, { Socket } from "socket.io-client";

const baseUrl = process.env.NEXT_PUBLIC_PYLON_BASE_URL;

export const useWebSocket = ({ handleMessage }: { handleMessage: (...args: any[]) => void }) => {
  const wsRef = useRef<Socket>();

  useEffect(() => {
    wsRef.current = io(baseUrl, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      withCredentials: true,
    });
    wsRef.current.on("connect", () => {
      console.log("THIS IS CONNECTED");
    });

    wsRef.current.on("connect_error", console.log);
    wsRef.current.on("telegramMessage", handleMessage);

    return () => {
      wsRef.current?.close();
      wsRef.current = null as any;
    };
  }, [handleMessage]);
};
