import { FileJson, Upload, Download, Copy, Trash2, AlignLeft, Minimize, Wand2, Code, FolderTree, HelpCircle, Settings, Loader2, MessageSquareText, Sparkles, GitCompare, ArrowLeft, ArrowRightLeft, Check, ListOrdered, ArrowUp, ArrowDown } from 'lucide-react';
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
        setPromptModalOpen,
        isDiffView,
        setDiffView,
        dispatchCommand,
        setDiffLeft,
        setDiffRight,
        diffStats
    } = useJsonStore();

    // Refs for Diff Uploads
    const diffLeftRef = useRef<HTMLInputElement>(null);
    const diffRightRef = useRef<HTMLInputElement>(null);

    const handleDiffUpload = (e: React.ChangeEvent<HTMLInputElement>, side: 'left' | 'right') => {
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
            {/* Logo removed from here, moved to Left Section inside Toolbar flex container */}

            <div className={styles.toolbar}>
                {isDiffView ? (
                    <>
                        {/* Diff Mode Toolbar */}
                        {/* Unified Diff Mode Toolbar */}
                        <div className={styles.toolGroup}>
                            <button
                                onClick={() => setDiffView(false)}
                                className={styles.toolButton}
                                title="Exit Diff Mode"
                            >
                                <ArrowLeft size={16} />
                                <span className={styles.desktopLabel}>Back</span>
                            </button>
                        </div>
                        <div className={styles.divider} />

                        {/* Result Stage Tools - Always Visible */}
                        <div className={styles.toolGroup}>
                            {/* File Uploads (Hidden but actionable via small icons if needed, or stick to paste) */}
                            {/* Let's keep the upload buttons but smaller/integrated? Or just rely on paste for now as per plan. */}
                            {/* Actually, user might want to load files directly. Let's keep minimal upload triggers. */}

                            <input type="file" ref={diffLeftRef} hidden onChange={(e) => handleDiffUpload(e, 'left')} accept=".json" />
                            <input type="file" ref={diffRightRef} hidden onChange={(e) => handleDiffUpload(e, 'right')} accept=".json" />

                            <button onClick={() => diffLeftRef.current?.click()} className={styles.toolButton} title="Load Left File">
                                <Upload size={16} />
                                <span className={styles.desktopLabel}>Left</span>
                            </button>
                            <button onClick={() => diffRightRef.current?.click()} className={styles.toolButton} title="Load Right File">
                                <Upload size={16} />
                                <span className={styles.desktopLabel}>Right</span>
                            </button>

                            <div className={styles.divider} />

                            <button onClick={() => dispatchCommand('swap')} className={styles.toolButton} title="Swap Sides">
                                <ArrowRightLeft size={16} />
                            </button>
                            <button onClick={() => dispatchCommand('smartSort')} className={styles.toolButton} title="Smart Sort Keys">
                                <ListOrdered size={16} />
                                <span className={styles.desktopLabel}>Sort</span>
                            </button>

                            <div className={styles.divider} />

                            <button onClick={() => dispatchCommand('prevChange')} className={styles.toolButton} title="Previous Change">
                                <ArrowUp size={16} />
                            </button>
                            <button onClick={() => dispatchCommand('nextChange')} className={styles.toolButton} title="Next Change">
                                <ArrowDown size={16} />
                            </button>
                            {diffStats.changes > 0 && (
                                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginLeft: '4px' }}>
                                    {diffStats.changes} Change{diffStats.changes !== 1 ? 's' : ''}
                                </span>
                            )}

                            <div className={styles.divider} />

                            <button onClick={() => dispatchCommand('applyRight')} className={`${styles.toolButton} ${styles.primaryAction}`} title="Use Modified JSON">
                                <Check size={16} />
                                <span className={styles.desktopLabel}>Apply</span>
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Standard Editor Toolbar */}
                        {/* LEFT SECTION: LOGO & FILES */}
                        <div className={styles.leftSection}>
                            {/* Logo */}
                            <div className={styles.logo}>
                                <FileJson size={20} className={styles.logoIcon} />
                                <span className={styles.logoText}>JSON Studio</span>
                            </div>

                            {/* File Actions */}
                            <div className={styles.toolGroup}>
                                <button onClick={onUpload} className={styles.toolButton} title="Open JSON File">
                                    <Upload size={16} />
                                </button>
                                <button onClick={onDownload} className={styles.toolButton} title="Save as JSON" disabled={!rawText}>
                                    <Download size={16} />
                                </button>
                                <div className={styles.divider} />
                                <button onClick={onCopy} className={styles.toolButton} title="Copy All" disabled={!rawText}>
                                    <Copy size={16} />
                                </button>
                                {!isMobile && (
                                    <button onClick={onClear} className={styles.toolButton} title="Clear Editor">
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* CENTER SECTION: VIEW SWITCHER */}
                        {!isMobile && (
                            <div className={styles.centerSection}>
                                <div className={styles.viewToggles}>
                                    <button
                                        className={`${styles.toolButton} ${viewMode === 'code' && !isDiffView ? styles.active : ''}`}
                                        onClick={() => { setViewMode('code'); setDiffView(false); }}
                                        title="Code View"
                                    >
                                        <Code size={16} />
                                        <span className={styles.desktopLabel}>Code</span>
                                    </button>
                                    <button
                                        className={`${styles.toolButton} ${viewMode === 'split' && !isDiffView ? styles.active : ''}`}
                                        onClick={() => { setViewMode('split'); setDiffView(false); }}
                                        title="Tree View"
                                    >
                                        <FolderTree size={16} />
                                        <span className={styles.desktopLabel}>Tree</span>
                                    </button>
                                    <div className={styles.divider} />
                                    <button
                                        className={`${styles.toolButton} ${isDiffView ? styles.active : ''}`}
                                        onClick={() => setDiffView(true)}
                                        title="Compare JSON (Beta)"
                                    >
                                        <GitCompare size={16} />
                                        <span className={styles.desktopLabel}>Diff</span>
                                        <span className={styles.betaBadge}>BETA</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* RIGHT SECTION: TOOLS & AI */}
                        <div className={styles.rightSection}>
                            {/* Edit Tools */}
                            <div className={styles.toolGroup}>
                                <button onClick={() => { format(); toast.success('JSON Formatted'); }} className={styles.toolButton} title="Format" disabled={!isValid || !rawText}>
                                    <AlignLeft size={16} />
                                </button>
                                <button onClick={() => { minify(); toast.success('JSON Minified'); }} className={styles.toolButton} title="Minify" disabled={!isValid || !rawText}>
                                    <Minimize size={16} />
                                </button>
                            </div>

                            {/* Fix Button (Contextual) */}
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
                                </div>
                            )}

                            {/* AI Magic Menu */}
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
                                {/* ... Dropdown Logic preserved if I don't touch distinct renders ... */}
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
                            {/* Global Settings Group */}
                            <div className={styles.divider} />

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
                    </>
                )}
            </div>
        </header>
    );
}
