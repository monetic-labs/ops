import { Message as AIMessage } from "ai/react";
import { Message as CustomMessage } from "@/types/messaging";

export function convertAIMessageToCustom(aiMessage: AIMessage): CustomMessage {
  return {
    id: aiMessage.id,
    text: aiMessage.content,
    type: aiMessage.role === 'user' ? 'user' : 'bot',
    timestamp: Date.now(),
    status: 'sent',
    source: aiMessage.role === 'assistant' ? 'openai' : undefined
  } as CustomMessage;
}

export function convertCustomMessageToAI(customMessage: CustomMessage): AIMessage {
  return {
    id: customMessage.id,
    content: customMessage.text,
    role: customMessage.type === 'user' ? 'user' : 'assistant',
    createdAt: new Date(customMessage.timestamp)
  };
}