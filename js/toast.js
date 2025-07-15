const container = document.getElementById('toast-container');

// Ensure container styles (if not in CSS)
container.style.position = 'fixed';
container.style.top = '1rem';
container.style.right = '1rem';
container.style.zIndex = '9999';

export function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.classList.add('toast', `toast-${type}`, 'shadow-lg');
  toast.style.cssText = `
    background: var(--toast-bg-${type}, #333);
    color: var(--toast-color-${type}, #fff);
    padding: 10px 16px;
    margin-bottom: 8px;
    border-radius: 6px;
    cursor: pointer;
    min-width: 200px;
    max-width: 320px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    opacity: 0;
    transform: translateX(100%);
    transition: opacity 0.3s ease, transform 0.3s ease;
  `;
  toast.textContent = message;

  // Add close button
  const closeBtn = document.createElement('span');
  closeBtn.textContent = '×';
  closeBtn.style.cssText = `
    float: right;
    margin-left: 8px;
    font-weight: bold;
    cursor: pointer;
  `;
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    removeToast(toast);
  });
  toast.appendChild(closeBtn);

  toast.addEventListener('click', () => {
    removeToast(toast);
  });

  container.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(0)';
  });

  // Auto remove after duration
  const timeoutId = setTimeout(() => {
    removeToast(toast);
  }, duration);

  function removeToast(toastElem) {
    clearTimeout(timeoutId);
    toastElem.style.opacity = '0';
    toastElem.style.transform = 'translateX(100%)';
    toastElem.addEventListener('transitionend', () => {
      if (toastElem.parentNode === container) {
        container.removeChild(toastElem);
      }
    });
  }
}