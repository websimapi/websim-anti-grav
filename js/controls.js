import { getElements } from './utils.js';

let detector, video, calibrationData;
export let isCalibrating = false;

export async function setupWebcam() {
  video = document.getElementById('webcamVideo');
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
  await new Promise(resolve => video.onloadedmetadata = resolve);
  video.play();
}

export async function setupPoseDetection() {
  const model = poseDetection.SupportedModels.MoveNet;
  detector = await poseDetection.createDetector(model, {
    modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING
  });
}

export async function detectPose() {
  const poses = await detector.estimatePoses(video);
  return poses[0];
}

export async function calibrate() {
  const { statusOverlay } = getElements();
  isCalibrating = true;
  statusOverlay.textContent = "Calibrating... Stand in a neutral position, facing the camera.";
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const pose = await detectPose();
  if (pose) {
    const leftShoulder = pose.keypoints.find(kp => kp.name === 'left_shoulder');
    const rightShoulder = pose.keypoints.find(kp => kp.name === 'right_shoulder');
    const leftHip = pose.keypoints.find(kp => kp.name === 'left_hip');
    const rightHip = pose.keypoints.find(kp => kp.name === 'right_hip');

    calibrationData = {
      shoulderMidpoint: (leftShoulder.x + rightShoulder.x) / 2,
      hipY: (leftHip.y + rightHip.y) / 2
    };
  }

  isCalibrating = false;
  statusOverlay.textContent = "Calibration complete! Lean to steer, jump to boost upward, crouch to accelerate!";
}

export { calibrationData };