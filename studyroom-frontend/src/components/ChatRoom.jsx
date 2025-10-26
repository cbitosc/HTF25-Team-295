import React, { useState, useEffect, useRef } from "react";
import { FiSend, FiPaperclip, FiMoreVertical, FiUsers, FiWifi, FiWifiOff, FiTrash2 } from "react-icons/fi";
import { BsEmojiSmile } from "react-icons/bs";
import Picker from "emoji-picker-react";
import axios from "axios";

// Component to highlight @mentions
function MessageWithMentions({ text, mentions, currentUser }) {
  if (!text || !mentions) return <p className="text-sm whitespace-pre-wrap">{text}</p>;
  
  const parts = text.split(/(@\w+)/g);
  return (
    <p className="text-sm whitespace-pre-wrap">
      {parts.map((part, i) => {
        if (part.startsWith('@') && mentions.includes(part.substring(1))) {
          return (
            <span key={i} className="font-semibold text-yellow-400">
              {part}
            </span>
          );
        }
        return part;
      })}
    </p>
  );
}

export default function ChatRoom({ username, room }) {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [file, setFile] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showOnlineUsers, setShowOnlineUsers] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showDeleteIcon, setShowDeleteIcon] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  // Debug: Log admin status changes
  useEffect(() => {
    console.log("🔑 Admin status changed to:", isAdmin);
  }, [isAdmin]);

  // Fetch chat history on mount
  useEffect(() => {
    fetchChatHistory();
  }, [room]);

  const fetchChatHistory = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/chat/history/${room}`);
      if (res.data.messages && res.data.messages.length > 0) {
        setMessages(res.data.messages);
      }
    } catch (err) {
      console.error("Failed to fetch chat history:", err);
    }
  };

  // connect to backend websocket
  useEffect(() => {
    if (!username || !room) {
      console.log("❌ Missing username or room:", { username, room });
      return;
    }
    
    const wsUrl = `ws://localhost:8000/chat/ws/${room}?username=${encodeURIComponent(username)}`;
    console.log("🔌 Connecting to WebSocket:", wsUrl);
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log("✅ Connected to WebSocket:", room, "as", username);
      setIsConnected(true);
    };
    
    ws.onclose = () => {
      console.log("❌ Disconnected from WebSocket");
      setIsConnected(false);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === "typing") {
          setTypingUsers(prev => {
            const filtered = prev.filter(user => user !== data.username);
            return [...filtered, data.username];
          });
        } else if (data.type === "stop_typing") {
          setTypingUsers(prev => prev.filter(user => user !== data.username));
        } else if (data.type === "user_joined" || data.type === "user_left") {
          // Update online users list
          if (data.online_users) {
            setOnlineUsers(data.online_users);
          }
          setMessages((prev) => [...prev, data]);
        } else if (data.type === "online_users") {
          // Update online users list without adding to messages
          if (data.online_users) {
            setOnlineUsers(data.online_users);
          }
        } else if (data.type === "history") {
          // Load chat history
          if (data.messages && data.messages.length > 0) {
            setMessages(data.messages);
          }
        } else if (data.type === "admin_status") {
          // User is admin
          console.log("🎉 Admin status received:", data.is_admin);
          setIsAdmin(data.is_admin);
        } else if (data.type === "message_deleted") {
          // Remove deleted message from UI
          setMessages(prev => prev.filter(m => m.id !== data.message_id));
        } else if (data.type === "error") {
          alert(data.message);
        } else {
          setMessages((prev) => [...prev, data]);
        }
      } catch (e) {
        console.error("Invalid message format:", e);
      }
    };

    setSocket(ws);
    
    // Cleanup function
    return () => {
      // Clear typing indicators when leaving room
      setTypingUsers([]);
      setIsTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      ws.close();
    };
  }, [room, username]);

  // auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle typing indicator
  const handleTyping = (e) => {
    setMessage(e.target.value);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // If input is empty, stop typing immediately
    if (!e.target.value.trim()) {
      if (isTyping) {
        setIsTyping(false);
        if (socket) {
          socket.send(JSON.stringify({ type: "stop_typing", username }));
        }
      }
      return;
    }
    
    // Only send typing indicator if there's actual content and we're not already typing
    if (!isTyping) {
      setIsTyping(true);
      if (socket) {
        socket.send(JSON.stringify({ type: "typing", username }));
      }
    }
    
    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      // Send stop typing indicator
      if (socket) {
        socket.send(JSON.stringify({ type: "stop_typing", username }));
      }
    }, 2000); // 2 seconds after stopping typing
  };

  const sendMessage = () => {
    if (!socket || !message.trim()) return;
    
    // Clear typing indicator immediately when sending
    if (isTyping) {
      setIsTyping(false);
      if (socket) {
        socket.send(JSON.stringify({ type: "stop_typing", username }));
      }
    }
    
    // Clear any pending typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
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

      // Send file information through WebSocket
      const msg = JSON.stringify({
        username,
        message: `📎 Shared: ${file.name}`,
        file_url: fileUrl,
        filename: file.name,
        file_type: file.type,
        file_size: file.size,
      });
      socket.send(msg);
      setFile(null);
    } catch (err) {
      console.error("File upload failed:", err);
      alert("File upload failed. Please try again.");
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const deleteMessage = (messageId) => {
    console.log("Delete message clicked, ID:", messageId, "Socket:", socket, "IsAdmin:", isAdmin);
    if (socket && messageId) {
      socket.send(JSON.stringify({
        type: "delete_message",
        username: username,
        message_id: messageId
      }));
      // Remove message from UI
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } else {
      console.log("Cannot delete - missing socket or messageId");
    }
  };

  const handleMessageDeleted = (messageId) => {
    setMessages(prev => prev.filter(m => m.id !== messageId));
  };

  const muteUser = (targetUsername) => {
    if (socket && isAdmin) {
      socket.send(JSON.stringify({
        type: "mute_user",
        username: username,
        target_username: targetUsername
      }));
    }
  };

  const unmuteUser = (targetUsername) => {
    if (socket && isAdmin) {
      socket.send(JSON.stringify({
        type: "unmute_user",
        username: username,
        target_username: targetUsername
      }));
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 text-gray-100 font-sans w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-gray-800 bg-gray-900">
        <div className="flex items-center space-x-3">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-blue-400">#{room}</h2>
            <p className="text-xs sm:text-sm text-gray-400">Collaborate & Chat in real-time</p>
          </div>
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <FiWifi className="text-green-400" size={16} />
            ) : (
              <FiWifiOff className="text-red-400" size={16} />
            )}
            <button
              onClick={() => setShowOnlineUsers(!showOnlineUsers)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <FiUsers size={16} />
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-400 hidden sm:block">👤 {username}</span>
          <button className="text-gray-400 hover:text-white transition-colors">
            <FiMoreVertical size={16} />
          </button>
        </div>
      </div>

      {/* Online Users Panel */}
      {showOnlineUsers && (
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Online Users</span>
            <button
              onClick={() => setShowOnlineUsers(false)}
              className="text-gray-400 hover:text-white"
            >
              ×
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {onlineUsers.length > 0 ? (
              onlineUsers.map((user, i) => (
                <div key={i} className="flex items-center bg-gray-700 px-2 py-1 rounded-full text-xs">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                  {user}
                  {isAdmin && user !== username && (
                    <>
                      <button 
                        onClick={() => muteUser(user)}
                        className="ml-2 text-red-400 hover:text-red-300"
                        title="Mute user"
                      >
                        🔇
                      </button>
                      <button 
                        onClick={() => unmuteUser(user)}
                        className="ml-1 text-green-400 hover:text-green-300"
                        title="Unmute user"
                      >
                        🔊
                      </button>
                    </>
                  )}
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-sm">No users online</div>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center mt-10">
            <div className="text-6xl mb-4">💬</div>
            <p className="text-gray-500 text-lg">No messages yet</p>
            <p className="text-gray-600 text-sm">Start chatting to begin the conversation</p>
          </div>
        )}

        {messages.map((m, i) => (
          <div 
            key={m.id || i} 
            className={`flex ${m.username === username ? "justify-end" : "justify-start"} relative group`}
          >
            <div className={`max-w-[85%] sm:max-w-[70%] ${m.username === username ? "flex flex-col items-end" : "flex flex-col items-start"}`}>
              {m.username && m.username !== username && (
                <div className="flex items-center mb-1">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold mr-2">
                    {m.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs text-gray-400">{m.username}</span>
                </div>
              )}
              
              <div
                className={`px-4 py-2 rounded-2xl shadow-lg relative ${
                  m.username === username
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-gray-800 text-gray-100 rounded-bl-none"
                }`}
                onMouseEnter={() => {
                  if (isAdmin && m.type !== "system") {
                    setShowDeleteIcon(m.id || m.message_id || i);
                  }
                }}
                onMouseLeave={() => setShowDeleteIcon(null)}
              >
                {/* Delete button for admins - show on hover */}
                {isAdmin && m.type !== "system" && showDeleteIcon === (m.id || m.message_id || i) && (m.id || m.message_id) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      console.log("Deleting message with ID:", m.id || m.message_id);
                      deleteMessage(m.id || m.message_id);
                    }}
                    className="absolute -top-1 -right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 z-50 cursor-pointer shadow-lg"
                    title="Delete message"
                    style={{ zIndex: 9999 }}
                  >
                    <FiTrash2 size={12} />
                  </button>
                )}
                {m.type === "system" ? (
                  <div className="text-center">
                    <p className="text-sm italic text-gray-400">{m.message}</p>
                  </div>
                ) : (
                  <div>
                    {/* Highlight mentions */}
                    <MessageWithMentions text={m.message} mentions={m.mentions} currentUser={username} />
                    <p className="text-xs opacity-70 mt-1">
                      {formatTime(m.timestamp)}
                      {m.mentions && m.mentions.includes(username) && (
                        <span className="ml-2 text-yellow-400">🔔 You were mentioned</span>
                      )}
                    </p>
                  </div>
                )}

                {/* Handle file attachments */}
                {m.file_url && (
                  <div className="mt-2">
                    {/* Image files */}
                    {m.file_type && m.file_type.startsWith('image/') ? (
                      <img
                        src={m.file_url}
                        alt={m.filename || 'shared'}
                        className="max-w-[200px] sm:max-w-[250px] rounded-lg border border-gray-700 cursor-pointer"
                        onClick={() => window.open(m.file_url, '_blank')}
                      />
                    ) : m.file_url && m.file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <img
                        src={m.file_url}
                        alt={m.filename || 'shared'}
                        className="max-w-[200px] sm:max-w-[250px] rounded-lg border border-gray-700 cursor-pointer"
                        onClick={() => window.open(m.file_url, '_blank')}
                      />
                    ) : (
                      <a
                        href={m.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm underline"
                      >
                        <span>📎</span>
                        <span>{m.filename || 'Download File'}</span>
                        {m.file_size && (
                          <span className="text-xs text-gray-400">
                            ({(m.file_size / 1024).toFixed(1)} KB)
                          </span>
                        )}
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Typing Indicator - Don't show for current user */}
        {typingUsers.filter(user => user !== username).length > 0 && (
          <div className="flex justify-start">
            <div className="bg-gray-800 px-4 py-2 rounded-2xl rounded-bl-none">
              <p className="text-sm text-gray-400 italic">
                {typingUsers.filter(user => user !== username).join(", ")} {typingUsers.filter(user => user !== username).length === 1 ? "is" : "are"} typing...
              </p>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Section */}
      <div className="border-t border-gray-800 bg-gray-900 px-4 sm:px-6 py-3">
        {file && (
          <div className="mb-3 p-2 bg-gray-800 rounded-lg flex items-center justify-between">
            <span className="text-sm text-gray-300">📎 {file.name}</span>
            <button
              onClick={() => setFile(null)}
              className="text-gray-400 hover:text-white"
            >
              ×
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            className="text-gray-400 hover:text-yellow-400 transition-colors p-2"
            onClick={() => setShowEmoji(!showEmoji)}
          >
            <BsEmojiSmile size={20} />
          </button>

          <div className="flex-1 relative">
            <input
              type="text"
              value={message}
              onChange={handleTyping}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              className="w-full bg-gray-800 text-white px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-700"
              placeholder="Type your message..."
            />
          </div>

          <label className="cursor-pointer text-gray-400 hover:text-green-400 transition-colors p-2">
            <FiPaperclip size={20} />
            <input type="file" className="hidden" onChange={handleFileChange} />
          </label>

          <button
            onClick={file ? sendFile : sendMessage}
            disabled={!message.trim() && !file}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded-full flex items-center gap-2 font-medium transition-all transform hover:scale-105 active:scale-95"
          >
            <FiSend size={16} />
            <span className="hidden sm:inline">{file ? "Upload" : "Send"}</span>
          </button>
        </div>

        {showEmoji && (
          <div className="mt-3">
            <Picker
              onEmojiClick={(e) => setMessage((prev) => prev + e.emoji)}
              theme="dark"
              width="100%"
              height={300}
            />
          </div>
        )}
      </div>
    </div>
  );
}
