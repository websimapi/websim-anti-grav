import { scene, camera, renderer, ship, shipVelocity, CONSTANTS } from './game.js';
import { detectPose, isCalibrating, calibrationData } from './controls.js';
import { getElements } from './utils.js';

let lastVerticalMovement = 0;
let isJumping = false;
let isCrouching = false;
let lastPoseTime = 0;
let lastSpeedUpdate = 0;

export async function updateGame() {
  requestAnimationFrame(updateGame);

  const now = performance.now();
  
  // Only check pose every 50ms to reduce CPU usage
  if (!isCalibrating && now - lastPoseTime > 50) {
    const pose = await detectPose();
    if (pose) updateShipPosition(pose);
    lastPoseTime = now;
  }

  // Update physics every frame
  updatePhysics();
  renderer.render(scene, camera);
}

function updatePhysics() {
  // Apply gravity and update position
  shipVelocity.add(CONSTANTS.gravity);
  ship.position.add(shipVelocity);

  // Clamp vertical velocity
  shipVelocity.y = Math.max(-0.2, Math.min(0.2, shipVelocity.y));

  handleCollisions();
  updateShipMovement();
  updateCamera();
  updateSpeedometer();
}

function updateShipPosition(pose) {
  if (!calibrationData) return;

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
    
    // Detect state changes with improved thresholds
    const wasJumping = isJumping;
    const wasCrouching = isCrouching;
    
    // Update states with adjusted sensitivity
    isJumping = verticalMovement > 80; // Higher threshold for jump
    isCrouching = verticalMovement < -30; // Lower threshold for crouch
    
    // Handle movement based on states
    if (isJumping && !wasJumping) {
      // Jump only triggers from neutral or crouch, not from jump
      if (!wasJumping) {
        shipVelocity.y = 0.15;
      }
    } else if (isCrouching && !wasJumping) {
      // Accelerate while crouching (but not jumping)
      shipVelocity.y = Math.max(0.01, shipVelocity.y + 0.008);
    } else if (Math.abs(verticalMovement) < 20) {
      // Normal height - gradual slowdown
      if (!wasJumping) {
        shipVelocity.y *= 0.98;
      }
    }
    
    lastVerticalMovement = verticalMovement;
  }
}

function handleCollisions() {
  const distanceFromCenter = Math.sqrt(ship.position.x ** 2 + ship.position.y ** 2);
  if (distanceFromCenter > CONSTANTS.tunnelRadius - 0.5) {
    const angle = Math.atan2(ship.position.y, ship.position.x);
    ship.position.x = (CONSTANTS.tunnelRadius - 0.5) * Math.cos(angle);
    ship.position.y = (CONSTANTS.tunnelRadius - 0.5) * Math.sin(angle);
    
    shipVelocity.x *= -0.3; // Reduced bounce
    shipVelocity.y *= -0.3;
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
  const now = performance.now();
  if (now - lastSpeedUpdate < 100) return; // Update every 100ms
  
  const speed = Math.sqrt(
    shipVelocity.x ** 2 + 
    shipVelocity.y ** 2 + 
    CONSTANTS.forwardSpeed ** 2
  ) * 100;
  getElements().speedometer.textContent = `Speed: ${speed.toFixed(1)} km/h`;
  lastSpeedUpdate = now;
}