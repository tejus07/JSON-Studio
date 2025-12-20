import { useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { DiffEditor } from '../DiffEditor/DiffEditor';
import styles from './DiffModal.module.css';

interface DiffModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function DiffModal({ isOpen, onClose }: DiffModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            {/* Backdrop click to close? Maybe safer to require explicit close for extensive diffing. */}
            <div className={styles.modal} ref={modalRef}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Compare JSON</h2>
                    <button onClick={onClose} className={styles.closeBtn} title="Close (Esc)">
                        <X size={20} />
                    </button>
                </div>
                <div className={styles.content}>
                    <DiffEditor />
                </div>
            </div>
        </div>
    );
}
