import React, { createContext, useContext, useEffect, useRef, useState } from "react";

const SocketContext = createContext();
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ room, children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!room) return;

    const ws = new WebSocket(`ws://localhost:8000/chat/ws/${room}`);
    
    ws.onopen = () => {
      console.log("✅ Connected to WebSocket room:", room);
      setIsConnected(true);
    };
    
    ws.onclose = () => {
      console.log("❌ Disconnected from WebSocket");
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };

    setSocket(ws);
    socketRef.current = ws;

    return () => {
      ws.close();
      setIsConnected(false);
    };
  }, [room]);

  const sendMessage = (message) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  };

  const value = {
    socket,
    isConnected,
    sendMessage
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
