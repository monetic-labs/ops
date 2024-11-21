import { AgentChatContext, AgentMessageService } from "@/types/messaging";
import { mockMessages } from "./message.fixture";
import { convertCustomMessageToAI, convertAIMessageToCustom } from "@/types/messageDTO";
import { Message as AIMessage, CreateMessage } from "ai/react";

export const mockAgentContext: AgentChatContext = {
    mode: "agent",
    messages: mockMessages.agent,
    inputValue: "",
    setInputValue: async (value: string) => Promise.resolve(),
    sendMessage: async (text: string) => Promise.resolve(),
    handleSubmit: async (e: React.FormEvent) => Promise.resolve(),
    userId: "test-user",
    service: {
      type: "openai",
      isLoading: false,
      model: "gpt-4",
      messages: mockMessages.agent,
      inputValue: "",
      setInputValue: async (value: string) => Promise.resolve(),
      sendMessage: async (text: string) => Promise.resolve(),
      handleSubmit: async (e: React.FormEvent) => Promise.resolve(),
      getUserId: () => "test-user"
    } as AgentMessageService,
    chatHelpers: {
      messages: mockMessages.agent.map(convertCustomMessageToAI),
      isLoading: false,
      input: "",
      handleSubmit: async () => Promise.resolve(),
      handleInputChange: async () => Promise.resolve(),
      setInput: async () => Promise.resolve(),
      error: undefined,
      append: async (message: AIMessage | CreateMessage) => {
        const customMessage = convertAIMessageToCustom(message as AIMessage);
        return Promise.resolve(customMessage.id);
      },
      reload: async () => Promise.resolve(""),
      stop: async () => Promise.resolve(""),
      setMessages: (messages: AIMessage[] | ((messages: AIMessage[]) => AIMessage[])) => {
        if (Array.isArray(messages)) {
          const customMessages = messages.map(convertAIMessageToCustom);
        }
      },
      setData: async (data: any) => Promise.resolve()
    },
    isTyping: false
  };