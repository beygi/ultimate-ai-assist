import browser from 'webextension-polyfill';

// --- Modal logic ---
const showTranslationModal = (translation: string) => {
  let dialog = document.getElementById('ai-text-helper-modal') as HTMLDialogElement | null;
  if (!dialog) {
    dialog = document.createElement('dialog');
    dialog.id = 'ai-text-helper-modal';
    dialog.innerHTML = `
      <div class='ai-assist-ultimate'>
      <form method="dialog" class="flex flex-col gap-4 p-6 w-full max-w-md bg-base-100 rounded-2xl shadow-2xl border border-base-200">
        <h2 class="text-xl font-bold text-primary">Translation Result</h2>
        <div id="ai-text-helper-modal-content" class="bg-base-200 rounded-lg p-4 text-base text-base-content whitespace-pre-wrap break-words"></div>
        <button class="btn btn-primary self-end">Close</button>
      </form>
      </div>
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
const BRAIN_BTN_CONTAINER_ID = 'ai-brain-btn-container';

function removeBrainBtn() {
  const container = document.getElementById(BRAIN_BTN_CONTAINER_ID);
  if (container) container.style.display = 'none';
}

function createBrainBtn(x: number, y: number) {
  let container = document.getElementById(BRAIN_BTN_CONTAINER_ID);
  if (container) {
    container.style.left = `${x}px`;
    container.style.top = `${y}px`;
    container.style.display = 'block';
  } else {
    container = document.createElement('div');
    container.id = BRAIN_BTN_CONTAINER_ID;
    container.style.position = 'absolute';
    container.style.left = `${x}px`;
    container.style.top = `${y}px`;
    container.style.zIndex = '2147483647';
    container.style.pointerEvents = 'none';
    container.style.backgroundColor = 'transparent';

    // Attach shadow root
    const shadow = container.attachShadow({ mode: 'open' });

    // Add Tailwind/DaisyUI CSS to shadow root
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = browser.runtime.getURL('options.css');
    shadow.appendChild(style);

    const shadowRootEl = document.createElement('div');
    shadowRootEl.style.backgroundColor = 'transparent';
    shadowRootEl.id = 'ai-brain-btn-shadow-root';
    const siteColorScheme = getComputedStyle(document.documentElement).colorScheme;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (siteColorScheme.includes('dark') && !siteColorScheme.includes('light')) {
      shadowRootEl.setAttribute('data-theme', 'dark');
    } else if (siteColorScheme.includes('light') && !siteColorScheme.includes('dark')) {
      shadowRootEl.setAttribute('data-theme', 'light');
    } else {
      shadowRootEl.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }
    shadowRootEl.setAttribute('data-theme', 'dark');

    // Create the button inside the shadow root
    const btn = document.createElement('button');
    btn.id = BRAIN_BTN_ID;
    btn.type = 'button';
    btn.innerHTML = `🧠`;
    btn.title = 'AI Assist';
    btn.className =
      'btn btn-circle btn-primary shadow-lg flex items-center justify-center w-12 h-12 text-xl z-[2147483647] transition duration-200 select-none cursor-pointer border-none p-0';
    btn.style.pointerEvents = 'auto';
    btn.addEventListener('mousedown', (e) => e.stopPropagation());
    btn.addEventListener('mouseup', (e) => e.stopPropagation());
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      browser.runtime.sendMessage({ command: 'process-text' });
      removeBrainBtn();
    });

    shadowRootEl.appendChild(btn);
    shadow.appendChild(shadowRootEl);
    document.body.appendChild(container);
  }
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
