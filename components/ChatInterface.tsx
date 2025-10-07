
import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import MessageBubble from './MessageBubble';
import { SendIcon, PaperclipIcon } from './Icons';
import Scratchpad from './Scratchpad';

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (text: string, image?: string) => void;
  onActionClick: (value: string, label: string) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, isLoading, onSendMessage, onActionClick }) => {
  const [inputText, setInputText] = useState('');
  const [showScratchpad, setShowScratchpad] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);
  
  const handleSendMessage = () => {
    if (inputText.trim() && !isLoading) {
      onSendMessage(inputText.trim());
      setInputText('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        onSendMessage(`Image uploaded: ${file.name}`, base64String);
      };
      reader.readAsDataURL(file);
    }
    // Reset file input
    if(fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleWorkSubmit = (method: 'upload' | 'scratchpad') => {
    if (method === 'upload') {
        fileInputRef.current?.click();
    } else {
        setShowScratchpad(true);
    }
  };
  
  const handleScratchpadSubmit = (dataUrl: string) => {
    const base64String = dataUrl.split(',')[1];
    onSendMessage("Here's my work from the scratchpad.", base64String);
    setShowScratchpad(false);
  };


  return (
    <div className="flex flex-col h-full bg-gray-100">
      <div className="flex-grow p-6 overflow-y-auto">
        <div className="flex flex-col space-y-2">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} onActionClick={onActionClick} onWorkSubmit={handleWorkSubmit} />
          ))}
          {isLoading && (
            <div className="self-start flex items-center">
              <div className="bg-white rounded-2xl p-4 my-2 shadow-sm flex items-center space-x-3">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse delay-0"></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse delay-200"></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse delay-400"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-center bg-gray-100 rounded-full p-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-indigo-600"
          >
            <PaperclipIcon />
          </button>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message or math problem..."
            className="flex-grow bg-transparent focus:outline-none px-4"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputText.trim()}
            className="p-2 rounded-full bg-indigo-500 text-white disabled:bg-gray-300 transition-colors"
          >
            <SendIcon />
          </button>
        </div>
      </div>
      {showScratchpad && <Scratchpad onClose={() => setShowScratchpad(false)} onSubmit={handleScratchpadSubmit} />}
    </div>
  );
};

export default ChatInterface;
