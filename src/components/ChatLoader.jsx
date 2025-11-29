import React from "react";

export default function ChatLoader() {
  return (
    <div className="flex justify-center py-3">
      <div className="flex space-x-2">
        <span className="w-3 h-3 bg-green-600 rounded-full animate-bounce [animation-delay:-0.3s] shadow-md shadow-green-900"></span>
        <span className="w-3 h-3 bg-green-500 rounded-full animate-bounce [animation-delay:-0.15s] shadow-md shadow-green-800"></span>
        <span className="w-3 h-3 bg-green-400 rounded-full animate-bounce shadow-md shadow-green-700"></span>
      </div>
    </div>
  );
}
