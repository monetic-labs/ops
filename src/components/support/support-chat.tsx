'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  status: 'sending' | 'sent' | 'error';
}

const SupportChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load initial messages from local storage
    const storedMessages = localStorage.getItem('chatMessages');
    if (storedMessages) {
      setMessages(JSON.parse(storedMessages));
    }

    // Set up polling for new messages
    const pollInterval = setInterval(fetchNewMessages, 5000);

    return () => clearInterval(pollInterval);
  }, []);

  useEffect(() => {
    // Save messages to local storage whenever they change
    localStorage.setItem('chatMessages', JSON.stringify(messages));
    
    // Scroll to bottom of messages
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchNewMessages = async () => {
    try {
      const response = await fetch('/api/support/get-messages');
      if (!response.ok) throw new Error('Failed to fetch messages');
      const newMessages = await response.json();
      setMessages(prevMessages => [...prevMessages, ...newMessages]);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (newMessage.trim() === '') return;

    const userMessage: Message = {
      id: Date.now(),
      text: newMessage,
      isUser: true,
      status: 'sending',
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);
    setNewMessage('');

    try {
      const response = await fetch('/api/support/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newMessage }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === userMessage.id ? { ...msg, status: 'sent' } : msg
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === userMessage.id ? { ...msg, status: 'error' } : msg
        )
      );
    }
  };

  return (
    <div className="support-chat">
      <div className="messages">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.isUser ? 'user' : 'support'}`}>
            {message.text}
            {message.isUser && (
              <span className="status">
                {message.status === 'sending' && '⏳'}
                {message.status === 'sent' && '✓'}
                {message.status === 'error' && '❌'}
              </span>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      {isTyping && <div className="typing-indicator">Support is typing...</div>}
      <div className="input-area">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type your message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default SupportChat;