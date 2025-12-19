import { X, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { useJsonStore } from '../../store/useJsonStore';
import styles from './ContentModal.module.css';

export function ContentModal() {
    const { generatedContent, setGeneratedContent } = useJsonStore();
    const [copied, setCopied] = useState(false);

    if (!generatedContent) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedContent.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleClose = () => {
        setGeneratedContent(null);
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2 className={styles.title}>{generatedContent.title}</h2>
                    <div className={styles.actions}>
                        <button
                            className={styles.actionBtn}
                            onClick={handleCopy}
                            title="Copy to Clipboard"
                        >
                            {copied ? <Check size={18} /> : <Copy size={18} />}
                        </button>
                        <button
                            className={styles.actionBtn}
                            onClick={handleClose}
                            title="Close"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>
                <div className={styles.body}>
                    <pre className={styles.pre}>
                        <code>{generatedContent.content}</code>
                    </pre>
                </div>
            </div>
        </div>
    );
}
