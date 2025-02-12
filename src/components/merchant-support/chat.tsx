import { useEffect, useState, useRef } from "react";

import { XMTPService, type GroupMessage } from "@/utils/xmtp/client";
import type { WebAuthnCredentials } from "@/utils/localstorage";
import { createSafeAccount } from "@/utils/safe";
import { Address } from "viem";

interface ChatProps {
  account: WebAuthnCredentials;
  merchantId: string;
}

export function MerchantSupportChat({ account, merchantId }: ChatProps) {
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const walletAddress = createSafeAccount({ signer: account.publicKey, isWebAuthn: true }) as Address;
  const xmtpService = useRef<XMTPService>(new XMTPService(walletAddress, merchantId, account));

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Handle cleanup on unmount or account/merchant change
  useEffect(() => {
    // If account or merchant changes, create new service
    xmtpService.current = new XMTPService(walletAddress, merchantId, account);

    // Cleanup on unmount or account change
    return () => {
      xmtpService.current.disconnect();
    };
  }, [account, merchantId]);

  // Load initial messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const history = await xmtpService.current.listGroupMessages(merchantId);

        setMessages(history);
        setIsLoading(false);
        scrollToBottom();
      } catch (error) {
        console.error("Error loading messages:", error);
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [merchantId]);

  // Stream new messages
  useEffect(() => {
    const streamMessages = async () => {
      await xmtpService.current.streamGroupMessages(merchantId, (msg) => {
        setMessages((prev) => [...prev, msg]);
        scrollToBottom();
      });
    };

    streamMessages();
  }, [merchantId]);

  // Handle sending new messages
  const handleSend = async () => {
    if (!newMessage.trim()) return;

    try {
      await xmtpService.current.sendGroupMessage(merchantId, newMessage);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-4">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`mb-4 ${msg.senderAddress === walletAddress ? "ml-auto" : "mr-auto"}`}>
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                msg.senderAddress === walletAddress ? "bg-blue-500 text-white ml-auto" : "bg-gray-100"
              }`}
            >
              <p className="text-sm">{msg.content}</p>
              <p className="text-xs mt-1 opacity-70">{new Date(msg.sent).toLocaleTimeString()}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <input
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type your message..."
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
          />
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            onClick={handleSend}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
