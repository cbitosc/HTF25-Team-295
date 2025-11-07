import React, { useState, useEffect } from "react";
import ChatRoom from "./components/ChatRoom";
import Sidebar from "./components/Sidebar";
import { SocketProvider } from "./context/SocketContext";

export default function App() {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [joined, setJoined] = useState(false);
  const [rooms, setRooms] = useState(["general", "math", "science", "programming"]);
  const [currentRoom, setCurrentRoom] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const joinRoom = () => {
    if (username.trim().length < 3) {
      alert("Username must be at least 3 characters!");
      return;
    }
    if (room.trim() === "") {
      alert("Please enter a room name");
      return;
    }
    setCurrentRoom(room);
    setJoined(true);
  };

  const handleRoomChange = (newRoom) => {
    setCurrentRoom(newRoom);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleAddRoom = (roomName) => {
    if (!rooms.includes(roomName)) {
      setRooms(prev => [...prev, roomName]);
      setCurrentRoom(roomName);
      if (isMobile) {
        setSidebarOpen(false);
      }
    }
  };

  if (!joined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        {/* Header */}
        <header className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-blue-400">StudySync 💬</h1>
              <div className="text-sm text-gray-400">
                Real-time Study Collaboration
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md">
            <div className="bg-gray-800/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-2xl border border-gray-700">
              <h2 className="text-xl sm:text-2xl font-semibold mb-6 text-center text-white">
                Join a Study Room
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full p-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Room Name
                  </label>
                  <input
                    type="text"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="Room name (ex: DAA, Math, Science)"
                    className="w-full p-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
                  />
                </div>

                <button
                  onClick={joinRoom}
                  className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 active:scale-95"
                >
                  Join Room
                </button>
              </div>

              {/* Popular Rooms */}
              <div className="mt-6">
                <p className="text-sm text-gray-400 mb-3">Popular Rooms:</p>
                <div className="flex flex-wrap gap-2">
                  {rooms.map((roomName) => (
                    <button
                      key={roomName}
                      onClick={() => setRoom(roomName)}
                      className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-full text-sm transition-colors"
                    >
                      #{roomName}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-gray-400 text-sm">
                Collaborate, Chat & Study Together 🚀
              </p>
              <div className="mt-4 flex justify-center space-x-6 text-xs text-gray-500">
                <span>💬 Real-time Chat</span>
                <span>📁 File Sharing</span>
                <span>😊 Emoji Reactions</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SocketProvider room={currentRoom}>
      <div className="h-screen bg-gray-950 text-white flex flex-col">
        {/* Mobile Header */}
        {isMobile && (
          <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-blue-400">#{currentRoom}</h1>
            <div className="w-6"></div>
          </div>
        )}

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className={`${isMobile ? (sidebarOpen ? 'fixed inset-0 z-50' : 'hidden') : 'block'} w-64 bg-gray-900 border-r border-gray-800`}>
            <Sidebar 
              rooms={rooms} 
              currentRoom={currentRoom} 
              setRoom={handleRoomChange}
              username={username}
              isMobile={isMobile}
              onClose={() => setSidebarOpen(false)}
              onAddRoom={handleAddRoom}
            />
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            <ChatRoom username={username} room={currentRoom} />
          </div>
        </div>
      </div>
    </SocketProvider>
  );
}

