export default {
  // All default settings for this provider are co-located here.
  defaults: {
    modelName: 'gpt-4o',
    editablePrompt: `Correct the following text. Do not add any commentary or introductory phrases. Only return the corrected text itself.\n\n{text}`,
    nonEditablePrompt: `Translate the following text to Persian. if input is just one word, try to describe it. return only desired output as text no extra formatting. Here is the text : {text}`,
  },

  /**
   * The fetcher function specific to the OpenAI API.
   */
  fetcher: async (prompt: string, apiKey: string, modelName: string): Promise<string> => {
    const API_URL = 'https://api.openai.com/v1/chat/completions';

    const requestBody = {
      model: modelName,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ error: { message: 'Could not parse error response.' } }));
      throw new Error(`OpenAI API Error: ${response.status}. ${errorBody.error?.message || ''}`);
    }

    const data = await response.json();
    const resultText = data.choices?.[0]?.message?.content?.trim();

    if (typeof resultText !== 'string') {
      throw new Error('OpenAI API response was empty or in an unexpected format.');
    }

    return resultText;
  },
};
