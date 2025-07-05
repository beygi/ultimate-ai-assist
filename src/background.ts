import browser from 'webextension-polyfill';
import { DEFAULTS } from './defaults';

type Provider = 'gemini' | 'openai';

interface ResolvedSettings {
  provider: Provider;
  apiKey: string;
  modelName: string;
  editablePrompt: string;
  nonEditablePrompt: string;
}

/**
 * Retrieves and resolves settings for the currently selected provider.
 */
const getResolvedSettings = async (): Promise<ResolvedSettings> => {
  const stored = await browser.storage.local.get(null);
  const provider = stored.selectedProvider || DEFAULTS.selectedProvider;

  const providerModule = await import(`./providers/${provider}.ts`);
  const providerDefaults = providerModule.default.defaults;

  const providerKey = (key: string) => `${provider}${key.charAt(0).toUpperCase() + key.slice(1)}`;

  return {
    provider,
    apiKey: stored[providerKey('apiKey')] || '',
    modelName: stored[providerKey('modelName')] || providerDefaults.modelName,
    editablePrompt: stored[providerKey('editablePrompt')] || providerDefaults.editablePrompt,
    nonEditablePrompt: stored[providerKey('nonEditablePrompt')] || providerDefaults.nonEditablePrompt,
  };
};

/**
 * Main function to call the selected AI service.
 */
const callAIService = async (prompt: string): Promise<string> => {
  const settings = await getResolvedSettings();

  if (!settings.apiKey) {
    throw new Error(`API Key for ${settings.provider} is not set. Please configure it in the options.`);
  }

  const providerModule = await import(`./providers/${settings.provider}.ts`);
  return providerModule.default.fetcher(prompt, settings.apiKey, settings.modelName);
};

// --- Core Extension Logic ---
const getSelectionContext = (): { selectedText: string; isEditable: boolean } => {
  const activeElement = document.activeElement as HTMLElement;
  const isEditable =
    activeElement &&
    (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.isContentEditable);
  const selectedText = window.getSelection()?.toString().trim() || '';
  return { selectedText, isEditable };
};

const replaceSelectedText = (text: string): void => {
  document.execCommand('insertText', false, text);
};

const showNotification = (title: string, message: string): void => {
  browser.notifications.create({ type: 'basic', iconUrl: browser.runtime.getURL('icons/icon-48.svg'), title, message });
};

browser.action.onClicked.addListener(() => {
  browser.runtime.openOptionsPage();
});
browser.commands.onCommand.addListener(async (commandName: string) => {
  if (commandName !== 'process-text') return;
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  try {
    const injectionResults = await browser.scripting.executeScript({
      target: { tabId: tab.id },
      func: getSelectionContext,
    });
    const { selectedText, isEditable } = injectionResults[0].result as { selectedText: string; isEditable: boolean };
    if (!selectedText) {
      showNotification('AI Text Helper', 'No text was selected.');
      return;
    }

    const settings = await getResolvedSettings();
    const promptTemplate = isEditable ? settings.editablePrompt : settings.nonEditablePrompt;
    const finalPrompt = promptTemplate.replace('{text}', selectedText);

    showNotification('AI Text Helper', `Processing with ${settings.provider}...`);
    const aiResponse = await callAIService(finalPrompt);

    if (isEditable) {
      await browser.scripting.executeScript({
        target: { tabId: tab.id },
        func: replaceSelectedText,
        args: [aiResponse],
      });
    } else {
      // Instead of notification, inject modal script and show modal with translation
      await browser.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['modal.js'],
      });
      await browser.scripting.executeScript({
        target: { tabId: tab.id },
        func: (translation) => {
          window.dispatchEvent(new CustomEvent('ai-text-helper-show-modal', { detail: { translation } }));
        },
        args: [aiResponse],
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    showNotification('AI Text Helper Error', errorMessage);
  }
});
