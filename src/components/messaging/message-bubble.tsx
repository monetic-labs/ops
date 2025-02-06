"use client";

import React from "react";
import DOMPurify from "dompurify";
import { Message as AIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm"; // For tables, strikethrough, etc.
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Avatar } from "@nextui-org/avatar";
import { User, Image as ImageIcon, Camera } from "lucide-react";

// Define CodeProps interface if needed
interface CodeProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

import { Message as CustomMessage } from "@/types/messaging";

interface MessageBubbleProps {
  message: AIMessage | CustomMessage;
  contentTestId?: string;
  ["data-testid"]?: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, contentTestId, "data-testid": testId }) => {
  const isUser = "role" in message ? message.role === "user" : message.type === "user";

  const getBubbleStyle = () => {
    return isUser ? "bg-ualert-500 text-notpurple-500 ml-auto" : "bg-charyo-500/50 text-notpurple-500 mr-auto";
  };

  const getMessageId = () => {
    return "role" in message ? message.id : message.id;
  };

  const getMessageType = () => {
    return "role" in message ? message.role : message.type;
  };

  const sanitizeContent = (content: string) => {
    // First use DOMPurify to remove any dangerous HTML/scripts
    const sanitized = DOMPurify.sanitize(content, {
      ALLOWED_TAGS: [], // Allow no HTML tags
      ALLOWED_ATTR: [], // Allow no HTML attributes
    });

    // Then strip any remaining HTML-like content
    return sanitized.replace(/<[^>]*>/g, "");
  };

  const formatAgentResponse = (content: string) => {
    // First sanitize the content
    const sanitized = sanitizeContent(content);

    // Format different sections
    return (
      sanitized
        // Format headers with bold
        .replace(/\*\*(.*?)\*\*/g, "**$1**")
        // Add spacing after sections
        .split("\n")
        .map((line) => {
          // Handle bullet points
          if (line.trim().startsWith("-")) {
            return `\n${line}`;
          }
          // Handle section headers
          if (line.includes("**") && line.trim().endsWith("**:")) {
            return `\n${line}\n`;
          }

          return line;
        })
        .join("\n")
    );
  };

  const getMessageContent = () => {
    const content = "role" in message ? message.content : message.text;
    const hasAttachment = !("role" in message) && message.attachment;

    // If there's an attachment, show it with the message
    if (hasAttachment && message.attachment) {
      const attachmentContent = (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {message.attachment.type === "screenshot" ? (
              <Camera className="w-4 h-4 text-white/80" />
            ) : (
              <ImageIcon className="w-4 h-4 text-white/80" />
            )}
            <span className="text-white/80 text-sm">
              {message.attachment.type === "screenshot" ? "Screenshot" : "Image"}
            </span>
          </div>
          {message.attachment.url && (
            <div className="mt-2 rounded-md overflow-hidden max-w-[200px]">
              <img
                src={message.attachment.url}
                alt={`${message.attachment.type} attachment`}
                className="w-full h-auto object-cover"
              />
            </div>
          )}
          {content && content !== "Image Attachment" && content !== "Screenshot" && (
            <div className="mt-2 text-sm">{content}</div>
          )}
        </div>
      );
      return attachmentContent;
    }

    // Apply special formatting for agent messages
    if (("role" in message && message.role === "assistant") || ("type" in message && message.type === "bot")) {
      return formatAgentResponse(content);
    }

    return sanitizeContent(content);
  };

  const messageContent = getMessageContent();
  const bubbleTestId = testId || `message-${getMessageId()}`;
  const contentBubbleTestId = `${bubbleTestId}-content`;

  return (
    <div className="flex items-start gap-3 message-${getMessageType()}" data-testid={bubbleTestId}>
      {!isUser && (
        <Avatar
          icon={<User className="w-4 h-4" />}
          classNames={{
            base: "bg-charyo-600",
            icon: "text-notpurple-500",
          }}
          size="sm"
        />
      )}
      <div className={`max-w-[85%] rounded-lg p-3 shadow-sm ${getBubbleStyle()}`} data-testid={contentBubbleTestId}>
        {React.isValidElement(messageContent) ? (
          messageContent
        ) : (
          <ReactMarkdown
            className="break-words prose prose-invert max-w-none text-sm"
            components={{
              code({ node, inline, className, children, ...props }: CodeProps) {
                const match = /language-(\w+)/.exec(className || "");
                const codeString = String(children).replace(/\n$/, "");

                if (!inline && match) {
                  return (
                    <SyntaxHighlighter
                      PreTag="div"
                      language={match[1]}
                      style={vscDarkPlus}
                      className="rounded-md !bg-charyo-600/50 text-xs"
                    >
                      {codeString}
                    </SyntaxHighlighter>
                  );
                }

                return (
                  <code className={`${className} bg-charyo-600/50 rounded px-1 text-xs`} {...props}>
                    {children}
                  </code>
                );
              },
            }}
            remarkPlugins={[remarkGfm]}
          >
            {messageContent as string}
          </ReactMarkdown>
        )}
      </div>
      {isUser && (
        <Avatar
          icon={<User className="w-4 h-4" />}
          classNames={{
            base: "bg-ualert-600",
            icon: "text-notpurple-500",
          }}
          size="sm"
        />
      )}
    </div>
  );
};
