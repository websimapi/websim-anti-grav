import { initGame, handleResize } from './game.js';
import { calibrate } from './controls.js';

// Set up event listeners
document.getElementById('calibrateBtn').addEventListener('click', calibrate);
window.addEventListener('resize', handleResize);

// Initialize the game
initGame();