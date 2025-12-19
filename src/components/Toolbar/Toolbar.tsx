import { FileJson, Upload, Download, Copy, Trash2, AlignLeft, Minimize, FileCode, MessageSquare, Wand2, Columns, Code, FolderTree, HelpCircle, Settings, Sun, Moon } from 'lucide-react';
import { useJsonStore } from '../../store/useJsonStore';
import styles from './Toolbar.module.css';

interface ToolbarProps {
    onUpload: () => void;
    onDownload: () => void;
    onCopy: () => void;
    onClear: () => void;
    isMobile: boolean; // We'll use this to adapt the layout
}

export function Toolbar({ onUpload, onDownload, onCopy, onClear, isMobile }: ToolbarProps) {
    const {
        rawText,
        isValid,
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
        setInfoModalOpen
    } = useJsonStore();

    return (
        <header className={styles.header}>
            <div className={styles.logo}>
                <FileJson size={20} className={styles.logoIcon} />
                <span className={styles.logoText}>JSON Studio</span>
            </div>

            <div className={styles.toolbar}>
                {/* File Group */}
                <div className={styles.toolGroup}>
                    <button onClick={onUpload} className={styles.toolButton} title="Open JSON File">
                        <Upload size={16} />
                    </button>
                    <button onClick={onDownload} className={styles.toolButton} title="Save as JSON" disabled={!rawText}>
                        <Download size={16} />
                    </button>
                </div>

                <div className={styles.divider} />

                {/* Edit Group */}
                <div className={styles.toolGroup}>
                    <button onClick={onCopy} className={styles.toolButton} title="Copy All" disabled={!rawText}>
                        <Copy size={16} />
                    </button>
                    {!isMobile && (
                        <button onClick={onClear} className={styles.toolButton} title="Clear Editor">
                            <Trash2 size={16} />
                        </button>
                    )}
                    <button onClick={format} className={styles.toolButton} title="Format / Prettify" disabled={!isValid || !rawText}>
                        <AlignLeft size={16} />
                    </button>
                    <button onClick={minify} className={styles.toolButton} title="Minify / Compact" disabled={!isValid || !rawText}>
                        <Minimize size={16} />
                    </button>
                </div>

                {/* AI Group */}
                {isValid && rawText && !isMobile && (
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

                {!isMobile && (
                    <>
                        <div className={styles.divider} />

                        {/* View Group - Hidden on Mobile, moved to bottom nav */}
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
                    </>
                )}
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
    );
}
