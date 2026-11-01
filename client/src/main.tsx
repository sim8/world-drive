import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createRoot } from 'react-dom/client';
import { useSocket } from './useSocket';
import './style.css';

function App() {
  const [name, setName] = useState('');
  const [submittedName, setSubmittedName] = useState('');
  const { connected, sendMessage } = useSocket(Boolean(submittedName));
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  function start(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    setSubmittedName(trimmedName);
    dialogRef.current?.close();
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
      {submittedName && <button onClick={() => sendMessage('Hello from the browser!')} disabled={!connected}>Send message</button>}
    </main>
  );
}

const root = document.getElementById('root');
if (!root) throw new Error('Missing root element');
createRoot(root).render(<App />);
