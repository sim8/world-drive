import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

function App() {
  const [name, setName] = useState('');
  const [submittedName, setSubmittedName] = useState('');
  const [connected, setConnected] = useState(false);
  const dialogRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    dialogRef.current.showModal();
  }, []);

  useEffect(() => {
    if (!submittedName) return;

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
  }, [submittedName]);

  function start(event) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    setSubmittedName(trimmedName);
    dialogRef.current.close();
  }

  function sendMessage() {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send('Hello from the browser!');
    }
  }

  return (
    <main>
      <dialog ref={dialogRef} aria-labelledby="name-title" onCancel={(event) => event.preventDefault()}>
        <form onSubmit={start}>
          <h1 id="name-title">Enter name</h1>
          <label htmlFor="name">Name</label>
          <input id="name" value={name} onChange={(event) => setName(event.target.value)} autoFocus required />
          <button type="submit" disabled={!name.trim()}>Continue</button>
        </form>
      </dialog>
      {submittedName && <button onClick={sendMessage} disabled={!connected}>Send message</button>}
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
