# Driving playground implementation plan

Status: proposed implementation plan. No gameplay code is implemented by this document.

## Outcome and scope

Build a single-player browser playground where driving a simple car is enjoyable:
accelerate, brake, reverse, steer through bends, climb and descend a hill, cross
onto grass, collide with barriers, and reset after a crash. Use a chase camera,
visible wheel movement, a speed display, and scenery that conveys scale.

The playground must run without the WebSocket server. Keep the existing lobby
available as a separate, optional screen; its connection/name flow must not gate
driving. No server or message-protocol changes are needed for this milestone.

Desktop keyboard controls are the initial target. Real geographic imports,
streaming, multiplayer driving, damage, manual gears, audio, mobile controls, and
additional vehicles are subsequent increments. The architecture should make
their ownership clear without implementing their systems now.

## Technical choices

- Keep React for screens, loading/error states, and the HUD.
- Use Three.js directly for the scene, vehicle visuals, and camera. Keep its
  animation and object updates outside React's render cycle.
- Start with Rapier's JavaScript/WASM raycast vehicle controller: a dynamic
  chassis, four wheel contact rays, and spring suspension. Use the compat package
  if it provides the simplest Vite and headless-test initialization; verify this
  in the first implementation stage and record the installed version.
- Use a 60 Hz fixed physics step, with render interpolation. Cap accumulated
  elapsed time and catch-up steps so a stalled/background tab cannot create a
  large simulation jump.
- Use metres, seconds, kilograms, radians, and a documented right-handed frame:
  +Y up, vehicle-local +Z forward. Convert to km/h only for display. Verify the
  controller's axis and steering conventions explicitly in the first stage.

This is a tuning-oriented driving model. The controller supplies a starting
point; good handling still requires work on steering, braking, grip, suspension,
mass distribution, and camera behaviour. Fixed stepping does not promise
bit-identical simulation across platforms or solve future network authority.

References:

