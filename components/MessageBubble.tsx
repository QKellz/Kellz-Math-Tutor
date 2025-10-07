import React from 'react';
import { Message, Sender } from '../types';
import { SparklesIcon, CheckCircleIcon } from './Icons';

interface MessageBubbleProps {
  message: Message;
  onActionClick: (value: string, label: string) => void;
  onWorkSubmit: (method: 'upload' | 'scratchpad') => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onActionClick, onWorkSubmit }) => {
  const { sender, text, actions, userWorkRequest, isCorrectAnswer } = message;
  const isUser = sender === Sender.USER;

  const bubbleClasses = isUser
    ? 'bg-indigo-500 text-white self-end'
    : 'bg-white text-gray-800 self-start shadow-sm';
  
  const formattedText = text.split('\n').map((line, index) => {
    // Regex to find text between **
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return (
        <React.Fragment key={index}>
            {parts.map((part, partIndex) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={partIndex}>{part.slice(2, -2)}</strong>;
                }
                return <React.Fragment key={partIndex}>{part}</React.Fragment>;
            })}
            <br />
        </React.Fragment>
    );
  });

  return (
    <div className={`flex w-full items-center gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {isUser && isCorrectAnswer && (
        <div className="text-green-500">
          <CheckCircleIcon className="w-6 h-6"/>
        </div>
      )}
      <div className={`max-w-xl rounded-2xl p-4 my-2 ${bubbleClasses} ${isCorrectAnswer ? 'animate-pulse-correct' : ''}`}>
        {!isUser && (
           <div className="flex items-center mb-2">
             <SparklesIcon className="w-5 h-5 text-amber-500 mr-2" />
             <span className="font-bold text-indigo-600">Kellz Math</span>
           </div>
        )}
        <div className="whitespace-pre-wrap">{formattedText}</div>
        
        {actions && actions.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {actions.map((action) => (
              <button
                key={action.value}
                onClick={() => onActionClick(action.value, action.label)}
                className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold hover:bg-indigo-200 transition-colors"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        {userWorkRequest && (
            <div className="mt-4 flex flex-wrap gap-3">
                <button 
                    onClick={() => onWorkSubmit('upload')}
                    className="bg-teal-100 text-teal-800 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-teal-200 transition-colors">
                    Upload Picture
                </button>
                <button 
                    onClick={() => onWorkSubmit('scratchpad')}
                    className="bg-sky-100 text-sky-800 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-sky-200 transition-colors">
                    Use Digital Scratchpad
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;