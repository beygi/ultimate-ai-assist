import browser from 'webextension-polyfill';
import { DEFAULTS } from './defaults';
import gemini from './providers/gemini';
import openai from './providers/openai';

type Provider = 'gemini' | 'openai';

const PROVIDER_MODULES = { gemini, openai };

// --- Type-safe UI Element Getters ---
const getElement = <T extends HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Element "${id}" not found.`);
  return el as T;
};

const apiKeyInput = getElement<HTMLInputElement>('api-key');
const modelNameInput = getElement<HTMLInputElement>('model-name');
const editablePromptTextarea = getElement<HTMLTextAreaElement>('editable-prompt');
const nonEditablePromptTextarea = getElement<HTMLTextAreaElement>('non-editable-prompt');
const optionsForm = getElement<HTMLFormElement>('options-form');
const providerSelect = getElement<HTMLSelectElement>('provider-select');

let currentProvider: Provider = DEFAULTS.selectedProvider;

const showToast = (message: string, type: 'success' | 'error' = 'success'): void => {
  const c = getElement('status-toast');
  c.innerHTML = `<div class="alert alert-${type} shadow-lg"><div><span>${message}</span></div></div>`;
  setTimeout(() => {
    c.innerHTML = '';
  }, 3000);
};

/**
 * Saves the settings for the currently displayed provider.
 */
const saveCurrentProviderSettings = async (): Promise<void> => {
  const providerKey = (key: string) => `${currentProvider}${key.charAt(0).toUpperCase() + key.slice(1)}`;
  const settingsToSave = {
    selectedProvider: currentProvider,
    [providerKey('apiKey')]: apiKeyInput.value,
    [providerKey('modelName')]: modelNameInput.value,
    [providerKey('editablePrompt')]: editablePromptTextarea.value,
    [providerKey('nonEditablePrompt')]: nonEditablePromptTextarea.value,
  };
  await browser.storage.local.set(settingsToSave);
};

/**
 * Loads settings for a given provider and populates the UI fields.
 */
const loadProviderSettings = async (provider: Provider): Promise<void> => {
  currentProvider = provider;
  providerSelect.value = provider;

  const providerDefaults = PROVIDER_MODULES[provider].defaults;

  const providerKey = (key: string) => `${provider}${key.charAt(0).toUpperCase() + key.slice(1)}`;
  const storageKeys = {
    apiKey: providerKey('apiKey'),
    modelName: providerKey('modelName'),
    editablePrompt: providerKey('editablePrompt'),
    nonEditablePrompt: providerKey('nonEditablePrompt'),
  };

  const result = await browser.storage.local.get(Object.values(storageKeys));

  apiKeyInput.value = result[storageKeys.apiKey] || '';
  modelNameInput.value = result[storageKeys.modelName] || providerDefaults.modelName;
  editablePromptTextarea.value = result[storageKeys.editablePrompt] || providerDefaults.editablePrompt;
  nonEditablePromptTextarea.value = result[storageKeys.nonEditablePrompt] || providerDefaults.nonEditablePrompt;
};

const handleProviderChange = async () => {
  const newProvider = providerSelect.value as Provider;
  await saveCurrentProviderSettings(); // Save before switching
  await loadProviderSettings(newProvider);
  showToast(`Switched to ${newProvider}. Settings loaded.`);
};

const handleReset = async (field: 'modelName' | 'editablePrompt' | 'nonEditablePrompt') => {
  const providerDefaults = PROVIDER_MODULES[currentProvider].defaults;
  const defaultValue = providerDefaults[field];

  if (field === 'modelName') modelNameInput.value = defaultValue;
  if (field === 'editablePrompt') editablePromptTextarea.value = defaultValue;
  if (field === 'nonEditablePrompt') nonEditablePromptTextarea.value = defaultValue;

  showToast(`${field} reset to default for ${currentProvider}.`);
};

const applySystemTheme = (isDarkMode: boolean) => {
  document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
};

document.addEventListener('DOMContentLoaded', async () => {
  const { selectedProvider = DEFAULTS.selectedProvider } = await browser.storage.local.get('selectedProvider');
  await loadProviderSettings(selectedProvider);

  const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  applySystemTheme(darkModeMediaQuery.matches);
  darkModeMediaQuery.addEventListener('change', (e) => applySystemTheme(e.matches));

  optionsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveCurrentProviderSettings();
    showToast('Settings saved successfully!');
  });

  providerSelect.addEventListener('change', handleProviderChange);
  getElement('reset-model').addEventListener('click', () => handleReset('modelName'));
  getElement('reset-editable').addEventListener('click', () => handleReset('editablePrompt'));
  getElement('reset-non-editable').addEventListener('click', () => handleReset('nonEditablePrompt'));
});
