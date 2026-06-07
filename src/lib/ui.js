// app.js 이식 — toast / confirmAsync. body에 직접 DOM 추가(React 트리 밖)라 그대로 동작.

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function ensureToastContainer() {
  let c = document.getElementById('toastContainer');
  if (!c) {
    c = document.createElement('div');
    c.id = 'toastContainer';
    c.className = 'toast-container';
    c.setAttribute('aria-live', 'polite');
    c.setAttribute('aria-atomic', 'true');
    document.body.appendChild(c);
  }
  return c;
}

export function toast(msg, opts) {
  opts = opts || {};
  const type = opts.type || 'info';
  const duration = opts.duration === undefined ? 3000 : opts.duration;
  const action = opts.action || null;
  const c = ensureToastContainer();
  const t = document.createElement('div');
  t.className = 'toast' + (type !== 'info' ? ' ' + type : '');
  t.setAttribute('role', type === 'error' ? 'alert' : 'status');

  const text = document.createElement('span');
  text.textContent = msg;
  t.appendChild(text);

  if (action) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'toast-action';
    btn.textContent = action.label;
    btn.addEventListener('click', () => { try { action.onClick(); } finally { dismissToast(t); } });
    t.appendChild(btn);
  }

  c.appendChild(t);
  if (duration > 0) setTimeout(() => dismissToast(t), duration);
  return t;
}

export function dismissToast(t) {
  if (!t || !t.parentNode) return;
  t.classList.add('dismissing');
  setTimeout(() => { if (t.parentNode) t.remove(); }, 200);
}

// Promise<boolean> 반환 — confirm() 대체
export function confirmAsync(msg, opts) {
  opts = opts || {};
  const title = opts.title || '확인';
  const okLabel = opts.okLabel || '확인';
  const cancelLabel = opts.cancelLabel || '취소';
  const danger = !!opts.danger;
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    const titleId = 'confirmTitle_' + Date.now();
    overlay.setAttribute('aria-labelledby', titleId);
    overlay.innerHTML =
      '<div class="confirm-modal">' +
        '<div class="confirm-title" id="' + titleId + '">' + escapeHtml(title) + '</div>' +
        '<div class="confirm-message">' + escapeHtml(msg) + '</div>' +
        '<div class="confirm-actions">' +
          '<button class="confirm-btn cancel" type="button">' + escapeHtml(cancelLabel) + '</button>' +
          '<button class="confirm-btn ' + (danger ? 'danger' : 'confirm') + '" type="button">' + escapeHtml(okLabel) + '</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    const cancelBtn = overlay.querySelector('.cancel');
    const okBtn = overlay.querySelector('.confirm-btn:not(.cancel)');
    const prevFocus = document.activeElement;

    function close(result) {
      document.removeEventListener('keydown', keyHandler);
      if (overlay.parentNode) overlay.remove();
      if (prevFocus && prevFocus.focus) prevFocus.focus();
      resolve(result);
    }
    function keyHandler(e) {
      if (e.key === 'Escape') { e.preventDefault(); close(false); }
      else if (e.key === 'Enter') { e.preventDefault(); close(true); }
    }

    cancelBtn.addEventListener('click', () => close(false));
    okBtn.addEventListener('click', () => close(true));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false); });
    document.addEventListener('keydown', keyHandler);
    okBtn.focus();
  });
}
