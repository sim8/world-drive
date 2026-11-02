import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createRoot } from 'react-dom/client';
import { useSocket } from './useSocket';
import './style.css';

function App() {
  const [name, setName] = useState('');
  const { connected, sendMessage, userState, setName: setUserName } = useSocket();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (userState && !userState.name?.trim()) {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.close();
    }
  }, [userState]);

  function start(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    setUserName(trimmedName);
  }

  return (
    <main>
      <dialog ref={dialogRef} aria-labelledby="name-title" onCancel={(event) => event.preventDefault()}>
        <form onSubmit={start}>
          <h1 id="name-title">Enter name</h1>
          <label htmlFor="name">Name</label>
          <input id="name" value={name} onChange={(event) => setName(event.target.value)} autoFocus required />
          <button type="submit" disabled={!name.trim() || !connected}>Continue</button>
        </form>
      </dialog>
      {userState?.name && <button onClick={() => setName('Hello from the browser!')} disabled={!connected}>Send message</button>}
    </main>
  );
}

const root = document.getElementById('root');
if (!root) throw new Error('Missing root element');
createRoot(root).render(<App />);
