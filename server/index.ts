import { WebSocketServer } from 'ws';
import type { ClientMessage, ServerMessage } from '../shared/sharedTypes';
import { clientMessageSchema } from '../shared/sharedTypes';

const port = Number(process.env.PORT ?? 8080)
const wss = new WebSocketServer({ port, host:'0.0.0.0' });

let _nextId = 0;
function createId() {
  return `${_nextId++}`;
}

const state: Record<string, { name?: string }> = {}

wss.on('connection', (socket) => {
  let userId: string;

  function sendMessage(message: ServerMessage) {
    const jsonStr = JSON.stringify(message)
    socket.send(jsonStr)
  }

  function broadcastMessage(message: ServerMessage) {
    const jsonStr = JSON.stringify(message)
    wss.clients.forEach(s => {
      s.send(jsonStr)
    })
  }

  function broadcastState() {
    broadcastMessage({
      type: 'PLAYERS_UPDATED', data: {
        players: Object.values(state)
      }
    })
  }

  function handleMessage({ type, data }: ClientMessage) {
    if (!userId) {
      return
    }
    switch (type) {
      case 'SET_NAME': {
        state[userId].name = data.name
        sendMessage({ type: 'USER_UPDATED', data: { userState: state[userId] } })
      }
    }
  }

  userId = createId();
  state[userId] = {}

  sendMessage({
    type: 'CONNECTION_SUCCESSFUL',
    data: { userId, userState: state[userId] }
  });
  broadcastState()


  socket.on('message', (data) => {
    let input: unknown;
    try {
      input = JSON.parse(data.toString());
    } catch {
      sendMessage({
        type: 'ERROR',
        data: { code: 'INVALID_JSON', message: 'Message must contain valid JSON.' },
      });
      return;
    }

    const result = clientMessageSchema.safeParse(input);
    if (!result.success) {
      sendMessage({
        type: 'ERROR',
        data: {
          code: 'INVALID_MESSAGE',
          message: 'Invalid client message.',
          issues: result.error.issues.map((issue) => ({
            path: issue.path.map(String).join('.'),
            message: issue.message,
          })),
        },
      });
      return;
    }

    handleMessage(result.data)
    broadcastState()
  });

  socket.on('close', () => {
    // TODO handle disconnects
    delete state[userId]
    broadcastState()
    console.log('Client disconnected');
  });
});

wss.on('listening', () => {
  const address = wss.address();
  console.log(`WebSocket server listening on port ${typeof address === 'object' && address ? address.port : port}`);
});
