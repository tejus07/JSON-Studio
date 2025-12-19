import { useJsonStore } from '../../store/useJsonStore';
import { Editor } from '../Editor/Editor';
import { SettingsModal } from '../SettingsModal/SettingsModal';
import { useRef, useState, useEffect } from 'react';
import { Upload, Check, AlertTriangle } from 'lucide-react';
import { JsonTree } from '../JsonTree/JsonTree';
import { ContentModal } from '../ContentModal/ContentModal';
import { InfoModal } from '../InfoModal/InfoModal';
import { Toolbar } from '../Toolbar/Toolbar';
import { MobileNav } from '../MobileNav/MobileNav';
import { useIsMobile } from '../../hooks/useIsMobile';
import styles from './Layout.module.css';

export function Layout() {
    const {
        rawText,
        error,
        isValid,
        setText,
        clear,
        viewMode,
        setViewMode
    } = useJsonStore();

    const isMobile = useIsMobile();

    // Force safe view mode on mobile (no split)
    useEffect(() => {
        if (isMobile && viewMode === 'split') {
            setViewMode('code');
        }
    }, [isMobile, viewMode, setViewMode]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleCopyInput = () => {
        navigator.clipboard.writeText(rawText);
        // Could show a toast here
    };

    const handleClear = () => {
        if (confirm('Are you sure you want to clear the editor?')) {
            clear();
        }
    };

    const handleDownload = () => {
        const blob = new Blob([rawText], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) readFile(file);
    };

    const readFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            setText(content);
        };
        reader.readAsText(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) readFile(file);
    };

    return (
        <div
            className={styles.layout}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <SettingsModal />
            <ContentModal />
            <InfoModal />
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
                accept=".json,application/json"
            />

            {isDragging && (
                <div className={styles.dragOverlay}>
                    <Upload size={48} />
                    <p>Drop to Open JSON</p>
                </div>
            )}

            <Toolbar
                onUpload={handleUploadClick}
                onDownload={handleDownload}
                onCopy={handleCopyInput}
                onClear={handleClear}
                isMobile={isMobile}
            />

            <main className={styles.main}>
                {(!isMobile || viewMode === 'code') && (
                    <div className={`${styles.pane} ${viewMode === 'split' ? styles.half : styles.full}`}>
                        <Editor initialValue={rawText} onChange={setText} />
                    </div>
                )}

                {(!isMobile && viewMode === 'split' || viewMode === 'tree') && (
                    <div className={`${styles.pane} ${viewMode === 'split' ? styles.half : styles.full} ${styles.treePane}`}>
                        <JsonTree />
                    </div>
                )}
            </main>

            <footer className={`${styles.footer} ${isValid ? styles.valid : styles.invalid} `}>
                <div className={styles.status}>
                    {rawText.trim().length > 0 && (
                        isValid ? (
                            <>
                                <Check size={14} />
                                <span>Valid JSON</span>
                            </>
                        ) : (
                            <>
                                <AlertTriangle size={14} />
                                <span>{error}</span>
                            </>
                        )
                    )}
                </div>
                <div className={styles.meta}>
                    {/* Line count or size could go here */}
                    <span>{rawText.length} chars</span>
                </div>
            </footer>

            {isMobile && <MobileNav />}
        </div>
    );
}
