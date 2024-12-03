// import { Message, WebSocketMessage } from "@/types/messaging";
// import { create } from 'zustand';


// interface WebSocketState {
//   connection: WebSocket | null;
//   status: 'connecting' | 'connected' | 'disconnected';
//   messageQueue: Message[];
//   error: Error | null;
// }

// interface WebSocketStore extends WebSocketState {
//   connect: () => Promise<void>;
//   disconnect: () => void;
//   send: (message: Message) => Promise<void>;
//   clearError: () => void;
//   processQueue: () => void;
// }

// export const useWebSocket = create<WebSocketStore>((set, get) => ({
//   connection: null,
//   status: 'disconnected',
//   messageQueue: [],
//   error: null,

//   connect: async () => {
//     if (get().status === 'connecting' || get().status === 'connected') return;

//     set({ status: 'connecting' });
    
//     try {
//       const ws = new MockWebSocket(process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3000");

//       ws.onopen = () => {
//         set({ connection: ws, status: 'connected' });
//         get().processQueue();
//       };

//       ws.onclose = () => {
//         set({ connection: null, status: 'disconnected' });
//         // Attempt reconnect after delay
//         setTimeout(() => get().connect(), 5000);
//       };

//       ws.onerror = (event) => {
//         set({ error: new Error('WebSocket connection error') });
//       };

//     } catch (error) {
//       set({ error: error as Error, status: 'disconnected' });
//     }
//   },

//   disconnect: () => {
//     const { connection } = get();
//     if (connection) {
//       connection.close();
//       set({ connection: null, status: 'disconnected' });
//     }
//   },

//   send: async (message: Message) => {
//     const { connection, status, messageQueue } = get();

//     if (status !== 'connected' || !connection) {
//       set({ messageQueue: [...messageQueue, message] });
//       await get().connect();
//       return;
//     }

//     connection.send(JSON.stringify(message));
//   },

//   processQueue: () => {
//     const { messageQueue, connection } = get();
//     if (!connection || messageQueue.length === 0) return;

//     messageQueue.forEach(message => {
//       connection.send(JSON.stringify(message));
//     });
//     set({ messageQueue: [] });
//   },

//   clearError: () => set({ error: null })
// }));

