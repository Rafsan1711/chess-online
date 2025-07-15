import { getCurrentUser } from './firebase.js';

// DOM Elements
const modal = document.getElementById("profile-modal");
const closeBtn = document.getElementById("close-profile");

const pic = document.getElementById("profile-pic");
const nameEl = document.getElementById("profile-name");
const ratingEl = document.getElementById("profile-rating");
const games = document.getElementById("total-games");
const wins = document.getElementById("total-wins");
const losses = document.getElementById("total-losses");

export function openProfileModal() {
  if (modal) modal.classList.remove("hidden");
}

export function closeProfileModal() {
  if (modal) modal.classList.add("hidden");
}

closeBtn?.addEventListener("click", closeProfileModal);

/**
 * Shows user profile in the modal
 * @param {Object} userData - must have photoURL, displayName, rating, games, wins, losses
 */
export function showProfileModal(userData) {
  if (pic) pic.src = userData.photoURL || 'default-profile-pic.png';
  if (nameEl) nameEl.textContent = userData.displayName || "Unknown Player";
  if (ratingEl) ratingEl.textContent = `Rating: ${userData.rating ?? 1000}`;
  if (games) games.textContent = userData.games ?? 0;
  if (wins) wins.textContent = userData.wins ?? 0;
  if (losses) losses.textContent = userData.losses ?? 0;
  openProfileModal();
}

/**
 * Fetches current logged-in user's profile data from Firebase DB and shows modal
 */
export async function fetchAndShowOwnProfile() {
  const user = getCurrentUser();
  if (!user) return;

  if (typeof firebase === 'undefined' || !firebase.database) {
    console.error("Firebase is not initialized.");
    return;
  }

  try {
    const snap = await firebase.database().ref(`users/${user.uid}`).get();
    const data = snap.val() || {};
    showProfileModal({ ...user, ...data });
  } catch (error) {
    console.error("Error fetching profile data:", error);
  }
}