- [Three.js fundamentals](https://threejs.org/manual/pages/fundamentals.html)
- [Rapier vehicle controller](https://rapier.rs/docs/user_guides/javascript/vehicle_controller/)
- [Rapier wheel contact and tuning API](https://rapier.rs/javascript3d/classes/DynamicRayCastVehicleController.html)
- [Rapier timestep and units](https://rapier.rs/docs/user_guides/javascript/integration_parameters/)

## Module ownership

Start inside `client/src/game`; create modules as their functionality arrives.
These are ownership boundaries, not a requirement to create every file in the
first commit or split trivial functions into separate files.

| Area | Owns | Must not own |
| --- | --- | --- |
| React screen (`client/src/DrivingPlayground.tsx`) | Canvas host, mount/unmount, loading/errors, HUD subscription | Physics, animation loop, Three.js scene objects |
| `game/runtime/` | Async startup, dependency composition, frame scheduling, input sampling, reset/pause coordination, disposal | Handling equations, track construction, rendering details |
| `game/input/` | Keyboard listeners and conversion to normalised controls | Vehicle forces, direct physics access |
| `game/simulation/` | Fixed-tick order, authoritative state, vehicle reset, published state snapshots | React, DOM, renderer, networking |
| `game/vehicle/` | Vehicle configuration and pure handling calculations | Keyboard events, meshes, Rapier handles |
| `game/physics/` | Rapier initialization, world/collider lifecycle, vehicle-controller adapter, contact/surface lookup | UI, camera, game-specific track layout |
| `game/world/` | Plain world/geometry descriptions, surface definitions, procedural playground and spawn | Three.js objects, Rapier objects, vehicle handling |
| `game/rendering/` | Three.js renderer/scene, world and car views, interpolation, chase camera, visual debug overlays | Changing authoritative physics state |
| `game/contracts.ts` | Small shared plain-data types: controls, poses, vehicle state, surface IDs | Engine objects, global mutable state, miscellaneous helpers |

The runtime is the composition point. Input produces controls; simulation consumes
controls through the physics adapter; rendering consumes snapshots. Simulation
and rendering both receive world data. React controls lifecycle and observes a
small HUD projection, rather than owning live simulation state.

Rapier imports stay in `physics/`; Three.js imports stay in `rendering/`.
Simulation, vehicle, and world modules can execute without a browser or GPU.
Engine objects remain private to their adapters. Do not build a general physics
engine abstraction: expose the small operations this game actually needs.

## Contracts and state ownership

Define the initial contracts before integrating the modules:

- `VehicleControls`: throttle and brake in `[0, 1]`, steer in `[-1, 1]`, and an
  explicit forward/reverse direction. The keyboard adapter decides the key map;
  the handling code defines the transition rules. Pressing reverse while moving
  forward should brake to a near stop before applying reverse drive.
- `VehicleConfig`: dimensions, mass/centre-of-mass offset, wheel locations,
  suspension, engine/brake forces, steering response and limits, and resistance.
  Put units and expected ranges next to the values.
- `VehicleState`: chassis pose, linear/angular velocity, signed forward speed,
  and wheel state required by visuals/diagnostics, including contact and surface.
  Publish plain data, with no live mutable references to engine internals.
- `WorldDefinition`: local origin convention, static geometry with stable IDs
  and surface IDs, visual metadata, and a spawn pose. Start with boxes and indexed
  triangle geometry needed by the playground; add other shapes only when used.
- `SurfaceDefinition`: named gameplay material with tunable grip and rolling
  resistance. Begin with asphalt and grass. These are game parameters, separate
  from future source-data tags.
- A small simulation API: create from world/config, step one fixed tick with
  controls, read current state, reset to spawn, and dispose. Keep reset distinct
  from continuously held driving controls.

Physics owns movement. Rendering retains previous/current poses for interpolation
and owns visual state; it never writes interpolated poses back into physics.
Reset clears velocities and controller/input state, refreshes both pose buffers,
and snaps the camera so the car does not interpolate across the map.

Generate drivable render geometry and collision geometry from the same world
description. Assign asphalt and grass to the actual contacted collider; avoid
overlapping ground/road collision surfaces that make wheel contact ambiguous.
Retain the ability to supply triangle geometry for a future real-road importer.
The vehicle must not depend on road centre lines, geographic coordinates, or a
single ground-height function.

## Implementation stages

### 1. Prove the stack with a playable vertical slice

Install rendering/physics dependencies and add the standalone playground screen.
Implement minimal startup/disposal, a fixed-step simulation, one ground collider,
a simple four-wheel car, basic controls, and a following camera. Exclude the
chassis from its wheel contact rays. Add loading and initialization-error states.

Verify the risky assumptions now: WASM works in Vite and a headless test, axis
conventions are correct, steering/reverse signs are correct, suspension settles,
wheel contacts can identify surfaces, and the selected controller exposes useful
grip tuning. Check braking at more than one vehicle heading. If the controller
blocks the intended feel, decide on a targeted workaround or replacement here.

Acceptance: from a fresh page load, without a server, drive, turn, stop, reverse,
and reset on a flat surface. Mount/unmount/remount does not leave extra animation
loops, listeners, physics worlds, or WebGL resources.

### 2. Establish handling and input behaviour

Move tuning into `VehicleConfig` and isolate pure handling calculations. Add
gradual steering/recentring, reduced maximum steering at higher speed, sensible
brake/reverse transitions, rolling resistance, and an initial suspension/mass
setup. Make controls clear on blur and pause while hidden; discard stale elapsed
time when resuming. Pause must stop simulation ticks as well as input.

Acceptance: the car is controllable at low and moderate speed, coasts to a stop,
brakes predictably, and reverses deliberately. Ordinary steering does not cause
routine rollovers. Releasing keys or switching tabs never leaves stuck input.

### 3. Construct the playground and validate surface interaction

Build a compact connected course with a straight, broad and tighter bends, a
smooth hill/crest/descent, asphalt-to-grass access, barriers, and an obvious spawn.
Use a small procedural road ribbon/mesh as needed, rather than approximating the
entire road with overlapping boxes. Keep geometry generation independent of both
engines. Add an out-of-bounds/fall reset.

Implement grip and resistance by wheel contact surface. Do not assume rigid-body
collider friction automatically gives the raycast tires the desired behaviour.
Keep any contact sampling and force-application order explicit in the adapter;
check transitions and mixed asphalt/grass contact rather than just uniform ground.

Acceptance: the same vehicle handles hills, crests, and landings without being
snapped onto the road; grass feels meaningfully different; barriers block the
chassis; road seams and surface transitions do not launch or snag the car.

### 4. Make driving feel readable and enjoyable

Tune a frame-rate-independent chase camera with restrained look-ahead and
smoothing. Show wheel steering/rotation/suspension from simulation state. Use
simple lighting, shadows where affordable, road markings, and regularly spaced
landmarks to communicate speed and scale. Keep the car model primitive initially.

Add a small HUD for speed, direction, controls, and reset. Publish HUD updates at
a modest rate instead of triggering React renders on every physics tick. Add an
optional development overlay for chassis/wheel colliders, contact normals or
points, surface IDs, suspension travel, and frame/step timing.

Acceptance: the camera stays useful through bends, reverse, and hill crests;
controls respond immediately; suspension and speed are visually legible. Play
the whole course repeatedly and tune the car and camera together.

### 5. Verify, document, and prepare the next increment

Add focused automated checks as the relevant modules land, then run the complete
set at this stage. Use a lightweight TypeScript test runner such as Vitest for
pure and headless simulation tests; browser checks cover rendering and lifecycle.

Automated coverage should exercise behaviour with tolerances:

- Handling output bounds, steering response, and brake/reverse transitions.
- A headless car settles, accelerates forward, brakes, and resets its pose and
  velocities; state remains finite during a short slope/contact scenario.
- Asphalt/grass contact selects the intended grip settings and changes handling.
- Equivalent elapsed-time schedules at 30/60/144 render FPS advance the same
  fixed physics ticks; a long stall cannot trigger unbounded catch-up.

Manually verify responsive canvas sizing, focus loss/background resume, repeated
mount/unmount, initialization failures, and the entire course at different render
rates. Aim for smooth 60 FPS on the owner's desktop and document the tested
browser/hardware; do not turn that into a universal performance guarantee.

Run the client build/type check and the existing server test/build to catch
workspace regressions. Update README with controls, playground startup, debugging,
and test commands. Add `client/src/game/AGENTS.md` documenting the dependency
rules, tick order, coordinate system, tuning locations, and validation commands.

Acceptance: the playground is independently playable and documented; the next
real-road task can supply a new `WorldDefinition` without changing vehicle logic.

## Keeping future mechanics modular

Prefer explicit modules and calls with typed inputs/outputs. Start with a small,
documented tick sequence: sample controls, calculate handling, apply surface and
vehicle forces/update the controller, step physics, and collect state. The first
stage must establish exactly when wheel contacts become available; document any
use of previous-tick contacts or additional contact queries. Presentation follows
the completed simulation tick.

For each new mechanic, identify its state owner, when it updates, what it reads,
and what it may change. For example, a boost mechanic modifies the handling force
request before physics; a different car skin changes rendering; a real-road
importer produces world data. None should require edits in keyboard listeners or
the React canvas lifecycle.

Keep tuning in named configurations and keep public interfaces small. Add stable
entity IDs when a mechanic actually needs multiple entities. Add typed events
when there is a real transient event and consumer, rather than creating an event
bus, plugin registry, or ECS pre-emptively. Add a workspace package when a second
consumer needs the simulation, rather than moving gameplay into `sharedTypes.ts`
or inventing a network contract during this milestone.

Changes should follow the five playable stages above, with focused ownership and
validation per change. Review dependency direction alongside behaviour: lots of
files do not provide modularity if they all reach into one mutable game object.
