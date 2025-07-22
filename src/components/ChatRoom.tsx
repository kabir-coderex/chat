import React, { useState, useEffect, useRef } from 'react';
import { LogOut, Wifi, WifiOff } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { Message } from '../types';
import { WebRTCConnection } from '../utils/webrtc';
import { storageUtils } from '../utils/storage';
import { v4 as uuidv4 } from 'uuid';

interface ChatRoomProps {
  connection: WebRTCConnection;
  onDisconnect: () => void;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({ connection, onDisconnect }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [connectionState, setConnectionState] = useState<string>('connecting');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Load existing messages
    setMessages(storageUtils.getMessages());

    // Set up connection handlers
    connection.onMessage((message) => {
      const incomingMessage: Message = { ...message, sender: 'peer' };
      setMessages(prev => {
        const newMessages = [...prev, incomingMessage];
        storageUtils.saveMessages(newMessages);
        return newMessages;
      });

      // Show notification if page is not visible
      if (document.hidden) {
        storageUtils.showNotification('New Message', incomingMessage.text);
      }

      // Show typing indicator briefly
      setIsTyping(true);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 1000);
    });

    connection.onConnectionStateChange(setConnectionState);

    // Request notification permission
    storageUtils.requestNotificationPermission();

    // Auto-scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [connection]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = (text: string) => {
    const message: Message = {
      id: uuidv4(),
      text,
      sender: 'me',
      timestamp: Date.now(),
      type: 'text'
    };

    setMessages(prev => {
      const newMessages = [...prev, message];
      storageUtils.saveMessages(newMessages);
      return newMessages;
    });

    connection.sendMessage(message);
  };

  const handleSendImage = (imageData: string) => {
    const message: Message = {
      id: uuidv4(),
      text: 'Image',
      sender: 'me',
      timestamp: Date.now(),
      type: 'image',
      imageData
    };

    setMessages(prev => {
      const newMessages = [...prev, message];
      storageUtils.saveMessages(newMessages);
      return newMessages;
    });

    connection.sendMessage(message);
  };

  const handleDisconnect = () => {
    connection.close();
    storageUtils.clearConnection();
    onDisconnect();
  };

  const isConnected = connectionState === 'connected';

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Wifi className="text-green-400" size={20} />
          ) : (
            <WifiOff className="text-red-400" size={20} />
          )}
          <span className="text-white font-medium">
            {isConnected ? 'Connected' : 'Connecting...'}
          </span>
        </div>

        <button
          onClick={handleDisconnect}
          className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors btn"
        >
          <LogOut size={16} />
          Unpair
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 ? (
          <div className="text-center text-white/60 mt-8">
            <p>No messages yet. Start the conversation!</p>
            <p className="text-sm mt-2">Messages disappear after 24 hours</p>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))
        )}
        
        {isTyping && (
          <div className="flex justify-start mb-4">
            <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-2xl rounded-bl-md">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        onSendImage={handleSendImage}
        disabled={!isConnected}
      />
    </div>
  );
};