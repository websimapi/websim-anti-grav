import { initGame, handleResize } from './game.js';
import { calibrate } from './controls.js';

function startGame() {
  document.getElementById('titleScreen').style.display = 'none';
  document.getElementById('gameScreen').style.display = 'block';
  
  // Set up event listeners
  document.getElementById('calibrateBtn').addEventListener('click', calibrate);
  window.addEventListener('resize', handleResize);

  // Initialize the game
  initGame();
}

// Title screen start button event listener
document.getElementById('startBtn').addEventListener('click', startGame);