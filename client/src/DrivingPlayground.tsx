import { useEffect, useRef, useState } from 'react';
import { createPlayground } from './game/runtime/playground';

export function DrivingPlayground() {
  const host = useRef<HTMLDivElement>(null);
  const game = useRef<Awaited<ReturnType<typeof createPlayground>> | null>(null);
  const [status, setStatus] = useState('Loading playground…');
  const [speed, setSpeed] = useState(0);
  useEffect(() => {
    let cancelled = false;
    if (!host.current) return;
    createPlayground(host.current, setSpeed).then(instance => {
      if (cancelled) { instance.dispose(); return; }
      game.current = instance; setStatus('');
    }).catch(error => { if (!cancelled) { console.error(error); setStatus('Could not start the playground. Try refreshing the page.'); } });
    return () => { cancelled = true; game.current?.dispose(); game.current = null; };
  }, []);
  return <main className="playground">
    <div className="game-canvas" ref={host} aria-label="Driving playground" />
    <div className="game-overlay">
      <div className="game-title"><strong>WORLD DRIVE</strong><span>DRIVING PLAYGROUND</span></div>
      {status && <p className="game-status" role="status">{status}</p>}
      <div className="game-bottom"><div className="game-controls"><strong>W / ↑</strong> accelerate <strong>S / ↓</strong> brake / reverse <strong>A D / ← →</strong> steer <strong>R</strong> reset<br /><a href="/lobby">Multiplayer lobby</a></div>
        <div className="game-speed"><strong>{Math.round(Math.abs(speed) * 3.6)}</strong><span>KM/H<br />{speed < -0.5 ? 'REVERSE' : 'DRIVE'}</span></div></div>
      <button className="reset-button" type="button" onClick={() => game.current?.reset()}>Reset car</button>
    </div>
  </main>;
}
