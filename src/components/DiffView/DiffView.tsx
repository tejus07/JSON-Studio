import { useEffect } from 'react';
import { DiffEditor } from '../DiffEditor/DiffEditor';
// import { Editor } from '../Editor/Editor';
// import { useJsonStore } from '../../store/useJsonStore';
import styles from './DiffView.module.css';

interface DiffViewProps {
    onClose: () => void;
}

export function DiffView({ onClose }: DiffViewProps) {
    // const { diffLeft, diffRight, setDiffLeft, setDiffRight, theme, diffStep, setDiffStep } = useJsonStore();
    // We don't need these here anymore, DiffEditor handles it all.

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
            <div className={styles.content}>
                <DiffEditor />
            </div>
        </div>
    );
}
