import { setupScene, createShip, createTunnel } from './objects.js';
import { setupWebcam, setupPoseDetection } from './controls.js';
import { updateGame } from './gameLoop.js';
import { getElements } from './utils.js';

export let scene, camera, renderer, ship, tunnel;
export const shipVelocity = new THREE.Vector3();
export const CONSTANTS = {
  gravity: new THREE.Vector3(0, -0.003, 0), // Reduced gravity
  tunnelRadius: 5,
  tunnelLength: 500, // Reduced tunnel length
  forwardSpeed: 0.15 // Slightly reduced speed
};

export async function initGame() {
  const { scene: newScene, camera: newCamera, renderer: newRenderer } = setupScene();
  scene = newScene;
  camera = newCamera;
  renderer = newRenderer;

  // Optimize renderer settings
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 1);

  ship = createShip();
  tunnel = createTunnel();
  scene.add(ship);
  scene.add(tunnel);

  // Set up lighting efficiently
  const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
  scene.add(ambientLight);
  const pointLight = new THREE.PointLight(0xffffff, 0.8, 100);
  pointLight.position.set(0, 0, 5);
  scene.add(pointLight);

  await setupWebcam();
  await setupPoseDetection();
  
  getElements().statusOverlay.textContent = "Ready! Lean to steer, jump to jump, crouch to accelerate";
  
  // Start game loop
  updateGame();
}

export function handleResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}