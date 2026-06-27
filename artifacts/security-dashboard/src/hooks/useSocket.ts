import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../contexts/AuthContext";
import type { TrafficPoint, Threat, ActivityItem } from "@workspace/api-client-react";

interface SocketEvents {
  traffic_update: (data: TrafficPoint) => void;
  new_threat: (data: Threat) => void;
  alert: (data: ActivityItem) => void;
}

export function useSocket() {
  const { token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    const newSocket = io({
      path: '/api/socket.io',
      transports: ['websocket', 'polling'],
      auth: { token }
    });

    newSocket.on("connect", () => setIsConnected(true));
    newSocket.on("disconnect", () => setIsConnected(false));

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token]);

  return { socket, isConnected };
}
