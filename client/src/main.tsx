import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createRoot } from 'react-dom/client';
import { useSocket } from './useSocket';
import { nameSchema } from '../../shared/sharedTypes';
import { DrivingPlayground } from './DrivingPlayground';
import './style.css';

function Lobby() {
  const [name, setName] = useState('');
  const { connected, playerState, userState, setName: setUserName, error } = useSocket();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const nameValidation = nameSchema.safeParse(name);
  const nameError = name.length > 0 && !nameValidation.success
    ? nameValidation.error.issues[0].message
    : undefined;
  const displayedError = nameError || error;

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
    if (!nameValidation.success) return;
    setUserName(nameValidation.data);
  }

  return (
    <main>
      <dialog ref={dialogRef} aria-labelledby="name-title" onCancel={(event) => event.preventDefault()}>
        <form onSubmit={start}>
          <h1 id="name-title">Enter name</h1>
          <label htmlFor="name">Name</label>
          <input id="name" value={name} onChange={(event) => setName(event.target.value)}
            aria-invalid={!!displayedError} aria-describedby={displayedError ? 'name-error' : undefined}
            autoFocus required />
          {displayedError && <p id="name-error" role="alert">{displayedError}</p>}
          <button type="submit" disabled={!nameValidation.success || !connected}>Continue</button>
        </form>
      </dialog>
      {userState?.name && <h1>Welcome, {userState.name}!</h1>}
      <p><a href="/">Back to driving</a></p>
      <h2>Connected players</h2>
      <ul>
        {playerState?.map(player => <li>{player.name ?? "(No name)"}</li>)}
      </ul>
    </main>
  );
}

const root = document.getElementById('root');
if (!root) throw new Error('Missing root element');
createRoot(root).render(window.location.pathname === '/lobby' ? <Lobby /> : <DrivingPlayground />);
