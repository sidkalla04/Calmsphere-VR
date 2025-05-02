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
    audioId: 'guide1',
    duration: 60 // seconds
  },
  { 
    id: 'lvl2', 
    type: 'image',
    instruction: 'Level 2: Stand by the railing', 
    description: 'Now move closer to the railing. Notice the view and your feelings.',
    audioId: 'guide2',
    duration: 90 // seconds
  },
  { 
    id: 'lvl3', 
    type: 'video',
    instruction: 'Level 3: Look over the edge', 
    description: 'Move to the edge and look down. Practice your breathing techniques.',
    audioId: 'guide3',
    duration: 120 // seconds
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

// Audio elements
const audio = {
  guide1: document.getElementById('guide1'),
  guide2: document.getElementById('guide2'),
  guide3: document.getElementById('guide3'),
  complete: document.getElementById('complete'),
  calm: document.getElementById('calm')
};

// Initialize the application
function initialize() {
  // Set up event listeners
  setupEventListeners();
  
  // Initialize the session
  state.sessionStartTime = new Date();
  state.levelStartTime = new Date();
  
  // Load the first level
  loadLevel(0);
  
  // Hide loading overlay after a short delay
  setTimeout(() => {
    elements.loadingOverlay.style.opacity = '0';
    setTimeout(() => {
      elements.loadingOverlay.style.display = 'none';
    }, 500);
  }, 1500);
}

// Set up all event listeners
function setupEventListeners() {
  // Next level button - Fix by using event listeners on all child components
  elements.nextBtn.addEventListener('click', handleNextLevel);
  elements.nextBtn.querySelector('a-box').addEventListener('click', handleNextLevel);
  elements.nextBtn.querySelector('a-text').addEventListener('click', handleNextLevel);
  
  // Exit button - Fix by using event listeners on all child components
  elements.exitBtn.addEventListener('click', handleExit);
  elements.exitBtn.querySelector('a-box').addEventListener('click', handleExit);
  elements.exitBtn.querySelector('a-text').addEventListener('click', handleExit);
  
  // Breathing button
  elements.breatheBtn.addEventListener('click', toggleBreathingMode);
  elements.breatheBtn.querySelector('a-box').addEventListener('click', toggleBreathingMode);
  elements.breatheBtn.querySelector('a-text').addEventListener('click', toggleBreathingMode);
  
  // Listen for video events on level 3
  const videoElement = document.getElementById('lvl3');
  videoElement.addEventListener('loadeddata', () => {
    console.log('Video data loaded');
  });
  
  // Listen for VR mode changes
  const scene = document.querySelector('a-scene');
  scene.addEventListener('enter-vr', () => {
    // Adjust UI for VR mode
    elements.cursor.setAttribute('fuse-timeout', '1000');
    
    // Hide screen UI elements
    document.querySelector('.info-panel').style.display = 'none';
    document.querySelector('.progress-bar').style.display = 'none';
  });
  
  scene.addEventListener('exit-vr', () => {
    // Reset UI for non-VR mode
    elements.cursor.setAttribute('fuse-timeout', '1500');
    
    // Show screen UI elements again
    document.querySelector('.info-panel').style.display = 'block';
    document.querySelector('.progress-bar').style.display = 'block';
  });
}

// Load a specific level by index
function loadLevel(index) {
  // Clear any existing timers
  state.levelTimers.forEach(timer => clearTimeout(timer));
  state.levelTimers = [];
  
  // Reset state for new level
  state.currentLevel = index;
  state.levelStartTime = new Date();
  state.paused = false;
  
  // Get the level configuration
  const level = LEVELS[index];
  
  // Update UI
  elements.instruction.setAttribute('value', `${level.instruction}\n${level.description}`);
  updateProgressBar();
  
  // Stop all audio
  Object.values(audio).forEach(audioElement => {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }
  });
  
  // Play level-specific audio guidance
  const guideAudio = audio[level.audioId];
  if (guideAudio) {
    guideAudio.play().catch(err => console.warn('Audio play failed:', err));
  }
  
  // Handle different level types (image vs video)
  if (level.type === 'image') {
    elements.sky.setAttribute('src', `#${level.id}`);
    elements.sky.setAttribute('visible', 'true');
    elements.videoSky.setAttribute('visible', 'false');
    
    // Stop video if it's playing
    const videoElement = document.getElementById('lvl3');
    if (videoElement) {
      videoElement.pause();
    }
  } else if (level.type === 'video') {
    elements.sky.setAttribute('visible', 'false');
    elements.videoSky.setAttribute('visible', 'true');
    
    // Play the video
    const videoElement = document.getElementById('lvl3');
    videoElement.play().catch(err => console.warn('Video play failed:', err));
  }
  
  // Set a timer to prompt for next level
  const levelTimer = setTimeout(() => {
    if (!state.paused) {
      elements.instruction.setAttribute('value', `${level.instruction}\n\nGreat job! Ready for the next level?`);
    }
  }, level.duration * 1000);
  
  state.levelTimers.push(levelTimer);
  
  // Log new level start
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
  
  // Calculate time spent on current level
  const levelDuration = (new Date() - state.levelStartTime) / 1000; // in seconds
  
  // Send progress data to backend
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
    // Load the next level
    loadLevel(nextLevel);
  } else {
    // Complete the therapy session
    completeSession();
  }
}

