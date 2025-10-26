import React, { useState } from "react";
import { FiUsers, FiSettings, FiPlus, FiX, FiHash } from "react-icons/fi";

export default function Sidebar({ rooms, currentRoom, setRoom, username, isMobile, onClose, onAddRoom }) {
  const [onlineUsers] = useState([]); // Remove static users
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");

  const handleAddRoom = (e) => {
    e.preventDefault();
    if (newRoomName.trim()) {
      onAddRoom(newRoomName.trim());
      setNewRoomName("");
      setShowAddRoom(false);
    }
  };

  return (
    <div className="w-64 bg-gray-900 h-full border-r border-gray-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-blue-400">Study Rooms</h2>
          {isMobile && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <FiX size={20} />
            </button>
          )}
        </div>
        <div className="mt-2 text-sm text-gray-400">
          Welcome, <span className="text-blue-400">{username}</span>
        </div>
      </div>

      {/* Online Users - Only show if there are users */}
      {onlineUsers.length > 0 && (
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center text-sm text-gray-400 mb-2">
            <FiUsers className="mr-2" />
            Online ({onlineUsers.length})
          </div>
          <div className="space-y-1">
            {onlineUsers.slice(0, 3).map((user, i) => (
              <div key={i} className="flex items-center text-sm text-gray-300">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                {user}
              </div>
            ))}
            {onlineUsers.length > 3 && (
              <div className="text-xs text-gray-500">
                +{onlineUsers.length - 3} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rooms */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-400">Rooms</span>
            <button
              onClick={() => setShowAddRoom(!showAddRoom)}
              className="text-gray-400 hover:text-blue-400 transition-colors"
            >
              <FiPlus size={16} />
            </button>
          </div>

          {/* Add Room Form */}
          {showAddRoom && (
            <form onSubmit={handleAddRoom} className="mb-3">
              <div className="flex">
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="Room name"
                  className="flex-1 px-3 py-2 bg-gray-800 text-white text-sm rounded-l-lg border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-r-lg transition-colors"
                >
                  Add
                </button>
              </div>
            </form>
          )}

          {/* Room List */}
          <div className="space-y-1">
            {rooms.map((room, i) => (
              <div
                key={i}
                onClick={() => setRoom(room)}
                className={`flex items-center p-2 rounded-lg cursor-pointer transition-all ${
                  currentRoom === room 
                    ? "bg-blue-600 text-white" 
                    : "hover:bg-gray-800 text-gray-300"
                }`}
              >
                <FiHash className="mr-2 text-sm" />
                <span className="text-sm font-medium">{room}</span>
                {currentRoom === room && (
                  <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-400">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
            Online
          </div>
          <button className="text-gray-400 hover:text-white transition-colors">
            <FiSettings size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
