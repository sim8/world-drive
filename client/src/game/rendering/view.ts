import * as THREE from 'three';
import type { VehicleState } from '../contracts';
import { vehicleConfig as config } from '../vehicle/config';
import { playground } from '../world/playground';

export function createView(container: HTMLElement) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xb8d9e6);
  scene.fog = new THREE.Fog(0xb8d9e6, 100, 350);
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 600);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);
  scene.add(new THREE.HemisphereLight(0xe4f5ff, 0x68765f, 2));
  const sun = new THREE.DirectionalLight(0xffffff, 2.3);
  sun.position.set(-20, 35, -15); sun.castShadow = true;
  sun.shadow.camera.left = -30; sun.shadow.camera.right = 30; sun.shadow.camera.top = 30; sun.shadow.camera.bottom = -30;
  sun.shadow.mapSize.set(1024, 1024); scene.add(sun);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(playground.ground.halfSize * 2, playground.ground.halfSize * 2), new THREE.MeshStandardMaterial({ color: 0x6e7977, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const grid = new THREE.GridHelper(500, 100, 0x8d9b98, 0x82908d); grid.position.y = 0.01; scene.add(grid);
  const car = new THREE.Group(); scene.add(car);
  function box(w: number, h: number, d: number, color: number, y: number, z: number) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color, roughness: 0.6 }));
    mesh.position.set(0, y, z); mesh.castShadow = true; car.add(mesh);
  }
  box(1.7, 0.6, 3.6, 0xe45c38, 0, 0);
  box(1.45, 0.55, 1.7, 0x354c54, 0.53, -0.15);
  const wheels = config.wheelPositions.map(position => {
    const pivot = new THREE.Group(); pivot.position.set(position.x, position.y - config.suspensionRest, position.z); car.add(pivot);
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(config.wheelRadius, config.wheelRadius, 0.3, 16), new THREE.MeshStandardMaterial({ color: 0x1e2527, roughness: 0.9 }));
    wheel.rotation.z = Math.PI / 2; wheel.castShadow = true; pivot.add(wheel); return { pivot, wheel };
  });
  // Landmarks give the otherwise flat test area a sense of motion and scale.
  const markerGeometry = new THREE.BoxGeometry(0.35, 1.5, 0.35);
  const markerMaterial = new THREE.MeshStandardMaterial({ color: 0xf3d46a });
  for (let z = -100; z <= 100; z += 20) for (const x of [-12, 12]) {
    const marker = new THREE.Mesh(markerGeometry, markerMaterial); marker.position.set(x, 0.75, z); marker.castShadow = true; scene.add(marker);
  }
  const desired = new THREE.Vector3(); const target = new THREE.Vector3(); const q = new THREE.Quaternion();
  let cameraReady = false;
  function render(previous: VehicleState, current: VehicleState, alpha: number, dt: number, snap = false) {
    const a = previous.pose, b = current.pose;
    car.position.set(a.position.x, a.position.y, a.position.z).lerp(new THREE.Vector3(b.position.x, b.position.y, b.position.z), alpha);
    car.quaternion.set(a.rotation.x, a.rotation.y, a.rotation.z, a.rotation.w).slerp(new THREE.Quaternion(b.rotation.x, b.rotation.y, b.rotation.z, b.rotation.w), alpha);
    wheels.forEach(({ pivot, wheel }, i) => { pivot.position.y = config.wheelPositions[i].y - current.wheels[i].suspension; pivot.rotation.y = i < 2 ? -current.steering : 0; wheel.rotation.x = current.wheels[i].rotation; });
    q.copy(car.quaternion);
    desired.set(0, 4, -9).applyQuaternion(q).add(car.position);
    target.set(0, 0.5, 3).applyQuaternion(q).add(car.position);
    if (!cameraReady || snap) { camera.position.copy(desired); cameraReady = true; }
    else camera.position.lerp(desired, 1 - Math.exp(-4 * Math.min(dt, 0.1)));
    camera.lookAt(target);
    renderer.render(scene, camera);
  }
  function resize() { const width = container.clientWidth; const height = container.clientHeight; if (!width || !height) return; renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); }
  const observer = new ResizeObserver(resize); observer.observe(container); resize();
  function dispose() {
    observer.disconnect();
    scene.traverse(object => { if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) { object.geometry.dispose(); const materials = Array.isArray(object.material) ? object.material : [object.material]; materials.forEach(material => material.dispose()); } });
    renderer.dispose(); renderer.domElement.remove();
  }
  return { render, dispose };
}
