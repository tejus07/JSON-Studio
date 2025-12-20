import { useJsonStore } from '../../store/useJsonStore';
import styles from './LoadingOverlay.module.css';
import { useEffect, useState } from 'react';

// Fun messages for each state
const MESSAGES = {
    fixing: [
        'Analyzing JSON structure...',
        'Finding and fixing syntax errors...',
        'Validating brackets and braces...',
        'Polishing your data...',
        'Applying smart fixes...'
    ],
    schema: [
        'Inferring types from data...',
        'Generating TypeScript interfaces...',
        'Detecting object patterns...',
        'Building schema definitions...'
    ],
    explain: [
        'Reading your JSON...',
        'Analyzing data hierarchy...',
        'Summarizing content...',
        'generating human-readable insights...'
    ],
    query: [
        'Scanning dataset...',
        'Filtering results...',
        'Processing your query...',
        'Extracting relevant data...'
    ],
    generate: [
        'Dreaming up mock data...',
        'Populating fields...',
        'Creating realistic examples...',
        'Structuring new objects...'
    ],
    convert: [
        'Transforming format...',
        'Rewriting syntax...',
        'Reformatting data output...',
        'Applying new structure...'
    ]
};

export function LoadingOverlay() {
    const { processingStatus, isFileLoading } = useJsonStore();
    const [isVisible, setIsVisible] = useState(false);
    const [message, setMessage] = useState('');

    // Rotating message logic
    useEffect(() => {
        if (!processingStatus && !isFileLoading) {
            setIsVisible(false);
            return;
        }

        setIsVisible(true);

        if (isFileLoading) {
            setMessage('Reading file...');
            return;
        }

        const statusMessages = MESSAGES[processingStatus!] || ['Processing...'];

        // Pick initial random message
        setMessage(statusMessages[Math.floor(Math.random() * statusMessages.length)]);

        // Rotate every 2 seconds
        const interval = setInterval(() => {
            setMessage(statusMessages[Math.floor(Math.random() * statusMessages.length)]);
        }, 2000);

        return () => clearInterval(interval);

    }, [processingStatus]);

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
