import React, { useState, useRef } from 'react';
import { Send, Image, Smile } from 'lucide-react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  onSendImage: (imageData: string) => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  onSendImage, 
  disabled = false 
}) => {
  const [message, setMessage] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        onSendImage(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setMessage(prevMessage => prevMessage + emojiData.emoji);
    setShowEmojis(false);
  };

  return (
    <div className="relative">
      {showEmojis && (
        <div className="absolute bottom-full left-0 mb-2">
          <EmojiPicker onEmojiClick={onEmojiClick} />
        </div>
      )}

      <div className="flex items-end gap-2 p-4 bg-white/5 backdrop-blur-sm">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          disabled={disabled}
        >
          <Image size={20} />
        </button>

        <button
          onClick={() => setShowEmojis(!showEmojis)}
          className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors"
        >
          <Smile size={20} />
        </button>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          disabled={disabled}
          className="flex-1 bg-white/10 text-white placeholder-white/50 rounded-xl px-4 py-2 resize-none max-h-32 backdrop-blur-sm border-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={1}
        />

        <button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 text-white rounded-full transition-colors"
        >
          <Send size={20} />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>
    </div>
  );
};