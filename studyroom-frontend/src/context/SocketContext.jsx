import React, { createContext, useContext, useEffect, useRef, useState } from "react";

const SocketContext = createContext();
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ room, children }) => {
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!room) return;

    const ws = new WebSocket(`ws://localhost:8000/chat/ws/${room}`);
    ws.onopen = () => console.log("✅ Connected to WebSocket room:", room);
    ws.onclose = () => console.log("❌ Disconnected from WebSocket");
    setSocket(ws);
    socketRef.current = ws;

    return () => {
      ws.close();
    };
  }, [room]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
