import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });


wss.on('connection', (socket) => {

  socket.send('Welcome to the server!');

  socket.on('message', (data) => {
    console.log('Received:', data.toString());

    socket.send(`Echo: ${data.toString()}`);
  });

  socket.on('close', () => {
    console.log('Client disconnected');
  });
});

console.log('WebSocket server listening on port 8080');