// Handle exit button click
function handleExit() {
  // Calculate session duration
  const sessionDuration = (new Date() - state.sessionStartTime) / 1000; // in seconds
  
  // Log session exit
  sendProgress({ 
    phobia: 'heights', 
    level: state.currentLevel + 1,
    duration: Math.round(sessionDuration),
    completed: false
  }).catch(handleApiError);
  
  // Return to dashboard
  setTimeout(() => {
    window.location.href = '/dashboard';
  }, 500);
}

// Toggle breathing exercise mode
function toggleBreathingMode() {
  state.inBreathingMode = !state.inBreathingMode;
  
  if (state.inBreathingMode) {
    // Activate breathing mode
    elements.breathingGuide.style.opacity = '1';
    elements.calmIndicator.setAttribute('visible', 'true');
    
    // Start breathing animation
    startBreathingAnimation();
    
    // Play calming audio
    if (audio.calm) {
      audio.calm.play().catch(err => console.warn('Audio play failed:', err));
    }
    
    // Pause the current level timer
    state.paused = true;
  } else {
    // Deactivate breathing mode
    elements.breathingGuide.style.opacity = '0';
    elements.calmIndicator.setAttribute('visible', 'false');
    
    // Stop breathing animation
    stopBreathingAnimation();
    
    // Stop calming audio
    if (audio.calm) {
      audio.calm.pause();
      audio.calm.currentTime = 0;
    }
    
    // Resume the level timer
    state.paused = false;
  }
  
  // Log anxiety intervention
  logAnxiety(state.currentLevel + 1, state.inBreathingMode ? 'high' : 'managed')
    .catch(err => console.warn('Failed to log anxiety:', err));
}

// Start the breathing animation
function startBreathingAnimation() {
  const breathingText = ['Breathe in...', 'Hold...', 'Breathe out...', 'Hold...'];
  const durations = [4000, 2000, 6000, 2000]; // in milliseconds
  let currentStep = 0;
  
  // Function to update the breathing guide
  function updateBreathingGuide() {
    if (!state.inBreathingMode) return;
    
    elements.breathingGuide.textContent = breathingText[currentStep];
    
    // Animate the calm indicator
    if (currentStep === 0) {
      // Breathe in - expand
      elements.calmIndicator.setAttribute('animation', {
        property: 'scale',
        from: '0.02 0.02 0.02',
        to: '0.05 0.05 0.05',
        dur: durations[0],
        easing: 'easeOutQuad'
      });
    } else if (currentStep === 2) {
      // Breathe out - contract
      elements.calmIndicator.setAttribute('animation', {
        property: 'scale',
        from: '0.05 0.05 0.05',
        to: '0.02 0.02 0.02',
        dur: durations[2],
        easing: 'easeInQuad'
      });
    }
    
    // Move to next step
    setTimeout(() => {
      currentStep = (currentStep + 1) % 4;
      updateBreathingGuide();
    }, durations[currentStep]);
  }
  
  // Start the breathing cycle
  updateBreathingGuide();
}

// Stop the breathing animation
function stopBreathingAnimation() {
  elements.calmIndicator.removeAttribute('animation');
}

// Complete the therapy session
function completeSession() {
  // Calculate total session duration
  const sessionDuration = (new Date() - state.sessionStartTime) / 1000; // in seconds
  
  // Update UI to show completion
  elements.instruction.setAttribute('value', 'Congratulations! You have completed all levels.\nRemove your headset when ready.');
  elements.nextBtn.setAttribute('visible', 'false');
  
  // Play completion audio
  if (audio.complete) {
    audio.complete.play().catch(err => console.warn('Audio play failed:', err));
  }
  
  // Send completion data
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
  
  // Set up return to dashboard
  const exitTimer = setTimeout(() => {
    elements.instruction.setAttribute('value', 'Returning to dashboard in 10 seconds...');
    
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 10000);
  }, 20000);
  
  state.levelTimers.push(exitTimer);
}

// Update the progress bar based on current level
function updateProgressBar() {
  const progressPercentage = ((state.currentLevel + 1) / LEVELS.length) * 100;
  elements.progressFill.style.width = `${progressPercentage}%`;
}

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Page is hidden (user switched tabs, etc.)
    state.paused = true;
    
    // Pause all media
    Object.values(audio).forEach(audioElement => {
      if (audioElement && !audioElement.paused) {
        audioElement.pause();
      }
    });
    
    const videoElement = document.getElementById('lvl3');
    if (videoElement && !videoElement.paused) {
      videoElement.pause();
    }
  } else {
    // Page is visible again
    if (state.inBreathingMode) {
      // Resume calming audio if in breathing mode
      if (audio.calm) {
        audio.calm.play().catch(err => console.warn('Audio play failed:', err));
      }
    } else {
      // Resume level-specific audio
      const currentLevel = LEVELS[state.currentLevel];
      const guideAudio = audio[currentLevel.audioId];
      if (guideAudio) {
        guideAudio.play().catch(err => console.warn('Audio play failed:', err));
      }
      
      // Resume video if on level 3
      if (currentLevel.type === 'video') {
        const videoElement = document.getElementById('lvl3');
        if (videoElement) {
          videoElement.play().catch(err => console.warn('Video play failed:', err));
        }
      }
      
      state.paused = false;
    }
  }
});

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initialize);