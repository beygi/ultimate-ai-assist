import browser from 'webextension-polyfill';
import { DEFAULTS } from './defaults';

type Provider = 'gemini' | 'openai';

type ResolvedSettings = {
  provider: Provider;
  apiKey: string;
  modelName: string;
  editablePrompt: string;
  nonEditablePrompt: string;
};

/**
 * Retrieves and resolves settings for the currently selected provider.
 */
const getResolvedSettings = async (): Promise<ResolvedSettings> => {
  const stored = await browser.storage.local.get(null);
  const provider: Provider = (stored.selectedProvider as Provider) || DEFAULTS.selectedProvider;

  const providerModule = await import(`./providers/${provider}.ts`);
  const providerDefaults = providerModule.default.defaults;

  const providerKey = (key: string) => `${provider}${key.charAt(0).toUpperCase() + key.slice(1)}`;

  return {
    provider,
    apiKey: (stored[providerKey('apiKey')] as string) || '',
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
    // TODO : notification
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

const processText = async (): Promise<void> => {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  try {
    const injectionResults = await browser.scripting.executeScript({
      target: { tabId: tab.id },
      func: getSelectionContext,
    });
    const { selectedText, isEditable } = injectionResults[0].result as { selectedText: string; isEditable: boolean };
    if (!selectedText) return;
    const settings = await getResolvedSettings();
    const promptTemplate = isEditable ? settings.editablePrompt : settings.nonEditablePrompt;
    const finalPrompt = promptTemplate.replace('{text}', selectedText);
    browser.tabs.sendMessage(tab.id, { command: 'loading' });
    const aiResponse = await callAIService(finalPrompt);
    if (isEditable) {
      await browser.scripting.executeScript({
        target: { tabId: tab.id },
        func: replaceSelectedText,
        args: [aiResponse],
      });
      browser.tabs.sendMessage(tab.id, { command: 'text-replaced', text: aiResponse });
    } else {
      browser.tabs.sendMessage(tab.id, { command: 'show-modal', text: aiResponse });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    browser.tabs.sendMessage(tab.id, { command: 'show-error', text: errorMessage.toString() });
  }
};

browser.action.onClicked.addListener(() => {
  browser.runtime.openOptionsPage();
});

browser.commands.onCommand.addListener(async (commandName: string) => {
  if (commandName !== 'process-text') return;
  await processText();
});

browser.runtime.onMessage.addListener(async (message) => {
  if (message.command === 'process-text') {
    await processText();
  }
});
