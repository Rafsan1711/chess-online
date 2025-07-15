import { getCurrentUser } from './firebase.js';

const modal = document.getElementById("match-history-modal");
const closeBtn = document.getElementById("close-match-history");
const listDiv = document.getElementById("match-history-list");

closeBtn?.addEventListener("click", () => {
  modal.classList.add("hidden");
});

function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString() + " " + d.toLocaleTimeString();
}

function getResultIcon(result) {
  switch (result) {
    case "win":
      return '<span class="text-green-600 font-bold">✔️</span>';
    case "loss":
      return '<span class="text-red-600 font-bold">❌</span>';
    case "draw":
      return '<span class="text-yellow-600 font-bold">➖</span>';
    default:
      return '';
  }
}

export async function showMatchHistory() {
  const user = getCurrentUser();
  if (!user) {
    alert("Please login first.");
    return;
  }

  if (typeof firebase === "undefined" || !firebase.database) {
    console.error("Firebase is not initialized.");
    return;
  }

  try {
    const snapshot = await firebase.database()
      .ref(`matches/${user.uid}`)
      .orderByChild("timestamp")
      .limitToLast(50)
      .once("value");

    const matches = snapshot.val() || {};
    const matchesArr = Object.values(matches).sort((a, b) => b.timestamp - a.timestamp);

    if (matchesArr.length === 0) {
      listDiv.innerHTML = "<p class='text-center text-gray-500 dark:text-gray-400'>No matches played yet.</p>";
    } else {
      listDiv.innerHTML = matchesArr.map(m => {
        const dateStr = formatDate(m.timestamp);
        const opponentName = m.opponentName || "Unknown";
        const resultIcon = getResultIcon(m.result);
        const ratingChange = m.ratingChange >= 0 ? `+${m.ratingChange}` : m.ratingChange;

        return `
          <div class="py-2 flex justify-between items-center border-b border-gray-300 dark:border-gray-700">
            <div>
              <p class="font-semibold">${opponentName}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">${dateStr}</p>
            </div>
            <div class="text-right">
              <p>${resultIcon}</p>
              <p class="text-sm">${ratingChange}</p>
            </div>
          </div>
        `;
      }).join("");
    }

    modal.classList.remove("hidden");
  } catch (error) {
    console.error("Failed to fetch match history:", error);
    listDiv.innerHTML = "<p class='text-center text-red-600'>Failed to load match history.</p>";
    modal.classList.remove("hidden");
  }
}