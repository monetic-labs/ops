import { create } from 'zustand';

type ChatMode = 'bot' | 'support';

interface ChatModeStore {
  mode: ChatMode;
  setMode: (mode: ChatMode) => void;
}

export const useChatMode = create<ChatModeStore>((set) => ({
  mode: 'bot',
  setMode: (mode) => set({ mode })
}));