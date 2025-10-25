import React from "react";

export default function Sidebar({ rooms, currentRoom, setRoom }) {
  return (
    <div className="w-64 bg-gray-900 h-full border-r border-gray-800 flex flex-col">
      <h2 className="text-xl font-semibold text-blue-400 p-4 border-b border-gray-800">Study Rooms</h2>
      <div className="flex-1 overflow-y-auto">
        {rooms.map((r, i) => (
          <div
            key={i}
            onClick={() => setRoom(r)}
            className={`p-3 px-5 cursor-pointer hover:bg-gray-800 transition ${
              currentRoom === r ? "bg-gray-800 text-blue-400 font-medium" : "text-gray-300"
            }`}
          >
            #{r}
          </div>
        ))}
      </div>
    </div>
  );
}
