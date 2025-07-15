import { getCurrentUser } from './firebase.js';

const notifBell = document.getElementById('notif-bell');
const notifDropdown = document.getElementById('notif-dropdown');

notifBell?.addEventListener('click', () => {
  notifDropdown?.classList.toggle('hidden');
});

export function initNotifications() {
  const user = getCurrentUser();
  if (!user) return;

  if (typeof firebase === 'undefined' || !firebase.database) {
    console.error("Firebase is not initialized.");
    return;
  }

  const notifRef = firebase.database().ref(`notifications/${user.uid}`);

  notifRef.limitToLast(10).on('value', (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      notifDropdown.innerHTML = '<div class="text-sm py-1">No notifications</div>';
      return;
    }

    const items = Object.values(data)
      .sort((a, b) => b.timestamp - a.timestamp)
      .map(n => `<div class="text-sm py-1 border-b border-gray-700">${n.message}</div>`)
      .join('');

    notifDropdown.innerHTML = items;
  });
}

/**
 * Send a notification message to another user
 * @param {string} uid - user ID of recipient
 * @param {string} message - notification message
 */
export function sendNotification(uid, message) {
  if (typeof firebase === 'undefined' || !firebase.database) {
    console.error("Firebase is not initialized.");
    return;
  }

  const notif = {
    message,
    timestamp: Date.now()
  };

  firebase.database().ref(`notifications/${uid}`).push(notif).catch(err => {
    console.error("Failed to send notification:", err);
  });
}