import { FileJson, Upload, Download, Copy, Trash2, AlignLeft, Minimize, Wand2, Code, FolderTree, HelpCircle, Settings, Loader2, MessageSquareText, Sparkles } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { toast } from 'sonner';
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
        setAiModalOpen,
        fixJsonWithAI,
        isFixing,
        viewMode,
        setViewMode,
        generateSchemaWithAI,
        explainJsonWithAI,
        isGeneratingSchema,
        isGeneratingExplanation,
        setInfoModalOpen,
        setPromptModalOpen
    } = useJsonStore();

    const [isAiMenuOpen, setAiMenuOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null); // Ref for the whole container

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setAiMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const isBusy = isFixing || isGeneratingSchema || isGeneratingExplanation;

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
                    {!isValid && rawText && !isMobile && (
                        <div className={styles.toolGroup}>
                            <button
                                onClick={() => fixJsonWithAI()}
                                className={`${styles.toolButton} ${styles.fixBtn}`}
                                title="Auto-Fix JSON"
                            >
                                <Wand2 size={16} />
                                {!isMobile && "Fix JSON"}
                            </button>
                            <div className={styles.divider} />
                        </div>
                    )}

                    <button onClick={onCopy} className={styles.toolButton} title="Copy All" disabled={!rawText}>
                        <Copy size={16} />
                    </button>
                    {!isMobile && (
                        <button onClick={onClear} className={styles.toolButton} title="Clear Editor">
                            <Trash2 size={16} />
                        </button>
                    )}
                    <button onClick={() => { format(); toast.success('JSON Formatted'); }} className={styles.toolButton} title="Format / Prettify" disabled={!isValid || !rawText}>
                        <AlignLeft size={16} />
                        <span className={styles.desktopLabel}>Format</span>
                    </button>
                    <button onClick={() => { minify(); toast.success('JSON Minified'); }} className={styles.toolButton} title="Minify / Compact" disabled={!isValid || !rawText}>
                        <Minimize size={16} />
                        <span className={styles.desktopLabel}>Minify</span>
                    </button>
                </div>

                {/* AI Group (Magic Menu) */}
                <div className={styles.toolGroup} style={{ position: 'relative' }} ref={containerRef}>
                    <button
                        className={`${styles.toolButton} ${styles.aiTrigger}`}
                        onClick={() => setAiMenuOpen(!isAiMenuOpen)}
                        disabled={isBusy}
                        title="AI Actions"
                    >
                        {isBusy ? <Loader2 size={16} className={styles.spin} /> : <Sparkles size={16} />}
                        {!isMobile && <span className={styles.btnText}>AI</span>}
                    </button>

                    {isAiMenuOpen && !isBusy && (
                        <div className={styles.aiDropdown}>
                            <div className={styles.menuHeader}>AI Tools</div>

                            {!isValid && rawText && (
                                <button className={styles.menuItem} onClick={() => { fixJsonWithAI(); setAiMenuOpen(false); }}>
                                    <Wand2 size={14} className={styles.itemIcon} />
                                    <span>Fix JSON</span>
                                </button>
                            )}

                            <button className={styles.menuItem} onClick={() => { setPromptModalOpen(true, 'generate'); setAiMenuOpen(false); }}>
                                <Sparkles size={14} className={styles.itemIcon} />
                                <span>Generate Data...</span>
                            </button>

                            <button className={styles.menuItem} onClick={() => { setPromptModalOpen(true, 'query'); setAiMenuOpen(false); }} disabled={!isValid || !rawText}>
                                <FileJson size={14} className={styles.itemIcon} />
                                <span>Natural Language Query...</span>
                            </button>

                            <button className={styles.menuItem} onClick={() => { setPromptModalOpen(true, 'convert'); setAiMenuOpen(false); }} disabled={!isValid || !rawText}>
                                <MessageSquareText size={14} className={styles.itemIcon} />
                                <span>Smart Convert...</span>
                            </button>

                            <div className={styles.menuDivider} />

                            <button className={styles.menuItem} onClick={() => { generateSchemaWithAI(); setAiMenuOpen(false); }} disabled={!isValid || !rawText}>
                                <Code size={14} className={styles.itemIcon} />
                                <span>Generate Schema</span>
                            </button>

                            <button className={styles.menuItem} onClick={() => { explainJsonWithAI(); setAiMenuOpen(false); }} disabled={!isValid || !rawText}>
                                <HelpCircle size={14} className={styles.itemIcon} />
                                <span>Explain Data</span>
                            </button>
                        </div>
                    )}
                </div>

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
                                <span className={styles.desktopLabel}>Code</span>
                            </button>
                            <button
                                className={`${styles.toolButton} ${viewMode === 'split' ? styles.active : ''}`}
                                onClick={() => setViewMode('split')}
                                title="Tree View"
                            >
                                <FolderTree size={16} />
                                <span className={styles.desktopLabel}>Tree</span>
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
                        title="Settings"
                    >
                        <Settings size={16} />
                    </button>
                </div>
            </div>
        </header>
    );
}
