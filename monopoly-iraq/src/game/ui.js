// مكونات واجهة عامة: نوافذ حوار Dialog وتنبيهات Toast

export function showModal(innerHtml, { onClose } = {}) {
  const root = document.getElementById('modal-root');
  root.innerHTML = `<div class="modal-overlay">${innerHtml}</div>`;
  const overlay = root.querySelector('.modal-overlay');
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay && onClose) {
      onClose();
      closeModal();
    }
  });
  return overlay;
}

export function closeModal() {
  const root = document.getElementById('modal-root');
  root.innerHTML = '';
}

export function showToast(message) {
  const root = document.getElementById('toast-root');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  root.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 2600);
}
