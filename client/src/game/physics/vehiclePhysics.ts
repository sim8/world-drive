import RAPIER from '@dimforge/rapier3d-compat';
import type { Controls, VehicleState } from '../contracts';
import { vehicleConfig as config } from '../vehicle/config';
import { handling } from '../vehicle/handling';
import { playground } from '../world/playground';

export const FIXED_DT = 1 / 60;

export async function createVehiclePhysics() {
  await RAPIER.init();
  const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
  world.timestep = FIXED_DT;
  const ground = world.createCollider(RAPIER.ColliderDesc.cuboid(playground.ground.halfSize, 0.1, playground.ground.halfSize).setTranslation(0, -0.1, 0));
  const body = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(playground.spawn.x, playground.spawn.y, playground.spawn.z).setLinearDamping(0.03).setAngularDamping(0.4));
  world.createCollider(RAPIER.ColliderDesc.cuboid(config.chassisHalf.x, config.chassisHalf.y, config.chassisHalf.z).setMass(config.mass), body);
  const vehicle = world.createVehicleController(body);
  vehicle.indexUpAxis = 1;
  vehicle.setIndexForwardAxis = 2;
  for (let i = 0; i < config.wheelPositions.length; i++) {
    vehicle.addWheel(config.wheelPositions[i], { x: 0, y: -1, z: 0 }, { x: -1, y: 0, z: 0 }, config.suspensionRest, config.wheelRadius);
    vehicle.setWheelSuspensionStiffness(i, 24);
    vehicle.setWheelSuspensionCompression(i, 4.4);
    vehicle.setWheelSuspensionRelaxation(i, 5.2);
    vehicle.setWheelMaxSuspensionForce(i, 10000);
    vehicle.setWheelFrictionSlip(i, 3);
  }
  let steering = 0;
  function state(): VehicleState {
    const position = body.translation();
    const rotation = body.rotation();
    const velocity = body.linvel();
    // Rotate local +Z by the chassis quaternion and project velocity onto it.
    const forward = { x: 2 * (rotation.x * rotation.z + rotation.w * rotation.y), y: 2 * (rotation.y * rotation.z - rotation.w * rotation.x), z: 1 - 2 * (rotation.x ** 2 + rotation.y ** 2) };
    return { pose: { position: { ...position }, rotation: { ...rotation } }, velocity: { ...velocity }, speed: velocity.x * forward.x + velocity.y * forward.y + velocity.z * forward.z, steering,
      wheels: config.wheelPositions.map((_, i) => ({ suspension: vehicle.wheelSuspensionLength(i) ?? config.suspensionRest, rotation: vehicle.wheelRotation(i) ?? 0, contact: vehicle.wheelIsInContact(i), surface: vehicle.wheelGroundObject(i)?.handle === ground.handle ? playground.ground.surface : null })) };
  }
  function step(controls: Controls) {
    const output = handling(controls, state().speed, steering, FIXED_DT);
    steering = output.steering;
    for (let i = 0; i < 4; i++) {
      vehicle.setWheelEngineForce(i, output.engine / 4);
      vehicle.setWheelBrake(i, output.brake);
      vehicle.setWheelSteering(i, i < 2 ? -steering : 0);
    }
    vehicle.updateVehicle(FIXED_DT, RAPIER.QueryFilterFlags.EXCLUDE_DYNAMIC);
    world.step();
  }
  function reset() {
    body.setTranslation(playground.spawn, true);
    body.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
    body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    steering = 0;
    for (let i = 0; i < 4; i++) { vehicle.setWheelEngineForce(i, 0); vehicle.setWheelBrake(i, 0); vehicle.setWheelSteering(i, 0); }
  }
  return { step, state, reset, dispose: () => world.free() };
}
