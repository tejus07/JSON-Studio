import { useEffect, useRef, useState } from 'react';
import { MergeView } from '@codemirror/merge';
import { EditorState } from '@codemirror/state';
import { EditorView, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightActiveLine } from '@codemirror/view';
import { history } from '@codemirror/commands';
import { bracketMatching, foldGutter, indentOnInput, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import { closeBrackets } from '@codemirror/autocomplete';
import { search } from '@codemirror/search';
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
        setText,
        toolbarCommand,
        setDiffStats
    } = useJsonStore();

    const [viewId, setViewId] = useState(0); // Used to force remount on structural changes like Swap
    const lastCommandIdRef = useRef<number>(0);

    useEffect(() => {
        // console.log('DiffEditor Render:', { diffLeft, diffRight, cmd: toolbarCommand?.type });
    });

    const handleSwap = () => {
        // console.log('Handling Swap...', { currentLeft: diffLeft, currentRight: diffRight });
        const temp = diffLeft;
        setDiffLeft(diffRight);
        setDiffRight(temp);
        setViewId(v => v + 1); // Force remount to ensure diff is recalculated cleanly
        toast.success('Swapped panes');
    };

    const handleApply = () => {
        if (confirm('Overwrite original file with Modified content?')) {
            setText(diffRight);
            toast.success('Changes applied to main file');
        }
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

    // Listen for Toolbar Commands
    useEffect(() => {
        if (!toolbarCommand) return;

        // Prevent double-execution
        if (toolbarCommand.id === lastCommandIdRef.current) return;
        lastCommandIdRef.current = toolbarCommand.id;

        switch (toolbarCommand.type) {
            case 'swap':
                handleSwap();
                break;
            case 'smartSort':
                handleSmartSort();
                break;
            case 'applyRight':
                handleApply();
                break;
            case 'nextChange':
                scrollToChange('next');
                break;
            case 'prevChange':
                scrollToChange('prev');
                break;
        }
    }, [toolbarCommand]);

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
                    // EditorState.readOnly.of(true) - Removed to allow programmatic dispatch if needed per previous logs
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
                        // Update stats on every change/update if chunks changed?
                        // MergeView chunks property availability depends on computation.
                        // We might need a separate mechanism or assume it's roughly fast enough.
                        if (viewRef.current) {
                            setTimeout(() => {
                                if (viewRef.current) {
                                    setDiffStats({ changes: viewRef.current.chunks.length });
                                }
                            }, 100);
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
    }, [viewId]); // Remount on structural changes

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
            <div className={styles.editorWrapper} ref={containerRef} />
        </div>
    );
}
