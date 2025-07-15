// ===== settings.js =====
// Manages user preferences: volume, theme, piece style, notification sounds, and settings modal.

const defaultSettings = {
  sound: true,
  theme: 'light',       // options: 'light', 'dark', 'wood', etc.
  pieceStyle: 'default',// options: 'default', 'alpha', 'classic', etc.
  notifySound: true
};

const SETTINGS_KEY = 'chessSettings';

// Elements
const volumeToggleBtn = document.getElementById('volume-toggle');
const themeSelector = document.getElementById('theme-selector');
const pieceStyleSelector = document.getElementById('piece-style-selector');

const modal = document.getElementById('settings-modal');
const closeBtn = document.getElementById('close-settings');
const saveBtn = document.getElementById('save-settings-btn');
const notifySoundCheckbox = document.getElementById('notify-sound-checkbox');

let settings = { ...defaultSettings };

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function loadSettings() {
  const saved = localStorage.getItem(SETTINGS_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      settings = { ...defaultSettings, ...parsed };
    } catch {
      settings = { ...defaultSettings };
    }
  }
  applySettings();
}

function applySettings() {
  // Sound toggle: mute/unmute all audio elements globally or via your sound module
  const audios = document.querySelectorAll('audio');
  audios.forEach(a => a.muted = !settings.sound);

  // Update volume toggle button text/icon
  if (volumeToggleBtn) {
    volumeToggleBtn.textContent = settings.sound ? '🔊 Sound On' : '🔇 Muted';
  }

  // Update theme & piece style attributes for CSS
  document.body.setAttribute('data-theme', settings.theme);
  document.body.setAttribute('data-piece-style', settings.pieceStyle);

  // Update notify sound checkbox if modal open
  if (notifySoundCheckbox) notifySoundCheckbox.checked = settings.notifySound;

  // Apply actual theme class (dark/light)
  applyTheme(settings.theme);

  // Update selectors if present
  if (themeSelector) themeSelector.value = settings.theme;
  if (pieceStyleSelector) pieceStyleSelector.value = settings.pieceStyle;
}

function toggleSound() {
  settings.sound = !settings.sound;
  saveSettings();
  applySettings();
}

function openSettings() {
  loadSettings();
  if (modal) modal.classList.remove('hidden');
}

function closeSettings() {
  if (modal) modal.classList.add('hidden');
}

function saveFromModal() {
  if (themeSelector) settings.theme = themeSelector.value;
  if (pieceStyleSelector) settings.pieceStyle = pieceStyleSelector.value;
  if (notifySoundCheckbox) settings.notifySound = notifySoundCheckbox.checked;

  saveSettings();
  applySettings();
  closeSettings();
}

// Apply theme class to <html> element for global dark/light support
function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

// Event listeners
if (volumeToggleBtn) {
  volumeToggleBtn.addEventListener('click', toggleSound);
}
if (closeBtn) {
  closeBtn.addEventListener('click', closeSettings);
}
if (saveBtn) {
  saveBtn.addEventListener('click', saveFromModal);
}
if (themeSelector) {
  themeSelector.addEventListener('change', (e) => {
    settings.theme = e.target.value;
    saveSettings();
    applySettings();
  });
}
if (pieceStyleSelector) {
  pieceStyleSelector.addEventListener('change', (e) => {
    settings.pieceStyle = e.target.value;
    saveSettings();
    applySettings();
  });
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
  loadSettings();
});

export {
  settings,
  openSettings,
  closeSettings,
  applyTheme,
};