# Driving playground

- Keep React and DOM input out of simulation, vehicle, physics, and world code.
  Keep Rapier imports in physics and Three.js imports in rendering.
- The runtime composes modules and owns scheduling and disposal. Simulation owns
  vehicle movement; rendering consumes state snapshots without changing physics.
- Coordinates use metres, seconds, kilograms and radians: +Y up, local +Z
  forward. With the chase camera facing +Z, screen-right is -X.
- Physics ticks at 60 Hz. A tick reads controls, calculates handling, applies
  wheel forces and steering, updates the raycast vehicle, steps Rapier, and
  reads state. Contacts in the resulting state are from the latest vehicle update.
- Vehicle tuning is in `vehicle/config.ts`; world/spawn settings are in
  `world/playground.ts`. Keep game logic independent of future road data sources.
- Validate with `pnpm --filter client test` and `pnpm --filter client build`.
