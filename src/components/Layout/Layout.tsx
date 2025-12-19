import { useJsonStore } from '../../store/useJsonStore';
import { Editor } from '../Editor/Editor';
import { SettingsModal } from '../SettingsModal/SettingsModal';
import { useRef, useState } from 'react';
import { FileJson, Check, AlertTriangle, Minimize, AlignLeft, Moon, Sun, Settings, Wand2, Columns, Code, FolderTree, FileCode, MessageSquare, Download, Upload, Copy, Trash2, HelpCircle } from 'lucide-react';
import { JsonTree } from '../JsonTree/JsonTree';
import { ContentModal } from '../ContentModal/ContentModal';
import { InfoModal } from '../InfoModal/InfoModal';
import styles from './Layout.module.css';

export function Layout() {
    const {
        rawText,
        error,
        isValid,
        setText,
        format,
        minify,
        theme,
        setTheme,
        setAiModalOpen,
        fixJsonWithAI,
        isFixing,
        viewMode,
        setViewMode,
        generateSchemaWithAI,
        explainJsonWithAI,
        isGenerating,
        clear,
        setInfoModalOpen
    } = useJsonStore();

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

            <header className={styles.header}>
                <div className={styles.logo}>
                    <FileJson size={20} className={styles.logoIcon} />
                    <span className={styles.logoText}>JSON Studio</span>
                </div>

                <div className={styles.toolbar}>
                    {/* File Group */}
                    <div className={styles.toolGroup}>
                        <button onClick={handleUploadClick} className={styles.toolButton} title="Open JSON File">
                            <Upload size={16} />
                        </button>
                        <button onClick={handleDownload} className={styles.toolButton} title="Save as JSON" disabled={!rawText}>
                            <Download size={16} />
                        </button>
                    </div>

                    <div className={styles.divider} />

                    {/* Edit Group */}
                    <div className={styles.toolGroup}>
                        <button onClick={handleCopyInput} className={styles.toolButton} title="Copy All" disabled={!rawText}>
                            <Copy size={16} />
                        </button>
                        <button onClick={handleClear} className={styles.toolButton} title="Clear Editor">
                            <Trash2 size={16} />
                        </button>
                        <button onClick={format} className={styles.toolButton} title="Format / Prettify" disabled={!isValid || !rawText}>
                            <AlignLeft size={16} />
                        </button>
                        <button onClick={minify} className={styles.toolButton} title="Minify / Compact" disabled={!isValid || !rawText}>
                            <Minimize size={16} />
                        </button>
                    </div>

                    {/* AI Group */}
                    {isValid && rawText && (
                        <>
                            <div className={styles.divider} />
                            <div className={styles.toolGroup}>
                                <button onClick={generateSchemaWithAI} className={styles.toolButton} title="Generate Schema" disabled={isGenerating}>
                                    <FileCode size={16} className={isGenerating ? styles.spin : ''} />
                                    <span>Schema</span>
                                </button>
                                <button onClick={explainJsonWithAI} className={styles.toolButton} title="Explain Data" disabled={isGenerating}>
                                    <MessageSquare size={16} className={isGenerating ? styles.spin : ''} />
                                    <span>Explain</span>
                                </button>
                            </div>
                        </>
                    )}

                    {!isValid && rawText && (
                        <>
                            <div className={styles.divider} />
                            <button onClick={fixJsonWithAI} className={`${styles.toolButton} ${styles.fixBtn}`} title="Auto-Fix JSON" disabled={isFixing || isGenerating}>
                                <Wand2 size={16} className={isFixing ? styles.spin : ''} />
                                <span>{isFixing ? 'Fixing...' : 'Fix'}</span>
                            </button>
                        </>
                    )}

                    <div className={styles.divider} />

                    {/* View Group */}
                    <div className={styles.viewToggles}>
                        <button
                            className={`${styles.toolButton} ${viewMode === 'code' ? styles.active : ''}`}
                            onClick={() => setViewMode('code')}
                            title="Code Only"
                        >
                            <Code size={16} />
                        </button>
                        <button
                            className={`${styles.toolButton} ${viewMode === 'split' ? styles.active : ''}`}
                            onClick={() => setViewMode('split')}
                            title="Split View"
                        >
                            <Columns size={16} />
                        </button>
                        <button
                            className={`${styles.toolButton} ${viewMode === 'tree' ? styles.active : ''}`}
                            onClick={() => setViewMode('tree')}
                            title="Tree Only"
                        >
                            <FolderTree size={16} />
                        </button>
                    </div>
                </div>

                <div className={styles.actions}>
                    <div className={styles.toolGroup}>
                        <button
                            onClick={() => setInfoModalOpen(true)}
                            className={styles.toolButton}
                            title="Help & Info"
                        >
                            <HelpCircle size={16} />
                        </button>
                        <button
                            onClick={() => setAiModalOpen(true)}
                            className={styles.toolButton}
                            title="AI Settings"
                        >
                            <Settings size={16} />
                        </button>
                        <button
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className={styles.toolButton}
                            title="Toggle Theme"
                        >
                            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                        </button>
                    </div>
                </div>
            </header>

            <main className={styles.main}>
                {(viewMode === 'code' || viewMode === 'split') && (
                    <div className={`${styles.pane} ${viewMode === 'split' ? styles.half : styles.full}`}>
                        <Editor initialValue={rawText} onChange={setText} />
                    </div>
                )}

                {(viewMode === 'tree' || viewMode === 'split') && (
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
        </div>
    );
}
