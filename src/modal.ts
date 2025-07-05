import './modal.css';

// Modal logic using <dialog> with Tailwind and DaisyUI classes
export function showTranslationModal(translation: string) {
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
}

// Listen for custom event to show modal
window.addEventListener('ai-text-helper-show-modal', (e: Event) => {
  const customEvent = e as CustomEvent;
  if (customEvent.detail && typeof customEvent.detail.translation === 'string') {
    showTranslationModal(customEvent.detail.translation);
  }
});
