import React from 'react';
import { Message, isRAGMetadata } from '@/components/support/chat-interface/message-types';

interface RAGMessageProps {
  message: Message;
}

const RAGMessage: React.FC<RAGMessageProps> = ({ message }) => {
  const sources = isRAGMetadata(message.metadata) ? message.metadata.sources : undefined;

  return (
    <div className="flex flex-col gap-2">
      <div className="whitespace-pre-wrap break-words">
        {message.text}
      </div>
      {sources && sources.length > 0 && (
        <div className="mt-2 text-sm opacity-75">
          <div className="font-semibold">Sources:</div>
          <ul className="list-disc pl-4">
            {sources.map((source, index) => (
              <li key={index}>{source}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default RAGMessage;