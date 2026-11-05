export type Vector = { x: number; y: number; z: number };
export type Rotation = Vector & { w: number };
export type Pose = { position: Vector; rotation: Rotation };
export type Controls = { drive: number; steer: number };
export type VehicleState = {
  pose: Pose;
  velocity: Vector;
  speed: number;
  steering: number;
  wheels: { suspension: number; rotation: number; contact: boolean; surface: string | null }[];
};
export const ZERO_CONTROLS: Controls = { drive: 0, steer: 0 };
