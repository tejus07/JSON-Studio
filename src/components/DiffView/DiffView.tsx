import { useRef, useEffect, useState } from 'react';
import { X, ArrowRight, ArrowLeft, Upload, Copy, Trash2 } from 'lucide-react';
import { DiffEditor } from '../DiffEditor/DiffEditor';
import { Editor } from '../Editor/Editor';
import { useJsonStore } from '../../store/useJsonStore';
import { toast } from 'sonner';
import styles from './DiffView.module.css';

interface DiffViewProps {
    onClose: () => void;
}

export function DiffView({ onClose }: DiffViewProps) {
    const [step, setStep] = useState<'input' | 'result'>('input');
    const { diffLeft, diffRight, setDiffLeft, setDiffRight, theme } = useJsonStore();

    const leftFileRef = useRef<HTMLInputElement>(null);
    const rightFileRef = useRef<HTMLInputElement>(null);

    // Reset step on mount
    useEffect(() => {
        setStep('input');
    }, []);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, side: 'left' | 'right') => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            if (side === 'left') setDiffLeft(content);
            else setDiffRight(content);
            toast.success(`Loaded ${file.name}`);
        };
        reader.readAsText(file);
    };

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    {step === 'result' && (
                        <button onClick={() => setStep('input')} className={styles.backBtn} title="Back to Inputs">
                            <ArrowLeft size={16} />
                            <span>Back to Edit</span>
                        </button>
                    )}
                    <h2 className={styles.title}>
                        {step === 'input' ? 'Diff Studio' : 'Diff Results'}
                    </h2>
                </div>
                <button onClick={onClose} className={styles.closeBtn} title="Close (Esc)">
                    <X size={20} />
                </button>
            </div>

            <div className={styles.content}>
                {step === 'input' ? (
                    <div className={styles.inputStage}>
                        <input type="file" ref={leftFileRef} onChange={(e) => handleFileUpload(e, 'left')} hidden accept=".json" />
                        <input type="file" ref={rightFileRef} onChange={(e) => handleFileUpload(e, 'right')} hidden accept=".json" />

                        <div className={styles.inputPane}>
                            <div className={styles.paneHeader}>
                                <div className={styles.paneTitle}>
                                    <span>Original JSON</span>
                                </div>
                                <div className={styles.paneActions}>
                                    <button onClick={() => leftFileRef.current?.click()} className={styles.iconBtn} title="Upload File">
                                        <Upload size={14} />
                                    </button>
                                    <button onClick={() => navigator.clipboard.writeText(diffLeft)} className={styles.iconBtn} title="Copy">
                                        <Copy size={14} />
                                    </button>
                                    <button onClick={() => setDiffLeft('')} className={styles.iconBtn} title="Clear">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                            <div className={styles.editorContainer}>
                                <Editor initialValue={diffLeft} onChange={setDiffLeft} theme={theme} />
                            </div>
                        </div>

                        <div className={styles.actionColumn}>
                            <button
                                className={styles.compareBtn}
                                onClick={() => setStep('result')}
                                disabled={!diffLeft && !diffRight}
                            >
                                <span>Compare</span>
                                <ArrowRight size={20} />
                            </button>
                        </div>

                        <div className={styles.inputPane}>
                            <div className={styles.paneHeader}>
                                <div className={styles.paneTitle}>
                                    <span>Modified JSON</span>
                                </div>
                                <div className={styles.paneActions}>
                                    <button onClick={() => rightFileRef.current?.click()} className={styles.iconBtn} title="Upload File">
                                        <Upload size={14} />
                                    </button>
                                    <button onClick={() => navigator.clipboard.writeText(diffRight)} className={styles.iconBtn} title="Copy">
                                        <Copy size={14} />
                                    </button>
                                    <button onClick={() => setDiffRight('')} className={styles.iconBtn} title="Clear">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                            <div className={styles.editorContainer}>
                                <Editor initialValue={diffRight} onChange={setDiffRight} theme={theme} />
                            </div>
                        </div>
                    </div>
                ) : (
                    <DiffEditor />
                )}
            </div>
        </div>
    );
}
