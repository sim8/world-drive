import { createKeyboard } from '../input/keyboard';
import { FIXED_DT } from '../physics/vehiclePhysics';
import { createView } from '../rendering/view';
import { createSimulation } from '../simulation/simulation';

export async function createPlayground(container: HTMLElement, onSpeed: (speed: number) => void) {
  const simulation = await createSimulation();
  let view: ReturnType<typeof createView>;
  try { view = createView(container); } catch (error) { simulation.dispose(); throw error; }
  let previous = simulation.state(), current = previous;
  let lastTime: number | undefined, accumulator = 0, hudTime = 0, snap = true;
  let resetRequested = false;
  const keyboard = createKeyboard(() => { resetRequested = true; });
  function visibility() { keyboard.clear(); lastTime = undefined; accumulator = 0; }
  document.addEventListener('visibilitychange', visibility);
  window.addEventListener('blur', visibility);
  let frame = 0;
  function tick(time: number) {
    if (document.hidden || !document.hasFocus()) { lastTime = undefined; accumulator = 0; frame = requestAnimationFrame(tick); return; }
    const elapsed = lastTime === undefined ? 0 : Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time; accumulator += elapsed;
    if (resetRequested) { simulation.reset(); previous = current = simulation.state(); keyboard.clear(); resetRequested = false; accumulator = 0; snap = true; }
    let steps = 0;
    while (accumulator >= FIXED_DT && steps < 6) { previous = current; simulation.step(keyboard.controls()); current = simulation.state(); accumulator -= FIXED_DT; steps++; }
    view.render(previous, current, accumulator / FIXED_DT, elapsed, snap); snap = false;
    hudTime += elapsed; if (hudTime >= 0.1) { onSpeed(current.speed); hudTime = 0; }
    frame = requestAnimationFrame(tick);
  }
  frame = requestAnimationFrame(tick);
  return { reset: () => { resetRequested = true; }, dispose() { cancelAnimationFrame(frame); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('blur', visibility); keyboard.dispose(); view.dispose(); simulation.dispose(); } };
}
