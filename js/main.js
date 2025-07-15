// ===== main.js =====
// Entry point: bootstraps UI, game, Firebase, matchmaking, event bindings

import { createBoardDOM, renderPieces, updateClocksDisplay, openModal } from './ui.js';
import ChessClock from './clock.js';
import { showToast } from './toast.js';
import { showMatchHistory } from './matchHistory.js';
import { fetchAndShowOwnProfile } from './profile.js';
import './settings.js';
import { openSettings } from './settings.js';
import { initNotifications } from './notifications.js';
import { initGame, startClock, stopClock } from './game.js';
import {
  initFirebase,
  signInWithGoogle,
  signOutUser,
  onAuthStateChanged,
  getCurrentUser,
  submitMatchResult,
  fetchLeaderboard,
  findOrCreateMatch
} from './firebase.js';
import { initChat } from './chat.js';
import { showLoading, hideLoading } from './loading.js';

// DOM Elements
const signInBtn = document.getElementById('sign-in-btn');
const signOutBtn = document.getElementById('sign-out-btn');
const userDisplay = document.getElementById('user-display');
const leaderboardBtn = document.getElementById('leaderboard-btn');
const leaderboardModal = document.getElementById('leaderboard-modal');
const leaderboardList = document.getElementById('leaderboard-list');
const closeLeaderboardBtn = document.getElementById('close-leaderboard');
const playBtn2 = document.getElementById('play-2p');
const playBtn4 = document.getElementById('play-4p');
const modeText = document.getElementById('mode-text');
const matchHistoryBtn = document.getElementById('match-history-btn');
const userInfoBtn = document.getElementById('user-info');
const settingsBtn = document.getElementById('settings-btn');

let currentMatchId = null;
let playerCount = 2;
let currentTurn = 'white'; // Track whose turn it is globally

// Initialize clock with 10 minutes per player
const clock = new ChessClock(600, updateClocksDisplay, onTimeout);

// Start clock initially stopped, start when game starts
// clock.start(); // don't start here globally, start in startNewGame

// Event listeners setup
if (matchHistoryBtn) {
  matchHistoryBtn.addEventListener('click', showMatchHistory);
}

if (userInfoBtn) {
  userInfoBtn.addEventListener('click', fetchAndShowOwnProfile);
}

if (settingsBtn) {
  settingsBtn.addEventListener('click', openSettings);
}

if (signInBtn) signInBtn.onclick = () => signInWithGoogle();
if (signOutBtn) signOutBtn.onclick = () => signOutUser();

if (closeLeaderboardBtn) {
  closeLeaderboardBtn.onclick = () => {
    leaderboardModal.style.display = 'none';
  };
}

if (leaderboardBtn) {
  leaderboardBtn.onclick = async () => {
    leaderboardModal.style.display = 'flex';
    leaderboardList.innerHTML = '<p>Loading...</p>';
    showLoading();
    try {
      const topPlayers = await fetchLeaderboard();
      leaderboardList.innerHTML = '';
      if (topPlayers.length === 0) {
        leaderboardList.innerHTML = "<p>No leaderboard data available.</p>";
      } else {
        topPlayers.forEach(player => {
          const li = document.createElement('li');
          li.textContent = `${player.name}: ${player.rating}`;
          leaderboardList.appendChild(li);
        });
      }
    } catch (err) {
      leaderboardList.innerHTML = '<p>Error loading leaderboard.</p>';
      console.error(err);
    } finally {
      hideLoading();
    }
  };
}

// Auth state observer
onAuthStateChanged(user => {
  if (user) {
    userDisplay.textContent = `Signed in as: ${user.displayName}`;
    if (signInBtn) signInBtn.style.display = 'none';
    if (signOutBtn) signOutBtn.style.display = 'inline-block';
    initNotifications();
  } else {
    userDisplay.textContent = 'Not signed in';
    if (signInBtn) signInBtn.style.display = 'inline-block';
    if (signOutBtn) signOutBtn.style.display = 'none';
  }
});

// Game Over handler
function onGameOver(reason, winner = null) {
  let resultText = reason;
  if (winner) {
    resultText = `Winner: ${winner} (${reason})`;
  }
  openModal(resultText);

  const user = getCurrentUser();
  if (user && currentMatchId) {
    submitMatchResult(currentMatchId, user.uid, winner);
  }

  stopClock();
}

// Timeout handler for clocks
function onTimeout(loser) {
  // loser = 'white' or 'black'
  const winner = loser === 'white' ? 'black' : 'white';
  onGameOver('timeout', winner);
}

// Start a new game with given matchId and player count
function startNewGame(matchId, count) {
  currentMatchId = matchId;
  playerCount = count;
  modeText.textContent = `${count}-Player Mode`;

  initGame();
  createBoardDOM();
  renderPieces(window.boardState); // assuming boardState global or imported
  updateClocksDisplay(window.whiteTime, window.blackTime, window.turn);

  // Reset and start clock with turn from global state
  currentTurn = 'white'; // new game always starts with white turn
  clock.reset(600);
  clock.start();

  // Initialize chat for match
  initGameChat(matchId);
}

// Matchmaking buttons
if (playBtn2) {
  playBtn2.onclick = async () => {
    const user = getCurrentUser();
    if (!user) {
      alert('Please sign in');
      return;
    }
    showLoading();
    try {
      const matchId = await findOrCreateMatch(2);
      startNewGame(matchId, 2);
    } catch (err) {
      showToast('Error starting match', 'error');
      console.error(err);
    } finally {
      hideLoading();
    }
  };
}

if (playBtn4) {
  playBtn4.onclick = async () => {
    const user = getCurrentUser();
    if (!user) {
      alert('Please sign in');
      return;
    }
    showLoading();
    try {
      const matchId = await findOrCreateMatch(4);
      startNewGame(matchId, 4);
    } catch (err) {
      showToast('Error starting match', 'error');
      console.error(err);
    } finally {
      hideLoading();
    }
  };
}

// Initialize Firebase and app on load
window.addEventListener('load', () => {
  initFirebase();
  createBoardDOM();
  initGame();
  renderPieces(window.boardState);
  updateClocksDisplay(window.whiteTime, window.blackTime, window.turn);
  initNotifications();
});

// Optional: Initialize chat after starting match
function initGameChat(matchCode) {
  if (matchCode) {
    initChat(matchCode);
  }
}

// Optional: Render opponent info example function
function renderOpponentInfo(players) {
  const user = getCurrentUser();
  if (!players || players.length < 2) return;

  const opponent = players.find(p => p.uid !== user.uid);
  if (!opponent) return;

  const avatar = document.getElementById('opponent-avatar');
  const name = document.getElementById('opponent-name');
  const rating = document.getElementById('opponent-rating');

  if (avatar) {
    avatar.src = opponent.photoURL;
    avatar.classList.remove('hidden');
  }
  if (name) name.textContent = opponent.displayName;
  if (rating) rating.textContent = `(${opponent.rating})`;
}