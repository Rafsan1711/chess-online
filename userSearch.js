import { db } from './firebase.js';

const input = document.getElementById('user-search-input');
const resultsDiv = document.getElementById('user-search-results');

// userSearch.js
import { showLoading, hideLoading } from './loading.js';

input.addEventListener('input', async () => {
  const query = input.value.trim().toLowerCase();
  if (query.length < 2) {
    resultsDiv.classList.add('hidden');
    resultsDiv.innerHTML = '';
    return;
  }

  showLoading(); // 🔵 Show loader while fetching

  try {
    const snapshot = await db.ref('users')
      .orderByChild('displayNameLower')
      .startAt(query)
      .endAt(query + "\uf8ff")
      .limitToFirst(10)
      .once('value');

    // ... render results

  } finally {
    hideLoading(); // 🔵 Always hide loader
  }
});

    const users = snapshot.val() || {};
    const userList = Object.values(users);

    if (userList.length === 0) {
      resultsDiv.innerHTML = '<div class="p-2 text-gray-500 dark:text-gray-400">No users found.</div>';
      resultsDiv.classList.remove('hidden');
      return;
    }

    resultsDiv.innerHTML = userList.map(user => `
      <div class="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer flex items-center" tabindex="0" role="button" aria-label="Select user ${user.displayName}" data-uid="${user.uid}">
        <img src="${user.photoURL || 'default-avatar.png'}" alt="Avatar of ${user.displayName}" class="w-8 h-8 rounded-full mr-2 object-cover">
        <div>
          <p class="font-semibold">${user.displayName}</p>
          <p class="text-sm text-gray-500 dark:text-gray-400">${user.email || ''}</p>
        </div>
      </div>
    `).join('');
    resultsDiv.classList.remove('hidden');

  } catch (error) {
    console.error('User search failed:', error);
    resultsDiv.innerHTML = '<div class="p-2 text-red-600">Failed to search users.</div>';
    resultsDiv.classList.remove('hidden');
  }
});

// Hide results if clicking outside
document.addEventListener('click', (e) => {
  if (!resultsDiv.contains(e.target) && e.target !== input) {
    resultsDiv.classList.add('hidden');
  }
});

// Optional: handle keyboard navigation and selection
resultsDiv.addEventListener('keydown', (e) => {
  const focusable = Array.from(resultsDiv.querySelectorAll('[tabindex="0"]'));
  const index = focusable.indexOf(document.activeElement);
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    const nextIndex = (index + 1) % focusable.length;
    focusable[nextIndex].focus();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    const prevIndex = (index - 1 + focusable.length) % focusable.length;
    focusable[prevIndex].focus();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (document.activeElement && document.activeElement.dataset.uid) {
      const uid = document.activeElement.dataset.uid;
      // TODO: Trigger selection or invitation for that user uid
      console.log('Selected user uid:', uid);
      resultsDiv.classList.add('hidden');
    }
  }
});