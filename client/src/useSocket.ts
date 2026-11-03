import { useEffect, useRef, useState } from 'react';
import type { ClientMessage, ServerMessage, UserState } from '../../shared/sharedTypes';

const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL;

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const [userId, setUserId] = useState<string>()
  const [userState, setUserState] = useState<UserState>();
  const [playerState, setPlayerState] = useState<UserState[]>();

  function handleMessage({ type, data }: ServerMessage) {
    switch (type) {
      case 'CONNECTION_SUCCESSFUL':
        setUserId(data.userId)
        setUserState(data.userState);
        console.log('got my ID!', data.userId)
        return
      case 'PLAYERS_UPDATED':
        setPlayerState(data.players);
        return
    }
  }

  useEffect(() => {
    const socket = new WebSocket(WEBSOCKET_URL);
    socketRef.current = socket;

    socket.addEventListener('open', () => {
      setConnected(true);
      console.log('Connected to server!');
    });
    socket.addEventListener('message', (event) => {
      const message: ServerMessage = JSON.parse(event.data);
      handleMessage(message)
    });
    socket.addEventListener('close', () => {
      setConnected(false);
      console.log('Disconnected');
    });

    return () => {
      socketRef.current = null;
      socket.close();
    };
  }, []);

  function sendMessage(message: ClientMessage) {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      const messageStr = JSON.stringify(message)
      socketRef.current.send(messageStr);
    }
  }

  function setName(name: string) {
    const trimmedName = name.trim();
    if (!trimmedName || !userId || socketRef.current?.readyState !== WebSocket.OPEN) return;

    sendMessage({
      type: 'SET_NAME',
      data: { name: trimmedName },
    })
    setUserState((current) => ({ ...current, name: trimmedName }));
  }

  return { connected, sendMessage, userState, playerState, setName };
}
