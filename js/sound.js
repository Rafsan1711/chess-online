// ===== sound.js =====
// Manages all in-game sounds for actions like move, capture, check, promote, start, etc.

const sounds = {
  move: new Audio('sounds/move.mp3'),
  capture: new Audio('sounds/capture.mp3'),
  check: new Audio('sounds/check.mp3'),
  promote: new Audio('sounds/promote.mp3'),
  castle: new Audio('sounds/castle.mp3'),
  start: new Audio('sounds/start.mp3'),
  win: new Audio('sounds/win.mp3'),
  lose: new Audio('sounds/lose.mp3'),
  draw: new Audio('sounds/draw.mp3'),
};

// Preload and setup audio elements
Object.values(sounds).forEach(audio => {
  audio.volume = 0.5; // default volume
  audio.preload = 'auto';
  // Optional: Add event listener to confirm ready state
  audio.addEventListener('canplaythrough', () => {
    // console.log(`Sound loaded: ${audio.src}`);
  });
  // Ensure it's loaded
  audio.load();
});

export function playSound(type) {
  const sound = sounds[type];
  if (!sound) return;

  // Reset and play
  sound.pause();
  sound.currentTime = 0;

  sound.play().catch(err => {
    // Chrome and other browsers block autoplay sometimes
    console.warn(`Sound '${type}' could not be played:`, err);
  });
}

export function setVolume(vol) {
  vol = Math.min(1, Math.max(0, vol)); // clamp between 0 and 1
  Object.values(sounds).forEach(audio => {
    audio.volume = vol;
  });
}

export function muteAll() {
  setVolume(0);
}

export function unmuteAll() {
  setVolume(0.5);
}