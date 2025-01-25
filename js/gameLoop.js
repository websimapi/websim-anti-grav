import { scene, camera, renderer, ship, shipVelocity, CONSTANTS } from './game.js';
import { detectPose, isCalibrating, calibrationData } from './controls.js';
import { getElements } from './utils.js';

let lastVerticalMovement = 0;
let isJumping = false;
let isCrouching = false;

export async function updateGame() {
  requestAnimationFrame(updateGame);

  if (!isCalibrating) {
    const pose = await detectPose();
    updateShipPosition(pose);
  }

  renderer.render(scene, camera);
}

function updateShipPosition(pose) {
  if (!pose || !calibrationData) return;

  const leftShoulder = pose.keypoints.find(kp => kp.name === 'left_shoulder');
  const rightShoulder = pose.keypoints.find(kp => kp.name === 'right_shoulder');
  const leftHip = pose.keypoints.find(kp => kp.name === 'left_hip');
  const rightHip = pose.keypoints.find(kp => kp.name === 'right_hip');

  if (leftShoulder && rightShoulder && leftHip && rightHip) {
    // Calculate lean (steering)
    const shoulderMidpoint = (leftShoulder.x + rightShoulder.x) / 2;
    const leanAmount = (shoulderMidpoint - calibrationData.shoulderMidpoint) / 100;
    shipVelocity.x = leanAmount * 0.1;

    // Calculate vertical position relative to calibration
    const currentHipY = (leftHip.y + rightHip.y) / 2;
    const verticalMovement = calibrationData.hipY - currentHipY;
    
    // Detect state changes
    const wasJumping = isJumping;
    const wasCrouching = isCrouching;
    
    // Update states
    isJumping = verticalMovement > 50; // Requires more significant jump
    isCrouching = verticalMovement < -20;
    
    // Handle movement based on states
    if (isJumping && !wasJumping) {
      // Initial jump impulse
      shipVelocity.y = 0.2;
    } else if (isCrouching) {
      // Acceleration while crouching
      shipVelocity.y += 0.01;
    } else if (Math.abs(verticalMovement) < 15) {
      // Normal height slows down
      shipVelocity.y *= 0.95;
    }

    // Apply gravity and update position
    shipVelocity.add(CONSTANTS.gravity);
    ship.position.add(shipVelocity);

    // Clamp vertical velocity
    shipVelocity.y = Math.max(-0.2, Math.min(0.2, shipVelocity.y));

    handleCollisions();
    updateShipMovement();
    updateCamera();
    updateSpeedometer();
    
    lastVerticalMovement = verticalMovement;
  }
}

function handleCollisions() {
  const distanceFromCenter = Math.sqrt(ship.position.x ** 2 + ship.position.y ** 2);
  if (distanceFromCenter > CONSTANTS.tunnelRadius - 0.5) {
    const angle = Math.atan2(ship.position.y, ship.position.x);
    ship.position.x = (CONSTANTS.tunnelRadius - 0.5) * Math.cos(angle);
    ship.position.y = (CONSTANTS.tunnelRadius - 0.5) * Math.sin(angle);
    
    shipVelocity.x *= -0.5;
    shipVelocity.y *= -0.5;
  }
}

function updateShipMovement() {
  ship.position.z -= CONSTANTS.forwardSpeed;
  if (ship.position.z < -CONSTANTS.tunnelLength) {
    ship.position.z += CONSTANTS.tunnelLength;
    camera.position.z += CONSTANTS.tunnelLength;
  }
}

function updateCamera() {
  const cameraOffset = new THREE.Vector3(0, 1, 3);
  camera.position.copy(ship.position).add(cameraOffset);
  camera.lookAt(ship.position);
}

function updateSpeedometer() {
  const speed = Math.sqrt(
    shipVelocity.x ** 2 + 
    shipVelocity.y ** 2 + 
    CONSTANTS.forwardSpeed ** 2
  ) * 100;
  getElements().speedometer.textContent = `Speed: ${speed.toFixed(1)} km/h`;
}