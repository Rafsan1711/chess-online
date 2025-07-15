// ===== firebase.js =====
// Handles Firebase initialization, auth, rating, matchmaking, game sync

// --- Firebase Config ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getDatabase,
  ref,
  set,
  get,
  update,
  push,
  onValue,
  remove,
  orderByChild,
  query,
  limitToFirst
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// ---- Your Firebase config ----
const firebaseConfig = {
  apiKey: "AIzaSyDWbWkOSY5IA3LQuSjW5pFD0XQOWmK8mAE",
  authDomain: "chess-online-ac582.firebaseapp.com",
  databaseURL: "https://chess-online-ac582-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "chess-online-ac582",
  storageBucket: "chess-online-ac582.firebasestorage.app",
  messagingSenderId: "804954664189",
  appId: "1:804954664189:web:b45d833a39337ce8a6e294"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// --- Auth ---
const provider = new GoogleAuthProvider();

export function signInWithGoogle() {
  return signInWithPopup(auth, provider);
}

export function signOutUser() {
  return signOut(auth);
}

export function onAuthStateChangedCustom(callback) {
  onAuthStateChanged(auth, callback);
}

export function getCurrentUser() {
  return auth.currentUser;
}

// --- User Profile ---
export async function initUserProfile(uid, displayName, photoURL) {
  const userRef = ref(db, `users/${uid}`);
  const snap = await get(userRef);
  if (!snap.exists()) {
    await set(userRef, {
      displayName,
      displayNameLower: displayName.toLowerCase(),
      photoURL,
      rating: 1200,
      games: 0,
      wins: 0,
      losses: 0,
      draws: 0
    });
  }
}

// --- Rating Update ---
export async function updateRating(uid, delta, result) {
  const userRef = ref(db, `users/${uid}`);
  const snap = await get(userRef);
  if (snap.exists()) {
    const data = snap.val();
    const updates = {
      rating: Math.max(0, (data.rating || 1200) + delta),
      games: (data.games || 0) + 1
    };
    if (result === 'win') updates.wins = (data.wins || 0) + 1;
    if (result === 'loss') updates.losses = (data.losses || 0) + 1;
    if (result === 'draw') updates.draws = (data.draws || 0) + 1;
    await update(userRef, updates);
  }
}

// --- Leaderboard Fetch ---
export async function fetchLeaderboard(limit = 10) {
  const snapshot = await get(ref(db, 'users'));
  const players = [];
  if (snapshot.exists()) {
    snapshot.forEach(child => {
      const data = child.val();
      players.push({ uid: child.key, ...data });
    });
  }
  players.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  return players.slice(0, limit);
}

// --- Matchmaking ---
export async function findOrCreateMatch(playerCount = 2) {
  const user = getCurrentUser();
  const userObj = {
    uid: user.uid,
    displayName: user.displayName,
    photoURL: user.photoURL,
    rating: 1200
  };

  const matchRef = push(ref(db, 'matches'));
  await set(matchRef, {
    players: [userObj],
    playerCount,
    status: 'waiting',
    timestamp: Date.now()
  });
  return matchRef.key;
}

export async function joinMatch(matchId, player) {
  const matchRef = ref(db, `matches/${matchId}`);
  const snap = await get(matchRef);
  if (!snap.exists()) throw new Error('Match not found.');

  const match = snap.val();
  if ((match.players || []).length < match.playerCount) {
    match.players.push(player);
    await update(matchRef, {
      players: match.players,
      status: match.players.length === match.playerCount ? 'ready' : 'waiting'
    });
  } else {
    throw new Error('Match full.');
  }
}

export function watchMatch(matchId, callback) {
  const matchRef = ref(db, `matches/${matchId}`);
  return onValue(matchRef, snap => {
    callback(snap.exists() ? snap.val() : null);
  });
}

export function removeMatch(matchId) {
  return remove(ref(db, `matches/${matchId}`));
}

// --- Match Result Submission ---
export async function submitMatchResult(matchId, userUid, result) {
  const matchRef = ref(db, `matches/${userUid}/${matchId}`);
  const matchData = {
    timestamp: Date.now(),
    opponentName: 'Unknown', // Fill if available
    result, // 'win', 'loss', 'draw'
    ratingChange: result === 'win' ? +12 : result === 'loss' ? -8 : 0
  };
  await set(matchRef, matchData);
  await updateRating(userUid, matchData.ratingChange, result);
}

// --- User Stats ---
export async function getUserStats(uid) {
  const snap = await get(ref(db, `users/${uid}`));
  const data = snap.val() || {};
  return {
    rating: data.rating || 1200,
    wins: data.wins || 0,
    losses: data.losses || 0,
    draws: data.draws || 0,
    games: data.games || 0
  };
}

// --- Exports ---
export { auth, db };
