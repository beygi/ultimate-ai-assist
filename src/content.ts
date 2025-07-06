import browser from 'webextension-polyfill';

// --- Modal logic ---
const showTranslationModal = (translation: string) => {
  setContainerHtml(`
        <dialog id="my_modal" class="modal" open style="background: transparent;">
              <div class="modal-box w-80">
                <form method="dialog">
                  <!-- if there is a button in form, it will close the modal -->
                  <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
                </form>
                <div class="py-4 text-start" dir="auto">
                    ${translation}
                </div>
              </div>
                    <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
            </dialog>
    `);
};

browser.runtime.onMessage.addListener((message) => {
  if (message.command === 'text-replaced') {
    setContainerHtml('');
  }
  if (message.command === 'loading') {
    setContainerHtml(`
          <div class="flex items-center justify-center w-16 h-16 bg-accent rounded-full">
              <span class="loading loading-ring w-full h-full m-1 text-primary"></span>
          </div>
        `);
  }
  if (message.command === 'show-error') {
    showTranslationModal(message.text);
  }
  if (message.command === 'show-modal') {
    showTranslationModal(message.text);
  }
});

const SHADOW_ID = 'ultimate-ai-assist-shadow';
const SHADOW_CONTAINER_ID = 'ultimate-ai-assist-shadow-container';

const getShadow = (x?: number, y?: number) => {
  let container = document.getElementById(SHADOW_ID);
  if (container && container.shadowRoot) {
    // If the container already exists, just update its position when x and y are provided
    if (x !== undefined && y !== undefined) {
      container.style.left = `${x}px`;
      container.style.top = `${y}px`;
    }
    container.style.display = 'block';
    return container.shadowRoot;
  } else {
    if (container) container.remove();

    container = document.createElement('div');
    container.id = SHADOW_ID;
    container.style.position = 'absolute';
    container.style.left = `${x}px`;
    container.style.top = `${y}px`;
    container.style.zIndex = '2147483647';
    container.style.pointerEvents = 'none';
    container.style.backgroundColor = 'transparent';

    // Attach shadow root
    const shadow = container.attachShadow({ mode: 'open' });

    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = browser.runtime.getURL('options.css');
    shadow.appendChild(style);

    const siteColorScheme = getComputedStyle(document.documentElement).colorScheme;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    let theme = 'light';
    if (siteColorScheme.includes('dark') && !siteColorScheme.includes('light')) {
      theme = 'dark';
    } else if (siteColorScheme.includes('light') && !siteColorScheme.includes('dark')) {
      theme = 'light';
    } else {
      theme = prefersDark ? 'dark' : 'light';
    }

    const shadowContainer = document.createElement('div');
    shadowContainer.id = SHADOW_CONTAINER_ID;
    shadowContainer.dataset.theme = theme;
    shadowContainer.style.backgroundColor = 'transparent';
    shadowContainer.style.fontSize = '16px'; // Reset font-size for consistent rem units
    shadow.appendChild(shadowContainer);
    document.body.appendChild(container);
    return shadow;
  }
};

const hideShadowContainer = () => {
  const container = document.getElementById(SHADOW_ID);
  if (container) {
    container.style.display = 'none';
  }
};

const getContainer = () => {
  const shadow = getShadow();
  return shadow.getElementById(SHADOW_CONTAINER_ID) || false;
};

const setContainerHtml = (html: string) => {
  const shadowContainer = getContainer();
  if (shadowContainer) {
    shadowContainer.innerHTML = html;
  } else {
    console.error('Shadow container not found');
  }
};

const createButton = () => {
  const BTN_ID = 'ultimate-ai-assist-btn';
  const iconUrl = browser.runtime.getURL('icon.png');
  const shadow = getShadow();
  if (shadow.getElementById(BTN_ID)) return;
  setContainerHtml(`
    <button id="${BTN_ID}" class="w-16 h-16 btn btn-circle btn-accent" style="pointer-events: auto;">
                <img class="m-1" src="${iconUrl}"
    </button>
  `);
  const btn = shadow.getElementById(BTN_ID);
  if (btn) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      browser.runtime.sendMessage({ command: 'process-text' });
    });
    btn.addEventListener('mousedown', (e) => e.stopPropagation());
    btn.addEventListener('mouseup', (e) => e.stopPropagation());
  }
};

function showButtonNearSelection(e: MouseEvent) {
  const container = document.getElementById(SHADOW_ID);
  // Check if the click target is the shadow host element or any element inside it

  if (container && e.target === container) {
    return;
  }
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || !selection.toString().trim()) {
    hideShadowContainer();
    return;
  }
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) {
    hideShadowContainer();
    return;
  }
  // Place button at top-right of selection
  const x = rect.right + window.scrollX + 8;
  const y = rect.top + window.scrollY - 8;
  getShadow(x, y);
  createButton();
}

document.addEventListener('mouseup', showButtonNearSelection);
