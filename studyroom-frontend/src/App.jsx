import React, { useState } from "react";
import ChatRoom from "./components/ChatRoom";
import { SocketProvider } from "./context/SocketContext";

export default function App() {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [joined, setJoined] = useState(false);

  const joinRoom = () => {
    if (username.trim().length < 3) {
      alert("Username must be at least 3 characters!");
      return;
    }
    if (room.trim() === "") {
      alert("Please enter a room name");
      return;
    }
    setJoined(true);
  };

  if (!joined) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white px-6">
        <h1 className="text-4xl font-bold text-blue-400 mb-8">StudySync 💬</h1>

        <div className="bg-gray-800 p-8 rounded-2xl shadow-lg w-full max-w-md">
          <h2 className="text-2xl font-semibold mb-6 text-center">Join a Study Room</h2>

          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            className="w-full mb-4 p-3 rounded-lg text-black outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="text"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            placeholder="Room name (ex: DAA)"
            className="w-full mb-6 p-3 rounded-lg text-black outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={joinRoom}
            className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded-lg font-semibold text-lg transition-all"
          >
            Join Room
          </button>
        </div>

        <p className="mt-6 text-gray-400 text-sm">
          Collaborate, Chat & Study Together 🚀
        </p>
      </div>
    );
  }

  return (
    <SocketProvider>
      <ChatRoom username={username} room={room} />
    </SocketProvider>
  );
}

