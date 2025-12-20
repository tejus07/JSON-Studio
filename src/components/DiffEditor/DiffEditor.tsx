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
import { useJsonStore } from '../../store/useJsonStore';
import styles from './DiffEditor.module.css';

export function DiffEditor() {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<MergeView | null>(null);
    const { rawText, secondaryText, setSecondaryText, theme } = useJsonStore();

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
                doc: rawText,
                extensions: [...commonExtensions, EditorView.editable.of(false), EditorState.readOnly.of(true)],
            },
            b: {
                doc: secondaryText,
                extensions: [
                    ...commonExtensions,
                    EditorView.updateListener.of((update) => {
                        if (update.docChanged) {
                            setSecondaryText(update.state.doc.toString());
                        }
                    })
                ],
            },
            parent: containerRef.current,
            gutter: true,
            highlightChanges: true,
            collapseUnchanged: { margin: 3 }, // Collapse unchanged regions to focus on diffs
        });

        viewRef.current = view;

        return () => {
            view.destroy();
        };
    }, []); // Run once on mount, updates handled mostly by state if we wanted responsive props but mergeview is heavy.

    // Effect to update Left Pane if rawText changes externally (unlikely while in diff mode but good practice)
    useEffect(() => {
        if (viewRef.current && viewRef.current.a.state.doc.toString() !== rawText) {
            viewRef.current.a.dispatch({
                changes: { from: 0, to: viewRef.current.a.state.doc.length, insert: rawText }
            });
        }
    }, [rawText]);

    // Effect to update Right Pane if secondaryText changes externally
    useEffect(() => {
        // Avoid loop
        if (viewRef.current && viewRef.current.b.state.doc.toString() !== secondaryText) {
            viewRef.current.b.dispatch({
                changes: { from: 0, to: viewRef.current.b.state.doc.length, insert: secondaryText }
            });
        }
    }, [secondaryText]);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.paneTitle}>Original (Read-only)</div>
                <div className={styles.paneTitle}>Modified (Editable)</div>
            </div>
            <div className={styles.editorWrapper} ref={containerRef} />
        </div>
    );
}
