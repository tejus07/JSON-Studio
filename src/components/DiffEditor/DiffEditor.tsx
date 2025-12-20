import { useEffect, useRef } from 'react';
import { MergeView } from '@codemirror/merge';
import { EditorState } from '@codemirror/state';
import { EditorView, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightActiveLine } from '@codemirror/view';
import { history } from '@codemirror/commands';
import { bracketMatching, foldGutter, indentOnInput, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import { closeBrackets } from '@codemirror/autocomplete';
import { search } from '@codemirror/search';
import { ArrowRightLeft, ArrowLeft, Copy, Clipboard, Trash2, AlignLeft, ArrowDown, ArrowUp } from 'lucide-react';
import { toast } from 'sonner';
import { useJsonStore } from '../../store/useJsonStore';
import { formatAndSortJSON } from '../../utils/jsonUtils';
import styles from './DiffEditor.module.css';

export function DiffEditor() {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<MergeView | null>(null);
    const {
        diffLeft,
        diffRight,
        setDiffLeft,
        setDiffRight,
        theme,
        setText
    } = useJsonStore();

    const handleSwap = () => {
        const temp = diffLeft;
        setDiffLeft(diffRight);
        setDiffRight(temp);
        toast.success('Swapped panes');
    };

    const handleApply = () => {
        if (confirm('Overwrite original file with Modified content?')) {
            setText(diffRight);
            toast.success('Changes applied to main file');
        }
    };

    const handlePasteRight = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                setDiffRight(text);
                toast.success('Pasted to Modified pane');
            }
        } catch (e) {
            toast.error('Could not read clipboard');
        }
    };

    const handleCopyLeft = () => {
        setDiffRight(diffLeft);
        toast.success('Copied Original to Modified');
    };

    const handleSmartSort = () => {
        const sortedLeft = formatAndSortJSON(diffLeft);
        const sortedRight = formatAndSortJSON(diffRight);

        if (sortedLeft !== diffLeft || sortedRight !== diffRight) {
            setDiffLeft(sortedLeft);
            setDiffRight(sortedRight);
            toast.success('Keys sorted & formatted');
        } else {
            toast.info('Already sorted');
        }
    };

    const scrollToChange = (direction: 'next' | 'prev') => {
        if (!viewRef.current) return;

        const view = viewRef.current;
        const chunks = view.chunks; // Access chunks from MergeView
        if (!chunks || chunks.length === 0) {
            toast.info('No differences found');
            return;
        }

        const currentPos = view.a.state.selection.main.head;
        let targetChunk = null;

        if (direction === 'next') {
            targetChunk = chunks.find(c => c.fromA > currentPos);
            if (!targetChunk) targetChunk = chunks[0]; // Wrap around
        } else {
            // Find last chunk that starts before current pos
            targetChunk = [...chunks].reverse().find(c => c.fromA < currentPos);
            if (!targetChunk) targetChunk = chunks[chunks.length - 1]; // Wrap around
        }

        if (targetChunk) {
            view.a.dispatch({
                effects: EditorView.scrollIntoView(targetChunk.fromA, { y: 'center' }),
                selection: { anchor: targetChunk.fromA }
            });
            // Also scroll b
            view.b.dispatch({
                effects: EditorView.scrollIntoView(targetChunk.fromB, { y: 'center' }),
            });
        }
    };

    useEffect(() => {
        if (!containerRef.current) return;

        const commonExtensions = [
            lineNumbers(),
            highlightActiveLineGutter(),
            highlightSpecialChars(),
            history(),
            foldGutter(),
            drawSelection(),
            dropCursor(),
            EditorState.allowMultipleSelections.of(true),
            indentOnInput(),
            syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
            bracketMatching(),
            closeBrackets(),
            rectangularSelection(),
            crosshairCursor(),
            highlightActiveLine(),
            search({ top: true }),
            json(),
            theme === 'dark' ? oneDark : [],

            // Keymaps
            EditorView.domEventHandlers({
                paste: () => {
                    // Allow paste but maybe we want to intercept? Default is fine.
                }
            })
        ];

        const view = new MergeView({
            a: {
                doc: diffLeft,
                extensions: [
                    ...commonExtensions,
                    EditorView.editable.of(false),
                    EditorState.readOnly.of(true)
                ],
            },
            b: {
                doc: diffRight,
                extensions: [
                    ...commonExtensions,
                    EditorView.updateListener.of((update) => {
                        if (update.docChanged) {
                            setDiffRight(update.state.doc.toString());
                        }
                    })
                ],
            },
            parent: containerRef.current,
            gutter: true,
            highlightChanges: true,
            collapseUnchanged: { margin: 3 },
        });

        viewRef.current = view;

        return () => {
            view.destroy();
        };
    }, []); // Run once on mount, updates handled mostly by state if we wanted responsive props but mergeview is heavy.

    // Sync Left
    useEffect(() => {
        if (viewRef.current && viewRef.current.a.state.doc.toString() !== diffLeft) {
            viewRef.current.a.dispatch({
                changes: { from: 0, to: viewRef.current.a.state.doc.length, insert: diffLeft }
            });
        }
    }, [diffLeft]);

    // Sync Right
    useEffect(() => {
        if (viewRef.current && viewRef.current.b.state.doc.toString() !== diffRight) {
            viewRef.current.b.dispatch({
                changes: { from: 0, to: viewRef.current.b.state.doc.length, insert: diffRight }
            });
        }
    }, [diffRight]);

    return (
        <div className={styles.container}>
            <div className={styles.toolbar}>
                <div className={styles.group}>
                    <span className={styles.label}>Original</span>
                    <button className={styles.btn} onClick={handleCopyLeft} title="Copy Original to Right">
                        <Copy size={14} />
                    </button>
                </div>

                <div className={styles.centerActions}>
                    <button className={styles.actionBtn} onClick={handleSmartSort} title="Sort Keys & Align (Ignore Order)">
                        <AlignLeft size={16} />
                        <span>Smart Sort</span>
                    </button>
                    <button className={styles.actionBtn} onClick={handleSwap} title="Swap Left <-> Right">
                        <ArrowRightLeft size={16} />
                        <span>Swap</span>
                    </button>
                    <button className={`${styles.actionBtn} ${styles.primary}`} onClick={handleApply} title="Apply changes to Main File">
                        <ArrowLeft size={16} />
                        <span>Apply Change</span>
                    </button>
                </div>

                <div className={styles.group}>
                    <div className={styles.navGroup}>
                        <button className={styles.btn} onClick={() => scrollToChange('prev')} title="Previous Change">
                            <ArrowUp size={14} />
                        </button>
                        <button className={styles.btn} onClick={() => scrollToChange('next')} title="Next Change">
                            <ArrowDown size={14} />
                        </button>
                    </div>
                    <div className={styles.divider} />
                    <button className={styles.btn} onClick={handlePasteRight} title="Paste from Clipboard">
                        <Clipboard size={14} />
                    </button>
                    <button className={styles.btn} onClick={() => setDiffRight('')} title="Clear">
                        <Trash2 size={14} />
                    </button>
                    <span className={styles.label}>Modified</span>
                </div>
            </div>

            <div className={styles.editorWrapper} ref={containerRef} />
        </div>
    );
}
