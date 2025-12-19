import { X, Copy, Check, Sparkles, FileCode } from 'lucide-react'; // Added icons
import { useState } from 'react';
import { useJsonStore } from '../../store/useJsonStore';
import { toast } from 'sonner';
import Markdown from 'react-markdown'; // Changed from 'react-markdown' to 'Markdown' for default export usage or standard named import if simpler. Usually `import Markdown from 'react-markdown'`
// For CodeMirror
// Used internal Editor component for code view 
// Let's use the existing Editor component in read-only mode to save size!
import { Editor } from '../Editor/Editor';

import styles from './ContentModal.module.css';

export function ContentModal() {
    const { generatedContent, setGeneratedContent } = useJsonStore();
    const [copied, setCopied] = useState(false);

    if (!generatedContent) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedContent.content);
        setCopied(true);
        toast.success('Copied to clipboard'); // Added toast
        setTimeout(() => setCopied(false), 2000);
    };

    const handleClose = () => {
        setGeneratedContent(null);
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <div className={styles.titleGroup}>
                        {generatedContent.type === 'code' ?
                            <FileCode size={18} className={styles.icon} /> :
                            <Sparkles size={18} className={styles.icon} />
                        }
                        <h2 className={styles.title}>{generatedContent.title}</h2>
                    </div>
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
                    {generatedContent.type === 'markdown' ? (
                        <div className={styles.markdownWrapper}>
                            <Markdown>{generatedContent.content}</Markdown>
                        </div>
                    ) : (
                        <Editor
                            initialValue={generatedContent.content}
                            onChange={() => { }}
                        // We need to implement readOnly in Editor or just accept it might be editable but ignored.
                        // Ideally pass readOnly prop if Editor supports it, or just use it as viewer.
                        // Let's assume standard Editor for now, will refine if editable. 
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
