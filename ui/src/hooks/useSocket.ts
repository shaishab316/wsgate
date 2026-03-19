import { useState, useRef } from "react";
import { io, Socket } from "socket.io-client";

export type SocketStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

export function useSocket() {
  const [status, setStatus] = useState<SocketStatus>("disconnected");
  const socketRef = useRef<Socket | null>(null);

  function connect(url: string, token: string) {
    setStatus("connecting");

    const socket = io(url, {
      auth: token ? { token } : {},
      transports: ["websocket"],
    });

    socket.on("connect", () => setStatus("connected"));
    socket.on("disconnect", () => setStatus("disconnected"));
    socket.on("connect_error", () => setStatus("error"));

    socketRef.current = socket;
  }

  function disconnect() {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setStatus("disconnected");
  }

  function emit(event: string, payload: unknown) {
    socketRef.current?.emit(event, payload);
  }

  return { status, connect, disconnect, emit, socket: socketRef.current };
}
