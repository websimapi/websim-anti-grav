import { getElements } from './utils.js';

let detector, video, calibrationData;
export let isCalibrating = false;

export async function setupWebcam() {
  video = document.getElementById('webcamVideo');
  const stream = await navigator.mediaDevices.getUserMedia({ 
    video: { 
      width: { ideal: 320 }, 
      height: { ideal: 240 },
      frameRate: 30 
    } 
  });
  video.srcObject = stream;
  await new Promise(resolve => video.onloadedmetadata = resolve);
  video.play();
}

export async function setupPoseDetection() {
  const model = poseDetection.SupportedModels.MoveNet;
  detector = await poseDetection.createDetector(model, {
    modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
    enableSmoothing: true,
    minPoseScore: 0.3
  });
}

export async function detectPose() {
  if (!detector || !video) return null;
  const poses = await detector.estimatePoses(video, {
    maxPoses: 1,
    flipHorizontal: false
  });
  return poses[0] || null;
}

export async function calibrate() {
  const { statusOverlay } = getElements();
  isCalibrating = true;
  statusOverlay.textContent = "Calibrating... Stand neutral for 3 seconds";
  
  // Countdown
  for (let i = 3; i > 0; i--) {
    statusOverlay.textContent = `Calibrating... ${i}`;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Get multiple readings for stability
  let totalShoulder = 0, totalHip = 0, count = 0;
  for (let i = 0; i < 5; i++) {
    const pose = await detectPose();
    if (pose) {
      const leftShoulder = pose.keypoints.find(kp => kp.name === 'left_shoulder');
      const rightShoulder = pose.keypoints.find(kp => kp.name === 'right_shoulder');
      const leftHip = pose.keypoints.find(kp => kp.name === 'left_hip');
      const rightHip = pose.keypoints.find(kp => kp.name === 'right_hip');
      
      if (leftShoulder && rightShoulder && leftHip && rightHip) {
        totalShoulder += (leftShoulder.x + rightShoulder.x) / 2;
        totalHip += (leftHip.y + rightHip.y) / 2;
        count++;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  if (count > 0) {
    calibrationData = {
      shoulderMidpoint: totalShoulder / count,
      hipY: totalHip / count
    };
    isCalibrating = false;
    statusOverlay.textContent = "Ready! Lean to steer, jump to jump, crouch to accelerate";
  } else {
    statusOverlay.textContent = "Calibration failed - please try again";
    isCalibrating = false;
  }
}

export { calibrationData };