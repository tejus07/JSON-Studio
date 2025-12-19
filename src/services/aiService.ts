export const fixJsonWithGemini = async (jsonContent: string, apiKey: string, preferredModel: string = 'auto'): Promise<{ fixed: string; explanation: string }> => {
    // 1. Get the best model dynamically, or use preferred
    let modelName = preferredModel;

    if (!modelName || modelName === 'auto') {
        modelName = await getBestModel(apiKey);
    }

    console.log('Using Gemini Model:', modelName);

    const PROMPT = `You are a JSON repair tool. Fix this invalid JSON and explain what was wrong.
    Rules:
    1. Output strictly a JSON object with this structure:
       {
         "fixed": "THE VALID JSON STRING HERE",
         "explanation": "Short summary of the syntax errors found (max 15 words)"
       }
    2. Do NOT use markdown fences around the Output JSON. Just raw JSON.
    3. The "fixed" field MUST be the valid, minified or mostly compact JSON.
    4. If it's already valid, just return it in "fixed" and say "Valid JSON" in explanation.
    
    Invalid JSON:
    ${jsonContent}`;

    try {
        // modelName usually comes as "models/gemini-..." from the list endpoint
        // If it doesn't have "models/" prefix, we might need to check.
        // The list endpoint returns "models/gemini-1.5-flash-001".
        // The generate URL is .../models/MODEL_NAME:generateContent
        // If modelName is "models/foo", url becomes .../models/models/foo... WRONG.
        // We need to ensure we don't double up or the URL is constructed correctly.

        // Correct URL Pattern: https://generativelanguage.googleapis.com/v1beta/{model=models/*}:generateContent
        // So if we have "models/gemini...", we put that in the path.

        const cleanModelName = modelName.startsWith('models/') ? modelName : `models/${modelName}`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/${cleanModelName}:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: PROMPT }] }],
                }),
            }
        );

        if (!response.ok) {
            const error = await response.json();

            // Handle Rate Limits specifically
            if (response.status === 429) {
                throw new Error('Rate limit exceeded. Please wait a moment before trying again.');
            }

            throw new Error(error.error?.message || 'Failed to contact Gemini');
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) throw new Error('No response from AI');

        // Clean up any markdown code blocks if the AI disobeyed
        const cleanText = text.replace(/```json\n?|```/g, '').trim();

        // Parse the result
        const result = JSON.parse(cleanText);
        let fixedString = typeof result.fixed === 'string' ? result.fixed : JSON.stringify(result.fixed);

        // Ensure it is pretty-printed for readability in the modal
        try {
            const parsedObj = JSON.parse(fixedString);
            fixedString = JSON.stringify(parsedObj, null, 2);
        } catch (e) {
            // If formatting fails (e.g. AI returned partial JSON), use original
            console.warn('Failed to format fixed JSON:', e);
        }

        return {
            fixed: fixedString,
            explanation: result.explanation || 'Fixed syntax errors'
        };

    } catch (error) {
        console.error('AI Fix Error:', error);
        // Fallback: If parsing fails, try to return basic fix logic or re-throw
        throw error;
    }
};

export const generateSchema = async (jsonContent: string, apiKey: string, preferredModel: string = 'auto'): Promise<string> => {
    return callGemini(
        jsonContent,
        apiKey,
        preferredModel,
        `You are a TypeScript expert. Generate a TypeScript interface for this JSON.
      Rules:
      1. Output ONLY the TypeScript code. No markdown fences.
      2. Use 'Root' as the main interface name.
      3. Use nice indentation.`
    );
};

export const explainJson = async (jsonContent: string, apiKey: string, preferredModel: string = 'auto'): Promise<string> => {
    return callGemini(
        jsonContent,
        apiKey,
        preferredModel,
        `Explain this JSON data in simple terms.
      Rules:
      1. Be concise. High-level summary of what this data represents.
      2. Mention key fields if important.
      3. No markdown formatting, just plain text or simple bullet points.`
    );
};

export const generateMockData = async (prompt: string, apiKey: string, preferredModel: string = 'auto'): Promise<string> => {
    // Note: For generation, the "content" passed to callGemini is actually the prompt itself.
    // We treat the prompt as the "JSON" argument in the helper, but the helper adds "JSON: ..." which is weird.
    // Let's create a specific helper or just call fetch directly. Reusing logic is better.
    // We will pass empty string as content and put everything in system prompt.

    return callGemini(
        '',
        apiKey,
        preferredModel,
        `Generate realistic JSON data based on this request: "${prompt}".
        Rules:
        1. Output ONLY valid JSON.
        2. Format nicely with 2 spaces.
        3. Make the data look real (names, emails, etc).`
    );
};

