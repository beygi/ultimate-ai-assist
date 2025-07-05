import './modal.css';
import browser from 'webextension-polyfill';

// --- Modal logic ---
const showTranslationModal = (translation: string) => {
  let dialog = document.getElementById('ai-text-helper-modal') as HTMLDialogElement | null;
  if (!dialog) {
    dialog = document.createElement('dialog');
    dialog.id = 'ai-text-helper-modal';
    dialog.innerHTML = `
      <form method="dialog" class="flex flex-col gap-4 p-6 w-full max-w-md bg-base-100 rounded-2xl shadow-2xl border border-base-200">
        <h2 class="text-xl font-bold text-primary">Translation Result</h2>
        <div id="ai-text-helper-modal-content" class="bg-base-200 rounded-lg p-4 text-base text-base-content whitespace-pre-wrap break-words"></div>
        <button class="btn btn-primary self-end">Close</button>
      </form>
    `;
    document.body.appendChild(dialog);
  }
  const content = dialog.querySelector('#ai-text-helper-modal-content');
  if (content) content.textContent = translation;
  dialog.showModal();
};

browser.runtime.onMessage.addListener((message) => {
  if (message.command === 'loading') {
    alert('Loading... Please wait.');
  }
  if (message.command === 'show-modal') {
    alert('Show modal');
    showTranslationModal(message.text);
  }
});

// --- Brain button logic ---
const BRAIN_BTN_ID = 'ai-brain-btn';

function removeBrainBtn() {
  const oldBtn = document.getElementById(BRAIN_BTN_ID);
  if (oldBtn) oldBtn.remove();
}

function createBrainBtn(x: number, y: number) {
  removeBrainBtn();
  const btn = document.createElement('button');
  btn.id = BRAIN_BTN_ID;
  btn.type = 'button';
  btn.innerText = '🧠';
  btn.title = 'AI Assist';
  btn.style.position = 'absolute';
  btn.style.left = `${x}px`;
  btn.style.top = `${y}px`;
  btn.style.zIndex = '2147483647';
  btn.style.background = '#fff';
  btn.style.border = 'none';
  btn.style.borderRadius = '9999px';
  btn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
  btn.style.padding = '0.25rem 0.5rem';
  btn.style.fontSize = '1.25rem';
  btn.style.cursor = 'pointer';
  btn.style.transition = 'box-shadow 0.2s';
  btn.style.userSelect = 'none';
  btn.style.display = 'flex';
  btn.style.alignItems = 'center';
  btn.style.justifyContent = 'center';
  btn.style.minWidth = '2rem';
  btn.style.minHeight = '2rem';
  btn.style.maxWidth = '2.5rem';
  btn.style.maxHeight = '2.5rem';
  btn.style.pointerEvents = 'auto';
  btn.addEventListener('mousedown', (e) => e.stopPropagation());
  btn.addEventListener('mouseup', (e) => e.stopPropagation());
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    browser.runtime.sendMessage({ command: 'process-text' });
  });
  document.body.appendChild(btn);
}

function showBrainBtnNearSelection() {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || !selection.toString().trim()) {
    removeBrainBtn();
    return;
  }
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) {
    removeBrainBtn();
    return;
  }
  // Place button at top-right of selection
  const x = rect.right + window.scrollX + 8;
  const y = rect.top + window.scrollY - 8;
  createBrainBtn(x, y);
}

document.addEventListener('selectionchange', showBrainBtnNearSelection);
document.addEventListener('mousedown', removeBrainBtn);
//document.addEventListener('scroll', removeBrainBtn, true);
