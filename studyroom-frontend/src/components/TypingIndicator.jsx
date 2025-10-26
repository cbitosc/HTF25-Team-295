import React from "react";

export default function TypingIndicator({ users = [] }) {
  if (users.length === 0) return null;

  return (
    <div className="flex items-center space-x-2 text-gray-400 text-sm italic">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
      <span>
        {users.length === 1 
          ? `${users[0]} is typing...` 
          : `${users.join(", ")} are typing...`
        }
      </span>
    </div>
  );
}
