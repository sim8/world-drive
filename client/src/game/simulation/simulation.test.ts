import { describe, expect, it } from 'vitest';
import { createSimulation } from './simulation';
import { ZERO_CONTROLS } from '../contracts';
import { handling } from '../vehicle/handling';

describe('driving', () => {
  it('ramps steering and brakes before changing direction', () => {
    const next = handling({ drive: -1, steer: 1 }, 10, 0, 1 / 60);
    expect(next.steering).toBeGreaterThan(0);
    expect(next.steering).toBeLessThan(0.1);
    expect(next.engine).toBe(0);
    expect(next.brake).toBeGreaterThan(0);
    expect(handling({ drive: -1, steer: 0 }, 0, 0, 1 / 60).engine).toBeLessThan(0);
  });
  it('steers right while moving forward and reverses from rest', async () => {
    const sim = await createSimulation();
    try {
      for (let i = 0; i < 120; i++) sim.step(ZERO_CONTROLS);
      for (let i = 0; i < 180; i++) sim.step({ drive: 1, steer: 1 });
      // Looking along +Z with +Y up, screen-right is -X.
      expect(sim.state().pose.position.x).toBeLessThan(-0.5);
      sim.reset();
      for (let i = 0; i < 120; i++) sim.step(ZERO_CONTROLS);
      for (let i = 0; i < 180; i++) sim.step({ drive: -1, steer: 0 });
      expect(sim.state().speed).toBeLessThan(-1);
    } finally { sim.dispose(); }
  });
  it('settles on the ground, drives forward, brakes and resets', async () => {
    const sim = await createSimulation();
    try {
      for (let i = 0; i < 180; i++) sim.step(ZERO_CONTROLS);
      expect(sim.state().wheels.filter(w => w.contact && w.surface === 'asphalt')).toHaveLength(4);
      const start = sim.state().pose.position.z;
      for (let i = 0; i < 180; i++) sim.step({ drive: 1, steer: 0 });
      const moving = sim.state();
      expect(moving.pose.position.z).toBeGreaterThan(start + 1);
      expect(moving.speed).toBeGreaterThan(1);
      for (let i = 0; i < 90; i++) sim.step({ drive: -1, steer: 0 });
      expect(sim.state().speed).toBeLessThan(moving.speed);
      sim.reset();
      expect(sim.state().pose.position.z).toBeCloseTo(0);
      expect(sim.state().speed).toBeCloseTo(0);
    } finally { sim.dispose(); }
  });
});
