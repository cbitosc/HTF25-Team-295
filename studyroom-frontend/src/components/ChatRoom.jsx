import React, { useState, useEffect, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import { FiSend, FiPaperclip } from "react-icons/fi";
import { BsEmojiSmile } from "react-icons/bs";
import Picker from "emoji-picker-react";
import axios from "axios";

export default function ChatRoom({ username, room }) {
  const socket = useSocket();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [file, setFile] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!socket) return;
    socket.emit("join_room", room);
    socket.on("receive_message", (msg) => setMessages((prev) => [...prev, msg]));
    return () => socket.off("receive_message");
  }, [socket, room]);

  const sendMessage = () => {
    if (message.trim()) {
      const msgData = { username, content: message, room };
      socket.emit("send_message", msgData);
      setMessages((prev) => [...prev, msgData]);
      setMessage("");
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const sendFile = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("room", room);
    formData.append("username", username);

    try {
      const res = await axios.post("http://localhost:8000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const fileUrl = res.data.file_url;
      const msgData = {
        username,
        room,
        content: `📎 Shared: ${file.name}`,
        fileUrl,
      };

      socket.emit("send_message", msgData);
      setMessages((prev) => [...prev, msgData]);
      setFile(null);
    } catch (err) {
      console.error("File upload failed:", err);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-100 font-sans">
      {/* Top Bar */}
      <div className="px-4 py-3 flex justify-between items-center border-b border-gray-800 bg-gray-900">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-blue-400">Study Room</h1>
          <p className="text-sm text-gray-400">#{room}</p>
        </div>
        <span className="text-sm text-gray-400">👤 {username}</span>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-gray-500 text-center mt-8 text-sm sm:text-base">
            No messages yet. Start the discussion! 💬
          </p>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.username === username ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] sm:max-w-[65%] px-4 py-2 rounded-2xl shadow-md break-words ${
                m.username === username
                  ? "bg-blue-600 text-white rounded-br-none"
                  : "bg-gray-800 text-gray-100 rounded-bl-none"
              }`}
            >
              {m.username !== username && (
                <p className="text-xs text-gray-400 mb-1">{m.username}</p>
              )}
              <p className="text-sm sm:text-base">{m.content}</p>

              {m.fileUrl && (
                <div className="mt-2">
                  {m.fileUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                    <img
                      src={m.fileUrl}
                      alt="shared"
                      className="max-w-[150px] sm:max-w-[200px] rounded-lg border border-gray-700"
                    />
                  ) : (
                    <a
                      href={m.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 underline text-sm"
                    >
                      View File
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-800 bg-gray-900 px-3 sm:px-4 py-3">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            className="text-gray-400 hover:text-yellow-400 transition-colors"
            onClick={() => setShowEmoji(!showEmoji)}
          >
            <BsEmojiSmile size={22} />
          </button>

          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-full text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type a message..."
          />

          <label className="cursor-pointer text-gray-400 hover:text-green-400">
            <FiPaperclip size={22} />
            <input type="file" className="hidden" onChange={handleFileChange} />
          </label>

          <button
            onClick={file ? sendFile : sendMessage}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-full flex items-center gap-1 sm:gap-2 text-sm sm:text-base"
          >
            <FiSend /> {file ? "Upload" : "Send"}
          </button>
        </div>

        {showEmoji && (
          <div className="mt-2">
            <Picker
              onEmojiClick={(e) => setMessage((prev) => prev + e.emoji)}
              theme="dark"
              width="100%"
            />
          </div>
        )}
      </div>
    </div>
  );
}
