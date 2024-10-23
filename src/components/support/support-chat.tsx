'use client';

import React, { useState, useEffect } from 'react';

interface Message {
  id: number;
  text: string;
  isUser: boolean;
}

const SupportChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    // Fetch initial messages or set up WebSocket connection here
  }, []);

  const sendMessage = async () => {
    if (newMessage.trim() === '') return;

    const userMessage: Message = {
      id: Date.now(),
      text: newMessage,
      isUser: true,
    };

    setMessages([...messages, userMessage]);
    setNewMessage('');

    try {
      const response = await fetch('/api/support/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: newMessage }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Message sent:', data);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="support-chat">
      <div className="messages">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.isUser ? 'user' : 'support'}`}>
            {message.text}
          </div>
        ))}
      </div>
      <div className="input-area">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default SupportChat;