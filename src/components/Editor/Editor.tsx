import { useEffect, useRef } from 'react';
import { AlignLeft } from 'lucide-react';
import { toast } from 'sonner';
import { EditorState, Compartment } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { bracketMatching, foldGutter, foldKeymap, indentOnInput, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { searchKeymap, search } from '@codemirror/search';
import styles from './Editor.module.css';
import { formatJSON } from '../../utils/jsonUtils';

interface EditorProps {
    initialValue?: string;
    theme?: 'light' | 'dark';
    onChange?: (value: string) => void;
}

export function Editor({ initialValue = '', theme = 'dark', onChange }: EditorProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);

    // Use a Compartment for the Theme
    const themeCompartment = useRef(new Compartment());

    useEffect(() => {
        if (!containerRef.current) return;

        const startState = EditorState.create({
            doc: initialValue,
            extensions: [
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
                search({ top: true }), // Show search panel at top

                json(),
                themeCompartment.current.of(onUpdateTheme(theme)), // Initial theme setup

                keymap.of([
                    ...closeBracketsKeymap,
                    ...defaultKeymap,
                    ...searchKeymap,
                    ...historyKeymap,
                    ...foldKeymap,
                ]),

                EditorView.domEventHandlers({
                    paste(event, view) {
                        const text = event.clipboardData?.getData('text/plain');
                        if (!text) return;

                        const trimmed = text.trim();
                        // Optimization: Only attempt to parse if it looks like a JSON object or array
                        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
                            try {
                                // Check validity and format
                                const formatted = formatJSON(trimmed);
                                // formatJSON returns original string if invalid, so we strictly check if it parses via JSON.parse first
                                // actually formatJSON swallows error, so let's verify validity explicitly to avoid formatting partial non-json text that implies json
                                JSON.parse(trimmed);

                                // If we got here, it's valid. Use the formatted version.
                                view.dispatch(view.state.replaceSelection(formatted));
                                event.preventDefault();
                                return true;
                            } catch (e) {
                                // Invalid JSON, let default handler take over
                            }
                        }
                    }
                }),

                EditorView.updateListener.of((update) => {
                    if (update.docChanged && onChange) {
                        onChange(update.state.doc.toString());
                    }
                }),
            ],
        });

        const view = new EditorView({
            state: startState,
            parent: containerRef.current,
        });

        viewRef.current = view;

        return () => {
            view.destroy();
        };
    }, []); // Run once on mount

    // Effect to handle theme updates essentially
    useEffect(() => {
        if (viewRef.current) {
            viewRef.current.dispatch({
                effects: themeCompartment.current.reconfigure(
                    theme === 'dark' ? oneDark : []
                )
            })
        }
    }, [theme]);

    // Update editor content when initialValue changes (e.g. Format/Minify)
    // We strictly check if the content is different to avoid resetting cursor position on every render if we were controlled.
    // Since this is technically "semi-controlled" now.
    useEffect(() => {
        if (viewRef.current && initialValue !== undefined) {
            const currentDoc = viewRef.current.state.doc.toString();
            if (currentDoc !== initialValue) {
                viewRef.current.dispatch({
                    changes: { from: 0, to: currentDoc.length, insert: initialValue }
                });
            }
        }
    }, [initialValue]);

    // Note: We deliberately do not update the doc when props.initialValue changes 
    // to avoid fighting with the editor state. This is an uncontrolled component pattern for now.

    const handleFormat = () => {
        if (!viewRef.current) return;

        const currentDoc = viewRef.current.state.doc.toString();
        const formatted = formatJSON(currentDoc);

        // Only update if it actually changed to avoid cursor jumping if already formatted
        if (formatted !== currentDoc) {
            viewRef.current.dispatch({
                changes: { from: 0, to: currentDoc.length, insert: formatted }
            });
            toast.success('Formatted');
        } else {
            toast.info('Already formatted');
        }
    };

    return (
        <div className={styles.editorContainer} ref={containerRef}>
            <button
                className={styles.floatingFormatBtn}
                onClick={handleFormat}
                title="Format JSON"
            >
                <AlignLeft size={14} />
                <span className={styles.btnLabel}>Format</span>
            </button>
        </div>
    );
}

// Helper
const onUpdateTheme = (theme: 'light' | 'dark') => {
    return theme === 'dark' ? oneDark : [];
}
