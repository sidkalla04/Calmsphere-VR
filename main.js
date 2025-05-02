
import { sendProgress } from './api.js';

const levels = [
  { id: 'lvl1', instruction: 'Level 1: Step onto the balcony' },
  { id: 'lvl2', instruction: 'Level 2: Stand by the railing' },
  { id: 'lvl3', instruction: 'Level 3: Look over the edge' },
];

let current = 0;
const sky = document.getElementById('sky');
const instr = document.getElementById('instruction');
const nextBtn = document.getElementById('nextBtn');
const exitBtn = document.getElementById('exitBtn');
const guideAudio = document.getElementById('guide');

// Play guidance at scene load
guideAudio.play();

function loadLevel(idx) {
  const lvl = levels[idx];
  sky.setAttribute('src', `#${lvl.id}`);
  instr.setAttribute('value', lvl.instruction);
  guideAudio.currentTime = 0;
  guideAudio.play();
}

// Next Level handler
nextBtn.addEventListener('click', () => {
  // send progress to backend
  sendProgress({ phobia: 'heights', level: current + 1 })
    .catch(console.error);

  current++;
  if (current < levels.length) {
    loadLevel(current);
  } else {
    instr.setAttribute('value', 'Session complete! Remove headset.');
    nextBtn.setAttribute('visible', false);
  }
});

// Exit handler
exitBtn.addEventListener('click', () => {
  sendProgress({ phobia: 'heights', level: current })
    .then(() => window.location.href = '/dashboard')
    .catch(console.error);
});

// Initialize first level
loadLevel(current);
