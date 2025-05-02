/**
 * CalmSphere VRET Main Application Logic
 * This file controls the experience flow and user interactions
 */

import { sendProgress, logAnxiety, handleApiError } from './api.js';

// Configuration for the therapy levels
const LEVELS = [
  { 
    id: 'lvl1', 
    type: 'image',
    instruction: 'Level 1: Step onto the balcony', 
    description: 'You are on a balcony on the second floor. Take some time to adjust to the height.',
    duration: 10 // seconds
  },
  { 
    id: 'lvl2', 
    type: 'image',
    instruction: 'Level 2: Stand by the railing', 
    description: 'Now move closer to the railing. Notice the view and your feelings.',
    duration: 10 // seconds
  },
  { 
    id: 'lvl3', 
    type: 'video',
    instruction: 'Level 3: Look over the edge', 
    description: 'Move to the edge and look down. Practice your breathing techniques.',
    duration: 10 // seconds
  }
];

// State management
const state = {
  currentLevel: 0,
  sessionStartTime: null,
  levelStartTime: null,
  breathCount: 0,
  inBreathingMode: false,
  levelTimers: [],
  paused: false
};

// DOM elements
const elements = {
  sky: document.getElementById('sky'),
  videoSky: document.getElementById('videoSky'),
  instruction: document.getElementById('instruction'),
  nextBtn: document.getElementById('nextBtn'),
  exitBtn: document.getElementById('exitBtn'),
  breatheBtn: document.getElementById('breatheBtn'),
  progressFill: document.getElementById('progressFill'),
  loadingOverlay: document.getElementById('loadingOverlay'),
  breathingGuide: document.getElementById('breathingGuide'),
  calmIndicator: document.getElementById('calmIndicator'),
  cursor: document.getElementById('cursor')
};

// Initialize the application
function initialize() {
  setupEventListeners();
  state.sessionStartTime = new Date();
  state.levelStartTime = new Date();
  loadLevel(0);
  setTimeout(() => {
    elements.loadingOverlay.style.opacity = '0';
    setTimeout(() => {
      elements.loadingOverlay.style.display = 'none';
    }, 500);
  }, 1500);
}

// Set up all event listeners
function setupEventListeners() {
  const nextBox = elements.nextBtn.querySelector('a-box');
  nextBox.addEventListener('click', handleNextLevel);

  const breatheBox = elements.breatheBtn.querySelector('a-box');
  breatheBox.addEventListener('click', toggleBreathingMode);

  const exitBox = elements.exitBtn.querySelector('a-box');
  exitBox.addEventListener('click', handleExit);

  const videoElement = document.getElementById('lvl3');
  if (videoElement) {
    videoElement.addEventListener('loadeddata', () => {
      console.log('Video data loaded');
    });
  }

  const scene = document.querySelector('a-scene');
  scene.addEventListener('enter-vr', () => {
    elements.cursor.setAttribute('fuse-timeout', '1000');
    document.querySelector('.info-panel').style.display = 'none';
    document.querySelector('.progress-bar').style.display = 'none';
  });

  scene.addEventListener('exit-vr', () => {
    elements.cursor.setAttribute('fuse-timeout', '1500');
    document.querySelector('.info-panel').style.display = 'block';
    document.querySelector('.progress-bar').style.display = 'block';
  });
}

// Load a specific level by index
function loadLevel(index) {
  state.levelTimers.forEach(timer => clearTimeout(timer));
  state.levelTimers = [];
  state.currentLevel = index;
  state.levelStartTime = new Date();
  state.paused = false;

  const level = LEVELS[index];
  elements.instruction.setAttribute('value', `${level.instruction}\n${level.description}`);
  updateProgressBar();

  if (level.type === 'image') {
    elements.sky.setAttribute('src', `#${level.id}`);
    elements.sky.setAttribute('visible', 'true');
    elements.videoSky.setAttribute('visible', 'false');
    const videoElement = document.getElementById('lvl3');
    if (videoElement) videoElement.pause();
  } else if (level.type === 'video') {
    elements.sky.setAttribute('visible', 'false');
    elements.videoSky.setAttribute('visible', 'true');
    const videoElement = document.getElementById('lvl3');
    if (videoElement) videoElement.play().catch(err => console.warn('Video play failed:', err));
  }

  const levelTimer = setTimeout(() => {
    if (!state.paused) {
      if (index < LEVELS.length - 1) {
        handleNextLevel();
      } else {
        completeSession();
      }
    }
  }, level.duration * 1000);
  state.levelTimers.push(levelTimer);

  sendProgress({ 
    phobia: 'heights', 
    level: index + 1,
    duration: 0
  }).catch(err => handleApiError({
    requestType: 'levelStart',
    data: { phobia: 'heights', level: index + 1 },
    error: err
  }));
}

