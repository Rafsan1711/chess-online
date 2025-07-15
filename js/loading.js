// ===== loading.js =====
const spinner = document.getElementById('loading-spinner');

export function showLoading() {
  spinner.classList.remove('hidden');
}

export function hideLoading() {
  spinner.classList.add('hidden');
}