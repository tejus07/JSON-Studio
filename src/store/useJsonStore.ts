import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { toast } from 'sonner';
import { safeParseJSON, formatJSON, minifyJSON } from '../utils/jsonUtils';
import { fixJsonWithGemini, generateSchema, explainJson, generateMockData, nlQuery, smartConvert } from '../services/aiService';
import { indexedDBStorage } from '../utils/indexedDBStorage';

type PromptAction = 'generate' | 'query' | 'convert' | null;

interface JsonState {
    rawText: string;
    parsedData: any;
    error: string | null;
    isValid: boolean;

    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;

    viewMode: 'code' | 'tree' | 'split';
    setViewMode: (mode: 'code' | 'tree' | 'split') => void;

    splitRatio: number;
    setSplitRatio: (ratio: number) => void;

    apiKey: string;
    setApiKey: (key: string) => void;

    preferredModel: string;
    setPreferredModel: (model: string) => void;

    isAiModalOpen: boolean;
    setAiModalOpen: (open: boolean) => void;

    isInfoModalOpen: boolean;
    setInfoModalOpen: (open: boolean) => void;

    isFeedbackModalOpen: boolean;
    setFeedbackModalOpen: (open: boolean) => void;

    // Prompt Modal State
    isPromptModalOpen: boolean;
    promptAction: PromptAction;
    setPromptModalOpen: (open: boolean, action?: PromptAction) => void;
    executeAiPrompt: (input: string) => Promise<void>;

    // File Loading State
    isFileLoading: boolean;
    setIsFileLoading: (loading: boolean) => void;

    // Unified Processing State
    processingStatus: 'fixing' | 'schema' | 'explain' | 'query' | 'generate' | 'convert' | null;
    setProcessingStatus: (status: 'fixing' | 'schema' | 'explain' | 'query' | 'generate' | 'convert' | null) => void;

    // Actions
    fixJsonWithAI: (currentTextOverride?: string) => Promise<void>;
    generateSchemaWithAI: () => Promise<void>;
    explainJsonWithAI: () => Promise<void>;

    // Compatibility / Deprecated
    isFixing: boolean;
    isGeneratingSchema: boolean;
    isGeneratingExplanation: boolean;
    generatedContent: { title: string; content: string; type: 'markdown' | 'code' | 'fix-preview'; explanation?: string; actionLabel?: string; prompt?: string; isPartial?: boolean } | null;
    setGeneratedContent: (content: { title: string; content: string; type: 'markdown' | 'code' | 'fix-preview'; explanation?: string; actionLabel?: string; prompt?: string; isPartial?: boolean } | null) => void;

    // ... (rest of the store)

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
            isFeedbackModalOpen: false,
            isPromptModalOpen: false,
            promptAction: null,

            // View state
            viewMode: 'split',
            splitRatio: 50,

            // Loading State
            processingStatus: null,
            setProcessingStatus: (status) => set({ processingStatus: status }),

            // Deprecated booleans (mapped for compatibility if needed, but we should switch)
            // For now, let's keep the getters compatible if components use them, but purely rely on processingStatus internally? 
            // Actually, let's just remove them from the interface or map them derived if possible. 
            // To be safe and fast, I will just remove the explicit boolean flags from state actions and use processingStatus.
            // But wait, existing components (Toolbar) use isFixing etc. 
            // I'll map them in the component consumption step or keep them as derived?
            // Zustand doesn't do derived state easily without selectors.
            // I'll update the interface to remove them and fix usage.

            isGeneratingSchema: false, // Keeping for now to avoid breaking Toolbar immediately, will replace usage
            isGeneratingExplanation: false,
            isFixing: false,

            generatedContent: null,
            setGeneratedContent: (content) => set({ generatedContent: content }),

            setTheme: (theme) => {
                set({ theme });
                document.documentElement.setAttribute('data-theme', theme);
            },

            setViewMode: (mode) => set({ viewMode: mode }),
            setSplitRatio: (ratio) => set({ splitRatio: ratio }),

            setApiKey: (key) => set({ apiKey: key }),

            setPreferredModel: (model) => set({ preferredModel: model }),

            isFileLoading: false,
            setIsFileLoading: (loading) => set({ isFileLoading: loading }),

            setAiModalOpen: (open) => set({ isAiModalOpen: open }),
            setInfoModalOpen: (open) => set({ isInfoModalOpen: open }),
            setFeedbackModalOpen: (open) => set({ isFeedbackModalOpen: open }),
            setPromptModalOpen: (open, action = null) => set({ isPromptModalOpen: open, promptAction: action }),

