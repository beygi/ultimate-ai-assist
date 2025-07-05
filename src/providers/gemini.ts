export default {
  // All default settings for this provider are co-located here.
  defaults: {
    modelName: 'gemini-1.5-flash',
    editablePrompt: `Correct the following text. Do not add any commentary or introductory phrases. Only return the corrected text itself.\n\n{text}`,
    nonEditablePrompt: `Translate the following text to both English and Persian. Format the response clearly with labels, for example:\n\nEnglish: [Translation]\nPersian: [Translation]\n\nText to translate: {text}`,
  },

  /**
   * The fetcher function specific to the Google Gemini API.
   */
  fetcher: async (prompt: string, apiKey: string, modelName: string): Promise<string> => {
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ error: { message: 'Could not parse error response.' } }));
      throw new Error(`Gemini API Error: ${response.status}. ${errorBody.error?.message || ''}`);
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (typeof resultText !== 'string') {
      throw new Error('Gemini API response was empty or in an unexpected format.');
    }

    return resultText;
  },
};
