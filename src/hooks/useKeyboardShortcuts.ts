import { useEffect } from 'react';
import { useJsonStore } from '../store/useJsonStore';

export function useKeyboardShortcuts() {
    const {
        setPromptModalOpen,
        fixJsonWithAI,
        rawText,
        isValid
    } = useJsonStore();

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            // Cmd+K (or Ctrl+K) -> Open AI Command Palette (Generate)
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setPromptModalOpen(true, 'generate');
            }

            // Cmd+Shift+F -> Fix JSON (if invalid)
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'f') {
                e.preventDefault();
                if (rawText && !isValid) {
                    fixJsonWithAI();
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setPromptModalOpen, fixJsonWithAI, rawText, isValid]);
}
