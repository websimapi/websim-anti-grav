import { setupScene, createShip, createTunnel } from './objects.js';
import { setupWebcam, setupPoseDetection } from './controls.js';
import { updateGame } from './gameLoop.js';
import { getElements } from './utils.js';

export let scene, camera, renderer, ship, tunnel;
export const shipVelocity = new THREE.Vector3();
export const CONSTANTS = {
  gravity: new THREE.Vector3(0, -0.005, 0),
  tunnelRadius: 5,
  tunnelLength: 1000,
  forwardSpeed: 0.2
};

export async function initGame() {
  const { scene: newScene, camera: newCamera, renderer: newRenderer } = setupScene();
  scene = newScene;
  camera = newCamera;
  renderer = newRenderer;

  ship = createShip();
  tunnel = createTunnel();
  scene.add(ship);
  scene.add(tunnel);

  // Set up lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  const pointLight = new THREE.PointLight(0xffffff, 1);
  pointLight.position.set(0, 0, 5);
  scene.add(pointLight);

  await setupWebcam();
  await setupPoseDetection();
  
  getElements().statusOverlay.textContent = "Ready! Lean left/right to steer, jump to accelerate, crouch to brake.";
  
  // Start game loop
  updateGame();
}

export function handleResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}