// Handle next level button click
function handleNextLevel() {
  const nextLevel = state.currentLevel + 1;
  const levelDuration = (new Date() - state.levelStartTime) / 1000;

  sendProgress({ 
    phobia: 'heights', 
    level: state.currentLevel + 1,
    duration: Math.round(levelDuration)
  }).catch(err => handleApiError({
    requestType: 'levelComplete',
    data: { 
      phobia: 'heights', 
      level: state.currentLevel + 1,
      duration: Math.round(levelDuration)
    },
    error: err
  }));

  if (nextLevel < LEVELS.length) {
    loadLevel(nextLevel);
  } else {
    completeSession();
  }
}

// Handle exit button click
function handleExit() {
  const sessionDuration = (new Date() - state.sessionStartTime) / 1000;
  sendProgress({ 
    phobia: 'heights', 
    level: state.currentLevel + 1,
    duration: Math.round(sessionDuration),
    completed: false
  }).catch(handleApiError);
  setTimeout(() => {
    window.location.href = '/dashboard';
  }, 500);
}

// Toggle breathing exercise mode
function toggleBreathingMode() {
  state.inBreathingMode = !state.inBreathingMode;

  if (state.inBreathingMode) {
    elements.breathingGuide.style.opacity = '1';
    elements.calmIndicator.setAttribute('visible', 'true');
    startBreathingAnimation();
    state.paused = true;
  } else {
    elements.breathingGuide.style.opacity = '0';
    elements.calmIndicator.setAttribute('visible', 'false');
    stopBreathingAnimation();
    state.paused = false;
  }

  logAnxiety(state.currentLevel + 1, state.inBreathingMode ? 'high' : 'managed')
    .catch(err => console.warn('Failed to log anxiety:', err));
}

// Start the breathing animation
function startBreathingAnimation() {
  const breathingText = ['Breathe in...', 'Hold...', 'Breathe out...', 'Hold...'];
  const durations = [4000, 2000, 6000, 2000];
  let currentStep = 0;

  function updateBreathingGuide() {
    if (!state.inBreathingMode) return;
    elements.breathingGuide.textContent = breathingText[currentStep];

    if (currentStep === 0) {
      elements.calmIndicator.setAttribute('animation', {
        property: 'scale',
        from: '0.02 0.02 0.02',
        to: '0.05 0.05 0.05',
        dur: durations[0],
        easing: 'easeOutQuad'
      });
    } else if (currentStep === 2) {
      elements.calmIndicator.setAttribute('animation', {
        property: 'scale',
        from: '0.05 0.05 0.05',
        to: '0.02 0.02 0.02',
        dur: durations[2],
        easing: 'easeInQuad'
      });
    }

    setTimeout(() => {
      currentStep = (currentStep + 1) % 4;
      updateBreathingGuide();
    }, durations[currentStep]);
  }

  updateBreathingGuide();
}

// Stop the breathing animation
function stopBreathingAnimation() {
  elements.calmIndicator.removeAttribute('animation');
}

// Complete the therapy session
function completeSession() {
  const sessionDuration = (new Date() - state.sessionStartTime) / 1000;
  elements.instruction.setAttribute('value', 'Congratulations! You have completed all levels.\nRemove your headset when ready.');
  elements.nextBtn.setAttribute('visible', 'false');

  sendProgress({ 
    phobia: 'heights', 
    level: LEVELS.length,
    duration: Math.round(sessionDuration),
    completed: true
  }).catch(err => handleApiError({
    requestType: 'sessionComplete',
    data: { 
      phobia: 'heights', 
      level: LEVELS.length,
      duration: Math.round(sessionDuration),
      completed: true
    },
    error: err
  }));

  const exitTimer = setTimeout(() => {
    elements.instruction.setAttribute('value', 'Returning to dashboard in 10 seconds...');
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 10000);
  }, 20000);
  state.levelTimers.push(exitTimer);
}

// Update the progress bar
function updateProgressBar() {
  const progressPercentage = ((state.currentLevel + 1) / LEVELS.length) * 100;
  elements.progressFill.style.width = `${progressPercentage}%`;
}

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    state.paused = true;
    const videoElement = document.getElementById('lvl3');
    if (videoElement && !videoElement.paused) videoElement.pause();
  } else {
    if (!state.inBreathingMode) {
      if (LEVELS[state.currentLevel].type === 'video') {
        const videoElement = document.getElementById('lvl3');
        if (videoElement) videoElement.play().catch(err => console.warn('Video play failed:', err));
      }
      state.paused = false;
    }
  }
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initialize);