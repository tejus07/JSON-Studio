import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';
import { safeParseJSON, formatJSON, minifyJSON } from '../utils/jsonUtils';
import { fixJsonWithGemini, generateSchema, explainJson } from '../services/aiService';

interface JsonState {
    rawText: string;
    parsedData: any;
    error: string | null;
    isValid: boolean;

    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;

    viewMode: 'code' | 'tree' | 'split';
    setViewMode: (mode: 'code' | 'tree' | 'split') => void;

    apiKey: string;
    setApiKey: (key: string) => void;

    preferredModel: string;
    setPreferredModel: (model: string) => void;

    isAiModalOpen: boolean;
    setAiModalOpen: (open: boolean) => void;

    isInfoModalOpen: boolean;
    setInfoModalOpen: (open: boolean) => void;

    isFixing: boolean;
    fixJsonWithAI: () => Promise<void>;

    isGeneratingSchema: boolean;
    isGeneratingExplanation: boolean;
    generatedContent: { title: string; content: string; type: 'markdown' | 'code' | 'fix-preview'; explanation?: string } | null;
    setGeneratedContent: (content: { title: string; content: string; type: 'markdown' | 'code' | 'fix-preview'; explanation?: string } | null) => void;

    generateSchemaWithAI: () => Promise<void>;
    explainJsonWithAI: () => Promise<void>;

    setText: (text: string) => void;
    format: () => void;
    minify: () => void;
    clear: () => void;
}

export const useJsonStore = create<JsonState>()(
    persist(
        (set, get) => ({
            rawText: '',
            parsedData: null,
            error: null,
            isValid: true,
            theme: 'dark',

            apiKey: '',
            preferredModel: 'auto',
            isAiModalOpen: false,
            isInfoModalOpen: false,

            // View state
            viewMode: 'split',

            isGeneratingSchema: false,
            isGeneratingExplanation: false,
            generatedContent: null,
            setGeneratedContent: (content) => set({ generatedContent: content }),

            setTheme: (theme) => {
                set({ theme });
                document.documentElement.setAttribute('data-theme', theme);
            },

            setViewMode: (mode) => set({ viewMode: mode }),

            setApiKey: (key) => set({ apiKey: key }),

            setPreferredModel: (model) => set({ preferredModel: model }),

            setAiModalOpen: (open) => set({ isAiModalOpen: open }),
            setInfoModalOpen: (open) => set({ isInfoModalOpen: open }),

            isFixing: false,
            fixJsonWithAI: async () => {
                const { apiKey, rawText, preferredModel } = get();
                if (!apiKey) { set({ isAiModalOpen: true }); return; }

                set({ isFixing: true });
                try {
                    const { fixed, explanation } = await fixJsonWithGemini(rawText, apiKey, preferredModel);
                    // Preview fit first
                    set({ generatedContent: { title: 'Review Fix', content: fixed, type: 'fix-preview', explanation } });
                    toast.success('Fix ready for review');
                } catch (e: unknown) {
                    const msg = e instanceof Error ? e.message : 'Failed to fix JSON';
                    toast.error(msg);
                } finally {
                    set({ isFixing: false });
                }
            },

            generateSchemaWithAI: async () => {
                const { apiKey, rawText, preferredModel } = get();
                if (!apiKey) { set({ isAiModalOpen: true }); return; }

                set({ isGeneratingSchema: true });
                try {
                    const schema = await generateSchema(rawText, apiKey, preferredModel);
                    set({ generatedContent: { title: 'TypeScript Schema', content: schema, type: 'code' } });
                    toast.success('Schema generated');
                } catch (e: unknown) {
                    const msg = e instanceof Error ? e.message : 'Failed to generate schema';
                    toast.error(msg);
                } finally {
                    set({ isGeneratingSchema: false });
                }
            },

            explainJsonWithAI: async () => {
                const { apiKey, rawText, preferredModel } = get();
                if (!apiKey) { set({ isAiModalOpen: true }); return; }

                set({ isGeneratingExplanation: true });
                try {
                    const explanation = await explainJson(rawText, apiKey, preferredModel);
                    set({ generatedContent: { title: 'Explanation', content: explanation, type: 'markdown' } });
                    toast.success('Explanation generated');
                } catch (e: unknown) {
                    const msg = e instanceof Error ? e.message : 'Failed to explain JSON';
                    toast.error(msg);
                } finally {
                    set({ isGeneratingExplanation: false });
                }
            },

            setText: (text) => {
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
            },

            clear: () => {
                get().setText('');
            }
        }),
        {
            name: 'json-studio-storage',
            partialize: (state) => ({
                theme: state.theme,
                apiKey: state.apiKey,
                preferredModel: state.preferredModel,
                rawText: state.rawText, // Auto-save content
                viewMode: state.viewMode
            }),
            onRehydrateStorage: () => (state) => {
                // Restore theme attribute when rehydrated
                if (state?.theme) {
                    document.documentElement.setAttribute('data-theme', state.theme);
                }
                // Re-parse the loaded text to ensure state is consistent
                if (state?.rawText) {
                    state.setText(state.rawText);
                }
            }
        }
    )
);