            executeAiPrompt: async (input: string) => {
                const { apiKey, rawText, preferredModel, promptAction } = get();

                // Handle missing API key
                if (!apiKey) {
                    set({ isPromptModalOpen: false, isAiModalOpen: true });
                    toast.error('Please configure your API Key first');
                    return;
                }

                if (!promptAction) return;

                // Map action to status
                const statusMap: Record<string, 'generate' | 'query' | 'convert'> = {
                    generate: 'generate',
                    query: 'query',
                    convert: 'convert'
                };

                set({ isPromptModalOpen: false, processingStatus: statusMap[promptAction] || null });

                try {
                    let result = '';
                    let title = '';
                    let type: 'code' | 'markdown' | 'fix-preview' = 'code';
                    let actionLabel = 'Apply Fix';

                    if (promptAction === 'generate') {
                        result = await generateMockData(input, apiKey, preferredModel);
                        title = 'Generated Data';
                        type = 'fix-preview';
                        actionLabel = 'Use Data';
                    } else if (promptAction === 'query') {
                        result = await nlQuery(rawText, input, apiKey, preferredModel);
                        title = 'Query Result';
                        type = 'code';
                    } else if (promptAction === 'convert') {
                        result = await smartConvert(rawText, input, apiKey, preferredModel);
                        const format = input.replace(/convert to/i, '').trim();
                        title = `${format} Conversion`;
                        type = 'code';
                    }

                    set({ generatedContent: { title, content: result, type, actionLabel, prompt: input } });
                    toast.success('Action completed');
                } catch (e: unknown) {
                    const msg = e instanceof Error ? e.message : 'AI Action Failed';
                    toast.error(msg);
                } finally {
                    set({ processingStatus: null });
                }
            },

            fixJsonWithAI: async (currentTextOverride?: string) => {
                const { apiKey, rawText, preferredModel } = get();
                const textToFix = currentTextOverride || rawText; // Support iterative fixing

                if (!apiKey) { set({ isAiModalOpen: true }); return; }

                set({ isFixing: true, processingStatus: 'fixing' });
                try {
                    const { fixed, explanation } = await fixJsonWithGemini(textToFix, apiKey, preferredModel);

                    // Check if the result is actually valid now
                    const { error } = safeParseJSON(fixed);
                    const isFullyFixed = !error;

                    set({
                        generatedContent: {
                            title: isFullyFixed ? 'Review Fix' : 'Partial Fix (More Errors Detected)',
                            content: fixed,
                            type: 'fix-preview',
                            explanation: isFullyFixed ? explanation : `${explanation}. Click 'Fix Next' to continue.`,
                            isPartial: !isFullyFixed
                        }
                    });

                    if (isFullyFixed) {
                        toast.success('Fix ready for review');
                    } else {
                        toast.warning('Fixed one error, but more remain');
                    }
                } catch (e: unknown) {
                    const msg = e instanceof Error ? e.message : 'Failed to fix JSON';
                    toast.error(msg);
                } finally {
                    set({ isFixing: false, processingStatus: null });
                }
            },

            generateSchemaWithAI: async () => {
                const { apiKey, rawText, preferredModel } = get();
                if (!apiKey) { set({ isAiModalOpen: true }); return; }

                set({ isGeneratingSchema: true, processingStatus: 'schema' });
                try {
                    const schema = await generateSchema(rawText, apiKey, preferredModel);
                    set({ generatedContent: { title: 'TypeScript Schema', content: schema, type: 'code' } });
                    toast.success('Schema generated');
                } catch (e: unknown) {
                    const msg = e instanceof Error ? e.message : 'Failed to generate schema';
                    toast.error(msg);
                } finally {
                    set({ isGeneratingSchema: false, processingStatus: null });
                }
            },

            explainJsonWithAI: async () => {
                const { apiKey, rawText, preferredModel } = get();
                if (!apiKey) { set({ isAiModalOpen: true }); return; }

                set({ isGeneratingExplanation: true, processingStatus: 'explain' });
                try {
                    const explanation = await explainJson(rawText, apiKey, preferredModel);
                    set({ generatedContent: { title: 'Explanation', content: explanation, type: 'markdown' } });
                    toast.success('Explanation generated');
                } catch (e: unknown) {
                    const msg = e instanceof Error ? e.message : 'Failed to explain JSON';
                    toast.error(msg);
                } finally {
                    set({ isGeneratingExplanation: false, processingStatus: null });
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
            storage: createJSONStorage(() => indexedDBStorage),
            partialize: (state) => ({
                theme: state.theme,
                apiKey: state.apiKey,
                preferredModel: state.preferredModel,
                rawText: state.rawText, // Auto-save content
                viewMode: state.viewMode,
                splitRatio: state.splitRatio
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
