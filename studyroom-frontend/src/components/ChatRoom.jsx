import React, { useState, useEffect, useRef } from "react";
import { FiSend, FiPaperclip } from "react-icons/fi";
import { BsEmojiSmile } from "react-icons/bs";
import Picker from "emoji-picker-react";
import axios from "axios";

export default function ChatRoom({ username, room }) {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [file, setFile] = useState(null);
  const messagesEndRef = useRef(null);

  // connect to backend websocket
  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8000/chat/ws/${room}`);
    ws.onopen = () => console.log("✅ Connected to WebSocket:", room);
    ws.onclose = () => console.log("❌ Disconnected from WebSocket");

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setMessages((prev) => [...prev, data]);
      } catch (e) {
        console.error("Invalid message format:", e);
      }
    };

    setSocket(ws);
    return () => ws.close();
  }, [room]);

  // auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!socket || !message.trim()) return;
    const msg = JSON.stringify({ username, message });
    socket.send(msg);
    setMessage("");
  };

  const handleFileChange = (e) => setFile(e.target.files[0]);

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

      const msg = JSON.stringify({
        username,
        message: `📎 Shared: ${file.name} (${fileUrl})`,
      });
      socket.send(msg);
      setFile(null);
    } catch (err) {
      console.error("File upload failed:", err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 text-gray-100 font-sans w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-800 bg-gray-900">
        <div>
          <h2 className="text-xl font-semibold text-blue-400">#{room}</h2>
          <p className="text-sm text-gray-400">Collaborate & Chat in real-time</p>
        </div>
        <span className="text-sm text-gray-400">👤 {username}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-gray-500 text-center mt-10">No messages yet. Start chatting 💬</p>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.username === username ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[70%] px-4 py-2 rounded-2xl shadow ${
                m.username === username
                  ? "bg-blue-600 text-white rounded-br-none"
                  : "bg-gray-800 text-gray-100 rounded-bl-none"
              }`}
            >
              {m.username && m.username !== username && (
                <p className="text-xs text-gray-400 mb-1">{m.username}</p>
              )}

              {m.type === "system" ? (
                <p className="text-sm italic text-gray-400">{m.message}</p>
              ) : (
                <p className="text-sm">{m.message}</p>
              )}

              {/* Handle embedded file links */}
              {m.message && m.message.includes("http://localhost:8000") && (
                <div className="mt-2">
                  {m.message.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                    <img
                      src={m.message.match(/http:\/\/localhost:8000\S+/)[0]}
                      alt="shared"
                      className="max-w-[250px] rounded-lg border border-gray-700"
                    />
                  ) : (
                    <a
                      href={m.message.match(/http:\/\/localhost:8000\S+/)[0]}
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

      {/* Input Section */}
      <div className="border-t border-gray-800 bg-gray-900 px-6 py-3">
        <div className="flex items-center gap-3">
          <button
            className="text-gray-400 hover:text-yellow-400"
            onClick={() => setShowEmoji(!showEmoji)}
          >
            <BsEmojiSmile size={22} />
          </button>

          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type your message..."
          />

          <label className="cursor-pointer text-gray-400 hover:text-green-400">
            <FiPaperclip size={22} />
            <input type="file" className="hidden" onChange={handleFileChange} />
          </label>

          <button
            onClick={file ? sendFile : sendMessage}
            className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-full flex items-center gap-2 font-medium"
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
