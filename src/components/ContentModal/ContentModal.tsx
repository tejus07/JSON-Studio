import { X, Copy, Check, Sparkles, FileCode, Wand2, Info, Table as TableIcon, Download } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useJsonStore } from '../../store/useJsonStore';
import { toast } from 'sonner';
import Markdown from 'react-markdown';
import { Editor } from '../Editor/Editor';

import styles from './ContentModal.module.css';

export function ContentModal() {
    const { generatedContent, setGeneratedContent, setText, theme } = useJsonStore();
    const [copied, setCopied] = useState(false);
    const [viewMode, setViewMode] = useState<'code' | 'table'>('code');

    // Parse JSON for Table View
    const tableData = useMemo(() => {
        if (!generatedContent || generatedContent.type !== 'code' && generatedContent.type !== 'fix-preview') return null;
        try {
            const data = JSON.parse(generatedContent.content);
            if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
                return data;
            }
        } catch (e) {
            return null;
        }
        return null; // Not tabular
    }, [generatedContent]);

    // Auto-switch to table if valid
    useMemo(() => {
        if (tableData) setViewMode('table');
    }, [tableData]);

    if (!generatedContent) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedContent.content);
        setCopied(true);
        toast.success('Copied to clipboard'); // Added toast
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const blob = new Blob([generatedContent.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        // Infer extension from title or just use .txt
        let ext = '.txt';
        if (generatedContent.title.includes('CSV')) ext = '.csv';
        if (generatedContent.title.includes('JSON')) ext = '.json';
        if (generatedContent.title.includes('YAML')) ext = '.yaml';
        if (generatedContent.title.includes('XML')) ext = '.xml';

        a.download = `result${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleClose = () => {
        setGeneratedContent(null);
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <div className={styles.titleGroup}>
                        {generatedContent.type === 'fix-preview' ? <Wand2 size={18} className={styles.icon} /> :
                            generatedContent.type === 'code' ? <FileCode size={18} className={styles.icon} /> :
                                <Sparkles size={18} className={styles.icon} />
                        }
                        <div className={styles.titleWrapper}>
                            <h2 className={styles.title}>{generatedContent.title}</h2>
                            {generatedContent.prompt && (
                                <span className={styles.promptSubtitle} title={generatedContent.prompt}>
                                    "{generatedContent.prompt}"
                                </span>
                            )}
                        </div>
                    </div>

                    {tableData && (
                        <div className={styles.viewToggle}>
                            <button
                                className={`${styles.toggleBtn} ${viewMode === 'table' ? styles.activeToggle : ''}`}
                                onClick={() => setViewMode('table')}
                            >
                                <TableIcon size={14} /> Table
                            </button>
                            <button
                                className={`${styles.toggleBtn} ${viewMode === 'code' ? styles.activeToggle : ''}`}
                                onClick={() => setViewMode('code')}
                            >
                                <FileCode size={14} /> Code
                            </button>
                        </div>
                    )}

                    <div className={styles.actions}>
                        {generatedContent.type === 'fix-preview' ? (
                            <>
                                <button
                                    className={`${styles.actionBtn} ${styles.primaryBtn}`}
                                    onClick={() => {
                                        setText(generatedContent.content);
                                        setGeneratedContent(null);
                                        toast.success('Content applied successfully');
                                    }}
                                    title="Accept"
                                >
                                    <Check size={16} style={{ marginRight: 4 }} />
                                    {generatedContent.actionLabel || 'Apply Fix'}
                                </button>

                                {generatedContent.isPartial && (
                                    <button
                                        className={`${styles.actionBtn} ${styles.primaryBtn} ${styles.fixAgainBtn}`}
                                        onClick={() => {
                                            // Trigger fix again with current content
                                            useJsonStore.getState().fixJsonWithAI(generatedContent.content);
                                        }}
                                        title="Fix Next Error"
                                        style={{ backgroundColor: 'var(--color-warning)', color: 'black' }}
                                    >
                                        <Wand2 size={16} style={{ marginRight: 4 }} />
                                        Fix Next Error
                                    </button>
                                )}
                                <button
                                    className={styles.actionBtn}
                                    onClick={handleClose}
                                    title="Reject"
                                >
                                    <X size={18} />
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    className={styles.actionBtn}
                                    onClick={handleCopy}
                                    title="Copy to Clipboard"
                                >
                                    {copied ? <Check size={18} /> : <Copy size={18} />}
                                </button>
                                <button
                                    className={styles.actionBtn}
                                    onClick={handleDownload}
                                    title="Download"
                                >
                                    <Download size={18} />
                                </button>
                                <button
                                    className={styles.actionBtn}
                                    onClick={handleClose}
                                    title="Close"
                                >
                                    <X size={18} />
                                </button>
                            </>
                        )}
                    </div>
                </div>
                <div className={styles.body}>
                    {generatedContent.explanation && (
                        <div className={styles.explanationBox}>
                            <Info size={16} className={styles.explanationIcon} />
                            <span className={styles.explanationText}>{generatedContent.explanation}</span>
                        </div>
                    )}
                    {generatedContent.type === 'markdown' ? (
                        <div className={styles.markdownWrapper}>
                            <Markdown>{generatedContent.content}</Markdown>
                        </div>
                    ) : (
                        viewMode === 'table' && tableData ? (
                            <div className={styles.tableWrapper}>
                                <table className={styles.dataTable}>
                                    <thead>
                                        <tr>
                                            {Object.keys(tableData[0]).map(key => <th key={key}>{key}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tableData.map((row: any, i: number) => (
                                            <tr key={i}>
                                                {Object.values(row).map((val: any, j) => (
                                                    <td key={j}>{
                                                        typeof val === 'object' ? JSON.stringify(val) : String(val)
                                                    }</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <Editor
                                initialValue={generatedContent.content}
                                onChange={() => { }}
                                theme={theme}
                            />
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
