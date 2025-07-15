// player.js
// Handles player profiles, Google profile picture, turn highlight, rating display for 2-player chess

import { getCurrentUser } from './firebase.js';

// DOM elements
const playerNameDiv = document.getElementById('player-name');
const playerAvatarImg = document.getElementById('player-avatar');
const playerRatingDiv = document.getElementById('player-rating');

const opponentNameDiv = document.getElementById('opponent-name');
const opponentAvatarImg = document.getElementById('opponent-avatar');
const opponentRatingDiv = document.getElementById('opponent-rating');

const playerContainer = document.getElementById('player-container');     // Container div for player (optional)
const opponentContainer = document.getElementById('opponent-container'); // Container div for opponent (optional)

let players = [];
let playerIndex = -1; // 0 or 1, representing which side the current user is

// Initialize player data and update UI
export function setPlayers(playerList, index) {
  players = playerList;
  playerIndex = index;
  updatePlayerInfo();
  updateTurnHighlight(null); // no turn on init
}

// Get current logged-in player object
export function getCurrentPlayer() {
  return players[playerIndex] || null;
}

// Get opponent player object
export function getOpponentPlayer() {
  return players.find((_, i) => i !== playerIndex) || null;
}

// Update player and opponent info in the UI
export function updatePlayerInfo() {
  const me = getCurrentPlayer();
  const opponent = getOpponentPlayer();

  if (me) {
    playerNameDiv.textContent = me.name || 'You';
    playerRatingDiv.textContent = `Rating: ${me.rating ?? 'N/A'}`;
    if (playerAvatarImg) {
      playerAvatarImg.src = me.photoURL || 'default-avatar.png'; // fallback avatar image
      playerAvatarImg.alt = `${me.name}'s avatar`;
    }
  }

  if (opponent) {
    opponentNameDiv.textContent = opponent.name || 'Opponent';
    opponentRatingDiv.textContent = `Rating: ${opponent.rating ?? 'N/A'}`;
    if (opponentAvatarImg) {
      opponentAvatarImg.src = opponent.photoURL || 'default-avatar.png';
      opponentAvatarImg.alt = `${opponent.name}'s avatar`;
    }
  }
}

// Highlight whose turn it is by adding/removing CSS classes on containers or name divs
export function updateTurnHighlight(turn) {
  if (!playerContainer || !opponentContainer) return;

  if (turn === 'white') {
    if (playerIndex === 0) {
      playerContainer.classList.add('active-turn');
      opponentContainer.classList.remove('active-turn');
    } else {
      playerContainer.classList.remove('active-turn');
      opponentContainer.classList.add('active-turn');
    }
  } else if (turn === 'black') {
    if (playerIndex === 1) {
      playerContainer.classList.add('active-turn');
      opponentContainer.classList.remove('active-turn');
    } else {
      playerContainer.classList.remove('active-turn');
      opponentContainer.classList.add('active-turn');
    }
  } else {
    // no turn, remove all highlights
    playerContainer.classList.remove('active-turn');
    opponentContainer.classList.remove('active-turn');
  }
}

// Check if it is this player's turn (white = index 0, black = index 1)
export function isMyTurn(turn) {
  if (turn === 'white') return playerIndex === 0;
  if (turn === 'black') return playerIndex === 1;
  return false;
}