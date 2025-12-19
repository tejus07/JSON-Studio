import { useState, useEffect, useRef } from 'react';
import { useJsonStore } from '../../store/useJsonStore';
import { X, Sparkles, Search, RefreshCw } from 'lucide-react';
import styles from './PromptModal.module.css';

export function PromptModal() {
    const { isPromptModalOpen, promptAction, setPromptModalOpen, executeAiPrompt } = useJsonStore();
    const [input, setInput] = useState('');
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isPromptModalOpen) {
            setInput('');
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isPromptModalOpen, promptAction]);

    if (!isPromptModalOpen || !promptAction) return null;

    const handleSubmit = () => {
        if (!input.trim()) return;
        executeAiPrompt(input);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            handleSubmit();
        }
    };

    const config = {
        generate: {
            title: 'Generate Data',
            icon: <Sparkles size={20} />,
            placeholder: 'e.g. "Create 10 users with realistic names and emails"',
            btnText: 'Generate'
        },
        query: {
            title: 'Natural Language Query',
            icon: <Search size={20} />,
            placeholder: 'e.g. "Find all users older than 25 who live in London"',
            btnText: 'Run Query'
        },
        convert: {
            title: 'Smart Convert',
            icon: <RefreshCw size={20} />,
            placeholder: 'e.g. "Convert to CSV" or "YAML format"',
            btnText: 'Convert'
        }
    }[promptAction];

    if (!config) return null;

    return (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && setPromptModalOpen(false)}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <div className={styles.titleGroup}>
                        <span className={styles.iconWrapper}>{config.icon}</span>
                        <h2 className={styles.title}>{config.title}</h2>
                    </div>
                    <button className={styles.closeBtn} onClick={() => setPromptModalOpen(false)}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.body}>
                    <textarea
                        ref={inputRef}
                        className={styles.input}
                        placeholder={config.placeholder}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={4}
                    />
                    <div className={styles.hint}>
                        Pro tip: Press Cmd+Enter to submit
                    </div>
                </div>

                <div className={styles.footer}>
                    <button className={styles.cancelBtn} onClick={() => setPromptModalOpen(false)}>
                        Cancel
                    </button>
                    <button
                        className={styles.submitBtn}
                        onClick={handleSubmit}
                        disabled={!input.trim()}
                    >
                        {config.btnText}
                    </button>
                </div>
            </div>
        </div>
    );
}
