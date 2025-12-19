import { create } from 'zustand';
import { safeParseJSON, formatJSON, minifyJSON } from '../utils/jsonUtils';
import { fixJsonWithGemini } from '../services/aiService';

interface JsonState {
    rawText: string;
    parsedData: any;
    error: string | null;
    isValid: boolean;
    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;

    apiKey: string;
    setApiKey: (key: string) => void;

    preferredModel: string;
    setPreferredModel: (model: string) => void;

    isAiModalOpen: boolean;
    setAiModalOpen: (open: boolean) => void;

    isFixing: boolean;
    fixJsonWithAI: () => Promise<void>;

    setText: (text: string) => void;
    format: () => void;
    minify: () => void;
}

export const useJsonStore = create<JsonState>((set, get) => ({
    rawText: '',
    parsedData: null,
    error: null,
    isValid: true,
    theme: 'dark', // Default to dark for "Studio" feel, or 'system'

    apiKey: localStorage.getItem('json-studio-api-key') || '',
    preferredModel: localStorage.getItem('json-studio-model') || 'auto',
    isAiModalOpen: false,

    setTheme: (theme: 'light' | 'dark') => {
        set({ theme });
        document.documentElement.setAttribute('data-theme', theme);
    },

    setApiKey: (key: string) => {
        set({ apiKey: key });
        localStorage.setItem('json-studio-api-key', key);
    },

    setPreferredModel: (model: string) => {
        set({ preferredModel: model });
        localStorage.setItem('json-studio-model', model);
    },

    setAiModalOpen: (open: boolean) => set({ isAiModalOpen: open }),

    isFixing: false,
    fixJsonWithAI: async () => {
        const { apiKey, rawText, preferredModel } = get();
        if (!apiKey) {
            set({ isAiModalOpen: true });
            return;
        }

        set({ isFixing: true });
        try {
            const fixed = await fixJsonWithGemini(rawText, apiKey, preferredModel);
            get().setText(fixed);
        } catch (e: any) {
            alert(e.message || 'Failed to fix JSON');
        } finally {
            set({ isFixing: false });
        }
    },

    setText: (text: string) => {
        // Basic state update
        // We defer heavy parsing or debounce it in a real app, 
        // but for now we parse on every keystroke to check validity.
        const { data, error } = safeParseJSON(text);
        set({
            rawText: text,
            parsedData: data,
            error: error ? error.message : null,
            isValid: !error
        });
    },

    format: () => {
        const { rawText } = get();
        const formatted = formatJSON(rawText);
        get().setText(formatted);
    },

    minify: () => {
        const { rawText } = get();
        const minified = minifyJSON(rawText);
        get().setText(minified);
    }
}));
