import { ChatContextType, Message as CustomMessage, AgentMessageService, SupportMessageService } from "@/types/messaging";
import { Page } from "@playwright/test";
import { Message as AIMessage} from "ai";
import { convertCustomMessageToAI, convertAIMessageToCustom } from "@/types/messageDTO";

// Mock Agent Service
const createMockAgentService = (): AgentMessageService => ({
  type: "openai",
  messages: [],
  isLoading: false,
  model: "gpt-3.5-turbo",
  inputValue: "",
  setInputValue: () => {},
  sendMessage: async () => {},
  handleSubmit: async () => {},
  getUserId: () => "test-agent",
});

// Mock Support Service
const createMockSupportService = (): SupportMessageService => ({
  type: "websocket",
  channel: "test-channel",
  messages: [],
  isTyping: false,
  isLoading: false,
  inputValue: "",
  setInputValue: () => {},
  sendMessage: async () => {},
  handleSubmit: async () => {},
  handleWebSocketMessage: () => {},
  getUserId: () => "test-support",
});

export const createMockChatContext = (mode: 'agent' | 'support', messages: CustomMessage[] = [], isTyping: boolean = false): ChatContextType => {
  const baseContext = {
    messages,
    inputValue: "",
    setInputValue: () => {},
    sendMessage: async () => {},
    handleSubmit: async () => {},
    userId: "test-user",
  };

  if (mode === 'agent') {
    return {
      ...baseContext,
      mode: 'agent',
      service: createMockAgentService(),
      chatHelpers: {
        messages: messages.map(convertCustomMessageToAI),
        input: "",
        handleInputChange: () => {},
        handleSubmit: () => {},
        setInput: () => {},
        isLoading: false,
        error: undefined,
        append: async () => null,
        reload: async () => null,
        stop: () => {},
        setMessages: (newMessages: AIMessage[] | ((prev: AIMessage[]) => AIMessage[])) => {
          // Convert AI messages to custom messages if needed
          if (typeof newMessages === 'function') {
            const currentAIMessages = messages.map(convertCustomMessageToAI);
            const updatedAIMessages = newMessages(currentAIMessages);
            return updatedAIMessages.map(convertAIMessageToCustom);
          }
          return newMessages.map(convertAIMessageToCustom);
        },
        setData: () => {},
      },
      isTyping: false,
    };
  }

  return {
    ...baseContext,
    mode: 'support',
    service: {
      ...createMockSupportService(),
      isTyping, // Use the passed isTyping value
    },
    isTyping, // Set the context isTyping value
  };
};

// Helper function to safely inject mock context
export const injectMockContext = async (
  page: Page, 
  contextType: 'agent' | 'support', 
  initialMessages: CustomMessage[] = [],
  isTyping: boolean = false
) => {
  const mockContext = createMockChatContext(contextType, initialMessages, isTyping);
  
  // Debug: Log the context being injected
  console.log('Injecting context:', mockContext);
  
  await page.evaluate(({ context }) => {
    // Debug: Log the context in the browser
    console.log('Browser received context:', context);
    window.__MOCK_CHAT_CONTEXT__ = context;
  }, { context: JSON.parse(JSON.stringify(mockContext)) });
  
  // Verify the context was set
  const verifyContext = await getMockContext(page);
  console.log('Verified context:', verifyContext);
};

export const getMockContext = async (page: Page): Promise<ChatContextType | undefined> => {
  return await page.evaluate(() => window.__MOCK_CHAT_CONTEXT__);
};