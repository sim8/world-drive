import { useEffect, useRef, useState } from 'react';

export function useSocket(enabled: boolean) {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const socket = new WebSocket('ws://localhost:8080');
    socketRef.current = socket;

    socket.addEventListener('open', () => {
      setConnected(true);
      console.log('Connected to server!');
    });
    socket.addEventListener('message', (event) => {
      console.log('Server says:', event.data);
    });
    socket.addEventListener('close', () => {
      setConnected(false);
      console.log('Disconnected');
    });

    return () => {
      socketRef.current = null;
      socket.close();
    };
  }, [enabled]);

  function sendMessage(message: string) {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(message);
    }
  }

  return { connected, sendMessage };
}