export const nlQuery = async (jsonContent: string, query: string, apiKey: string, preferredModel: string = 'auto'): Promise<string> => {
    return callGemini(
        jsonContent,
        apiKey,
        preferredModel,
        `Act as a JSON Query Engine. Filter/Extract data from the JSON below based on this query: "${query}".
        Rules:
        1. Output ONLY the resulting JSON data.
        2. If the query asks for a count, return {"count": N}.
        3. If the query asks for specific fields, return an array of objects with only those fields.
        4. Maintain original structure if just filtering.`
    );
};

export const smartConvert = async (jsonContent: string, format: string, apiKey: string, preferredModel: string = 'auto'): Promise<string> => {
    return callGemini(
        jsonContent,
        apiKey,
        preferredModel,
        `Convert the following JSON to ${format}.
        Rules:
        1. Output ONLY the converted code (e.g. valid CSV, YAML, XML).
        2. Do NOT wrap in markdown fences if possible, just the raw text.
        3. Ensure syntax is correct for ${format}.`
    );
};

// Helper to reuse the fetch logic
const callGemini = async (content: string, apiKey: string, preferredModel: string, systemPrompt: string): Promise<string> => {
    let modelName = preferredModel;

    if (!modelName || modelName === 'auto') {
        modelName = await getBestModel(apiKey);
    }

    const cleanModelName = modelName.startsWith('models/') ? modelName : `models/${modelName}`;
    const PROMPT = `${systemPrompt}\n\nJSON:\n${content}`;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/${cleanModelName}:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: PROMPT }] }] }),
            }
        );

        if (!response.ok) {
            const error = await response.json();
            if (response.status === 429) {
                throw new Error('Rate limit exceeded. Please wait a moment.');
            }
            throw new Error(error.error?.message || 'Failed to contact Gemini');
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error('No response from AI');

        return text.replace(/```typescript\n?|```json\n?|```/g, '').trim();
    } catch (error) {
        console.error('AI Error:', error);
        throw error;
    }
};

/**
 * Dynamically finds the best available model for the given API key.
 * Prioritizes: Gemini 1.5 Flash -> Gemini 1.5 Pro -> Gemini 1.0 Pro.
 */
export const getBestModel = async (apiKey: string): Promise<string> => {
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        );

        if (!response.ok) {
            // Fallback if listing fails (e.g., restricted key scope), try stable 1.5 flash
            console.warn('Failed to list models, defaulting to 1.5-flash-001');
            return 'gemini-1.5-flash-001';
        }

        const data = await response.json();
        const models = data.models || [];

        // Filter for models that support generateContent
        const validModels = models.filter((m: any) =>
            m.supportedGenerationMethods?.includes('generateContent')
        );

        // Helper to check if model name contains string
        const has = (m: any, s: string) => m.name.includes(s);

        // Priority list
        const best =
            validModels.find((m: any) => has(m, 'gemini-1.5-flash')) ||
            validModels.find((m: any) => has(m, 'gemini-1.5-pro')) ||
            validModels.find((m: any) => has(m, 'gemini-1.0-pro')) ||
            validModels.find((m: any) => has(m, 'gemini-pro')) ||
            validModels[0];

        if (!best) throw new Error('No compatible Gemini models found for this key.');

        // API expects "models/model-name" or just "model-name". The list returns "models/..."
        // We strip "models/" prefix just in case, or keep it depending on exact API needs.
        // v1beta usually accepts "models/gemini-..." or just "gemini-..."
        // Let's use the full name returned by the API.
        return best.name;
    } catch (e) {
        console.error('Error fetching models:', e);
        return 'gemini-1.5-flash-001'; // Ultimate fallback
    }
};

/**
 * Lists all available models for the given API key.
 */
export const listModels = async (apiKey: string): Promise<any[]> => {
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        );

        if (!response.ok) return [];

        const data = await response.json();
        return (data.models || []).filter((m: any) =>
            m.supportedGenerationMethods?.includes('generateContent')
        );
    } catch (e) {
        console.error('Error fetching models:', e);
        return [];
    }
};
