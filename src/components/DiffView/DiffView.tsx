import { useEffect, useState } from 'react';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';
import { DiffEditor } from '../DiffEditor/DiffEditor';
import { useJsonStore } from '../../store/useJsonStore';
import styles from './DiffView.module.css';

interface DiffViewProps {
    onClose: () => void;
}

export function DiffView({ onClose }: DiffViewProps) {
    const [step, setStep] = useState<'input' | 'result'>('input');
    const { diffLeft, diffRight, setDiffLeft, setDiffRight } = useJsonStore();

    // Reset step on mount
    useEffect(() => {
        setStep('input');
    }, []);

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
                        <div className={styles.inputPane}>
                            <div className={styles.paneHeader}>
                                <span>Original JSON</span>
                                <button onClick={() => setDiffLeft('')} className={styles.clearBtn}>Clear</button>
                            </div>
                            <textarea
                                className={styles.textarea}
                                value={diffLeft}
                                onChange={(e) => setDiffLeft(e.target.value)}
                                placeholder="Paste original JSON here..."
                            />
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
                                <span>Modified JSON</span>
                                <button onClick={() => setDiffRight('')} className={styles.clearBtn}>Clear</button>
                            </div>
                            <textarea
                                className={styles.textarea}
                                value={diffRight}
                                onChange={(e) => setDiffRight(e.target.value)}
                                placeholder="Paste modified JSON here..."
                            />
                        </div>
                    </div>
                ) : (
                    <DiffEditor />
                )}
            </div>
        </div>
    );
}
