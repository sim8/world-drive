import type { Controls } from '../contracts';
import { vehicleConfig as config } from './config';

export function handling(controls: Controls, speed: number, steering: number, dt: number) {
  const input = Math.max(-1, Math.min(1, controls.steer));
  const target = input * config.maxSteering / (1 + Math.abs(speed) * config.steeringSpeedFactor);
  const difference = Math.max(-config.steeringRate * dt, Math.min(config.steeringRate * dt, target - steering));
  const drive = Math.max(-1, Math.min(1, controls.drive));
  const changingDirection = drive !== 0 && Math.abs(speed) > 0.5 && Math.sign(drive) !== Math.sign(speed);
  return {
    steering: steering + difference,
    engine: changingDirection ? 0 : drive * config.engineForce,
    brake: changingDirection ? config.brakeForce : drive === 0 ? config.rollingBrake : 0,
  };
}
