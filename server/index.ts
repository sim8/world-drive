import { WebSocketServer } from 'ws';
import type { ClientMessage, ServerMessage } from '../shared/sharedTypes';

const wss = new WebSocketServer({ port: 8080 });

let _nextId = 0;
function createId() {
  return `${_nextId++}`;
}

const state: Record<string, { name?: string }> = {}

wss.on('connection', (socket) => {

  function sendMessage(message: ServerMessage) {
    const jsonStr = JSON.stringify(message)
    socket.send(jsonStr)
  }

  function handleMessage({ type, userId, data }: ClientMessage) {
    if (!state[userId]) {
      return
    }
    switch (type) {
      case 'SET_NAME': {
        state[userId].name = data.name
      }
    }
  }

  const userId = createId();
  state[userId] = {}

  sendMessage({
    type: 'CONNECTION_SUCCESSFUL',
    data: { userId, userState: state[userId] }
  });

  socket.on('message', (data) => {
    const dataStr = data.toString();
    const clientMessage: ClientMessage = JSON.parse(dataStr);
    handleMessage(clientMessage)

    sendMessage({
      type: 'ECHO',
      data: { message: data.toString() }
    });
  });

  socket.on('close', () => {
    console.log('Client disconnected');
  });
});

console.log('WebSocket server listening on port 8080');
