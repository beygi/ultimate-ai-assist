import browser from 'webextension-polyfill';
import { DEFAULTS } from './defaults';
import geminiProvider from './providers/gemini';
import openaiProvider from './providers/openai';

type Provider = 'gemini' | 'openai';

const providers = {
  gemini: geminiProvider,
  openai: openaiProvider,
};

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
  const providerModule = providers[provider];
  const providerDefaults = providerModule.defaults;
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

  const providerModule = providers[settings.provider];
  return providerModule.fetcher(prompt, settings.apiKey, settings.modelName);
};

// --- Core Extension Logic ---

const processText = async (selectedText: string, isEditable: boolean): Promise<void> => {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  console.log(selectedText);
  try {
    if (!selectedText) return;
    const settings = await getResolvedSettings();
    const promptTemplate = isEditable ? settings.editablePrompt : settings.nonEditablePrompt;
    const finalPrompt = promptTemplate.replace('{text}', selectedText);
    browser.tabs.sendMessage(tab.id, { command: 'loading' });
    const aiResponse = await callAIService(finalPrompt);
    browser.tabs.sendMessage(tab.id, { command: 'show-modal', aiResponse, selectedText, isEditable });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    browser.tabs.sendMessage(tab.id, { command: 'show-error', text: errorMessage.toString() });
  }
};

browser.action.onClicked.addListener(() => {
  browser.runtime.openOptionsPage();
});

// browser.commands.onCommand.addListener(async (commandName: string) => {
//   if (commandName !== 'process-text') return;
//   await processText();
// });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
browser.runtime.onMessage.addListener(async (message: any) => {
  if (message.command === 'process-text') {
    await processText(message.selectedText, message.isEditable);
  }
});
