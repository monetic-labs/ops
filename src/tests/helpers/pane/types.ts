import { AgentChatContext, AgentMessageService, MessagingContextType, SupportChatContext } from "@/types/messaging";

export type BaseIntegrationContext = {
    mode: "agent" | "support";
    isOpen: boolean;
    width: number;
    wsReady: boolean;
    initialized: boolean;
  };
  
export type AgentIntegrationContext = BaseIntegrationContext & AgentChatContext & {
    mode: "agent";
    supportContext: SupportChatContext;
  };
  
export type SupportIntegrationContext = BaseIntegrationContext & SupportChatContext & {
    mode: "support";
    agentContext: AgentChatContext;
  };
  
export type IntegrationContextType = AgentIntegrationContext | SupportIntegrationContext;