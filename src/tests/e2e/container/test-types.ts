// Add ShortcutsContextType to the types
export interface ShortcutsContextType {
  isChatOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
}

// Define the positions return type
export interface MessagePositions {
  curr: number;
  prev: number;
}

export interface MockWebSocket {
  send: (data: string) => void;
  close: () => void;
  addEventListener: (event: string, handler: Function) => void;
  removeEventListener: (event: string, handler: Function) => void;
  readyState: number;
  onmessage?: (event: MessageEvent) => void;
  onclose?: () => void;
  onopen?: () => void;
  onerror?: (error: any) => void;
  getAllMessages: () => any[];
}
