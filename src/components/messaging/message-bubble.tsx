"use client";

import React from "react";
import DOMPurify from "dompurify";
import { Message as AIMessage } from "ai";

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // For tables, strikethrough, etc.
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

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
  const getBubbleStyle = () => {
    if ("role" in message) {
      return message.role === "user" ? "bg-ualert-500 text-notpurple-500" : "bg-charyo-500/50 text-notpurple-500";
    }

    return message.type === "user" ? "bg-ualert-500 text-notpurple-500" : "bg-charyo-400 text-notpurple-500";
  };

  const getAlignment = () => {
    if ("role" in message) {
      return message.role === "user" ? "justify-end" : "justify-start";
    }

    return message.type === "user" ? "justify-end" : "justify-start";
  };

  const getMessageId = () => {
    if ("role" in message) {
      return message.id;
    }

    return message.id;
  };

  const getMessageType = () => {
    if ("role" in message) {
      return message.role;
    }

    return message.type;
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
    return sanitized
      // Format headers with bold
      .replace(/\*\*(.*?)\*\*/g, '**$1**')
      // Add spacing after sections
      .split('\n')
      .map(line => {
        // Handle bullet points
        if (line.trim().startsWith('-')) {
          return `\n${line}`;
        }
        // Handle section headers
        if (line.includes('**') && line.trim().endsWith('**:')) {
          return `\n${line}\n`;
        }
        return line;
      })
      .join('\n');
  };
  
  const getMessageContent = () => {
    const content = "role" in message ? message.content : message.text;
    
    // Apply special formatting for agent messages
    if (("role" in message && message.role === "assistant") || 
        ("type" in message && message.type === "bot")) {
      return formatAgentResponse(content);
    }
    
    return sanitizeContent(content);
  };

  const messageId = getMessageId();
  const bubbleTestId = testId || `message-${messageId}`; 
  const contentBubbleTestId = `${bubbleTestId}-content`; 
  const statusTestId = `${bubbleTestId}-status`; 

  return (
    <div className={`flex ${getAlignment()} message-${getMessageType()}`} data-testid={bubbleTestId}>
      <div className={`max-w-[80%] rounded-lg p-3 ${getBubbleStyle()}`} data-testid={contentBubbleTestId}>
      <ReactMarkdown
          className="break-words"
          remarkPlugins={[remarkGfm]}
          components={{
            code({ node, inline, className, children, ...props }: CodeProps) {
              const match = /language-(\w+)/.exec(className || '');
              const codeString = String(children).replace(/\n$/, '');
              
              if (!inline && match) {
                return (
                  <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  >
                    {codeString}
                  </SyntaxHighlighter>
                );
              }
              
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
            // Customize other elements
            h1: ({node, ...props}) => <h1 className="text-xl font-bold my-4" {...props} />,
            h2: ({node, ...props}) => <h2 className="text-lg font-bold my-3" {...props} />,
            h3: ({node, ...props}) => <h3 className="text-md font-bold my-2" {...props} />,
            ul: ({node, ...props}) => <ul className="list-disc ml-4 my-2" {...props} />,
            ol: ({node, ...props}) => <ol className="list-decimal ml-4 my-2" {...props} />,
            p: ({node, ...props}) => <p className="my-2" {...props} />
          }}
        >
          {getMessageContent()}
        </ReactMarkdown>
      </div>
    </div>
  );
};
