import { create } from 'zustand';

type ChatMode = 'agent' | 'support';

interface ChatModeStore {
  mode: ChatMode;
  setMode: (mode: ChatMode) => void;
}

export const useChatMode = create<ChatModeStore>((set) => ({
  mode: 'agent',
  setMode: (mode) => set({ mode })
}));