export const fixJsonWithGemini = async (jsonContent: string, apiKey: string, preferredModel: string = 'auto'): Promise<{ fixed: string; explanation: string }> => {
    // 1. Get the best model dynamically, or use preferred
    let modelName = preferredModel;

    if (!modelName || modelName === 'auto') {
        modelName = await getBestModel(apiKey);
    }

    console.log('Using Gemini Model:', modelName);

    const isLargeFile = jsonContent.length > 50000;

    // Default strategy: Full rewrite (works for small files)
    let PROMPT = `You are a JSON repair tool. Fix this invalid JSON and explain what was wrong.
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

    // Large File Strategy: Snippet Fixing
    let snippetContext = null;
    if (isLargeFile) {
        try {
            JSON.parse(jsonContent);
            return { fixed: jsonContent, explanation: 'Valid JSON' };
        } catch (e: any) {
            // Find error position
            const errorMsg = e.message;
            let errorIndex = -1;

            // Try to extract position from "at position N" or "line X column Y"
            const matchPos = errorMsg.match(/position (\d+)/);
            if (matchPos) {
                errorIndex = parseInt(matchPos[1], 10);
            } else {
                // Very basic fallback if we can't find index: just take last 20k chars
                // This is weak, but better than failing. Ideally we use a better parser logic.
                errorIndex = jsonContent.length - 1;
            }

            if (errorIndex !== -1) {
                const start = Math.max(0, errorIndex - 2000); // 2000 chars before
                const end = Math.min(jsonContent.length, errorIndex + 2000); // 2000 chars after
                const snippet = jsonContent.slice(start, end);
                snippetContext = { start, end, original: snippet };

                PROMPT = `You are a JSON repair tool. I have a syntax error in a large file around specific characters.
                Fix the snippet below.
                
                Error Context: "${errorMsg}"
                
                Rules:
                1. Output strictly a JSON object:
                   {
                     "fixedSnippet": "THE FIXED STRING SEGMENT ONLY",
                     "explanation": "What you fixed"
                   }
                2. The "fixedSnippet" must replace the invalid part of the input snippet perfectly so it fits back into the file.
                3. Do NOT wrap output in markdown.

                Invalid Snippet:
                ${snippet}`;
            }
        }
    }

    try {
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

        if (isLargeFile && snippetContext && result.fixedSnippet) {
            const fixedString = jsonContent.slice(0, snippetContext.start) + result.fixedSnippet + jsonContent.slice(snippetContext.end);
            return {
                fixed: fixedString,
                explanation: result.explanation || 'Fixed error in snippet'
            };
        }

        let fixedString = typeof result.fixed === 'string' ? result.fixed : JSON.stringify(result.fixed);

        // Ensure it is pretty-printed for readability in the modal
        if (!isLargeFile) {
            try {
                const parsedObj = JSON.parse(fixedString);
                fixedString = JSON.stringify(parsedObj, null, 2);
            } catch (e) {
                console.warn('Failed to format fixed JSON:', e);
            }
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

// Helper to sample heavy JSON to avoid token limits
const sampleJson = (jsonContent: string): string => {
    if (jsonContent.length < 50000) return jsonContent; // Use full if small

    try {
        const parsed = JSON.parse(jsonContent);
        if (Array.isArray(parsed)) {
            if (parsed.length <= 50) return jsonContent;
            // Take first 20 and last 20
            const sample = [...parsed.slice(0, 20), ...parsed.slice(-20)];
            return JSON.stringify(sample, null, 2);
        }
        // If it's a huge object, we might just take keys? 
        // For simplicity in Phase 1, if it's an object, we just return the first 50KB string representation 
        // trying to close it validly? No, simpler to just truncate or return keys if possible.
        // Actually, for Schema/Convert, array sampling is the most critical use case.
        return jsonContent.slice(0, 50000) + '\n... (truncated)';
    } catch (e) {
        // If invalid, we can't parse to sample smartly. Return raw slice.
        return jsonContent.slice(0, 30000) + '\n... (truncated)';
    }
};

export const generateSchema = async (jsonContent: string, apiKey: string, preferredModel: string = 'auto'): Promise<string> => {
    const sampled = sampleJson(jsonContent);
    return callGemini(
        sampled,
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
    const sampled = sampleJson(jsonContent);
    return callGemini(
        sampled,
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
    // This function doesn't need sampling as prompt is small.

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
    // Querying requires full data to find specific results (e.g. "Find Alice").
    // Sampling wouldn't work for "Find Alice" if Alice is in the middle.
    // However, we CANNOT send 1MB. 
    // For Phase 1, we will just warn/fail or slice.
    // Let's try to send as much as possible up to limit (approx 1M tokens input is fine for Flash).
    // The LIMIT is output. If the result is small (filtering), it works!
    // If result is huge, it fails.
    // We'll send full content here as Flash handles input well.
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
    const sampled = sampleJson(jsonContent);
    return callGemini(
        sampled,
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
