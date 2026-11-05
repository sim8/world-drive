// Metres, kilograms, seconds and radians. Local +Z is forward and +Y is up.
export const vehicleConfig = {
  mass: 1200,
  chassisHalf: { x: 0.85, y: 0.3, z: 1.8 },
  wheelRadius: 0.36,
  suspensionRest: 0.38,
  wheelPositions: [
    { x: -0.85, y: 0, z: 1.2 }, { x: 0.85, y: 0, z: 1.2 },
    { x: -0.85, y: 0, z: -1.2 }, { x: 0.85, y: 0, z: -1.2 },
  ],
  engineForce: 2200,
  brakeForce: 150,
  rollingBrake: 1.2,
  maxSteering: 0.48,
  steeringRate: 2.2,
  steeringSpeedFactor: 0.055,
};
