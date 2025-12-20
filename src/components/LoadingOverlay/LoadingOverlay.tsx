import { useJsonStore } from '../../store/useJsonStore';
import styles from './LoadingOverlay.module.css';
import { useEffect, useState } from 'react';

export function LoadingOverlay() {
    const { isFixing, isGeneratingSchema, isGeneratingExplanation } = useJsonStore();
    const [isVisible, setIsVisible] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const isBusy = isFixing || isGeneratingSchema || isGeneratingExplanation;
        setIsVisible(isBusy);

        if (isFixing) setMessage('Fixing JSON...');
        else if (isGeneratingExplanation) setMessage('Generating Explanation...');
        else if (isGeneratingSchema) setMessage('Processing with AI...');
        else setMessage('Loading...');

    }, [isFixing, isGeneratingSchema, isGeneratingExplanation]);

    if (!isVisible) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.content}>
                <div className={styles.spinner}></div>
                <div className={styles.message}>{message}</div>
                <div className={styles.subtext}>This may take a few seconds</div>
            </div>
        </div>
    );
}
