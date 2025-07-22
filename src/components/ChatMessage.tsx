import React from 'react';
import { Message } from '../types';
import { formatDistanceToNow } from '../utils/dateUtils';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isMe = message.sender === 'me';
  
  const renderContent = () => {
    if (message.type === 'image' && message.imageData) {
      return (
        <img 
          src={message.imageData} 
          alt="Shared image" 
          className="max-w-xs rounded-lg"
        />
      );
    }

    // Check if message contains URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = message.text.split(urlRegex);
    
    return (
      <div className="break-words">
        {parts.map((part, index) => 
          urlRegex.test(part) ? (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-300 hover:text-blue-200 underline"
            >
              {part}
            </a>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </div>
    );
  };

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
          isMe
            ? 'bg-blue-600 text-white rounded-br-md'
            : 'bg-white/10 text-white rounded-bl-md backdrop-blur-sm'
        } shadow-lg`}
      >
        {renderContent()}
        <div className={`text-xs mt-1 ${isMe ? 'text-blue-100' : 'text-white/60'}`}>
          {formatDistanceToNow(message.timestamp)}
        </div>
      </div>
    </div>
  );
};