import { FileText, Sparkles, Upload } from 'lucide-react';
import { useJsonStore } from '../../store/useJsonStore';
import styles from './EmptyState.module.css';

export function EmptyState() {
    const { setPromptModalOpen, isPromptModalOpen } = useJsonStore();

    if (isPromptModalOpen) return null; // Hide if modal is open to avoid double overlap? Actually modal is overlay, so this is fine.

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <div className={styles.iconWrapper}>
                    <FileText size={48} strokeWidth={1} />
                </div>
                <h2 className={styles.title}>JSON Studio</h2>
                <p className={styles.subtitle}>Drop a file here or start with AI</p>

                <div className={styles.actions}>
                    <button
                        className={styles.actionBtn}
                        onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
                    >
                        <Upload size={16} />
                        <span>Open File</span>
                    </button>

                    <button
                        className={`${styles.actionBtn} ${styles.primary}`}
                        onClick={() => setPromptModalOpen(true, 'generate')}
                    >
                        <Sparkles size={16} />
                        <span>Generate Data</span>
                    </button>
                </div>

                <div className={styles.shortcuts}>
                    <div className={styles.shortcutItem}>
                        <kbd>Cmd</kbd> + <kbd>K</kbd> to command
                    </div>
                </div>
            </div>
        </div>
    );
}
