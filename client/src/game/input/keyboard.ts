import type { Controls } from '../contracts';
export function createKeyboard(onReset: () => void) {
  const keys = new Set<string>();
  const handled = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyR']);
  function down(event: KeyboardEvent) {
    if (!handled.has(event.code)) return;
    event.preventDefault();
    if (event.code === 'KeyR' && !event.repeat) onReset();
    keys.add(event.code);
  }
  function up(event: KeyboardEvent) { keys.delete(event.code); }
  function clear() { keys.clear(); }
  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  window.addEventListener('blur', clear);
  function controls(): Controls {
    const held = (...names: string[]) => names.some(name => keys.has(name)) ? 1 : 0;
    return { drive: held('KeyW', 'ArrowUp') - held('KeyS', 'ArrowDown'), steer: held('KeyD', 'ArrowRight') - held('KeyA', 'ArrowLeft') };
  }
  return { controls, clear, dispose() { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', clear); } };
}
