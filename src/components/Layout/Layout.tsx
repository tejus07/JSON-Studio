import { useJsonStore } from '../../store/useJsonStore';
import { Editor } from '../Editor/Editor';
import { SettingsModal } from '../SettingsModal/SettingsModal';
import { FileJson, Check, AlertTriangle, Minimize, AlignLeft, Moon, Sun, Settings, Wand2 } from 'lucide-react';
import styles from './Layout.module.css';

export function Layout() {
    const { rawText, error, isValid, setText, format, minify, theme, setTheme, setAiModalOpen, fixJsonWithAI, isFixing } = useJsonStore();

    return (
        <div className={styles.layout}>
            <SettingsModal />
            <header className={styles.header}>
                <div className={styles.logo}>
                    <FileJson size={20} className={styles.logoIcon} />
                    <span className={styles.logoText}>JSON Studio</span>
                </div>

                <div className={styles.toolbar}>
                    <button onClick={format} className={styles.toolButton} title="Format JSON" disabled={!isValid || !rawText}>
                        <AlignLeft size={16} />
                        <span>Format</span>
                    </button>
                    <button onClick={minify} className={styles.toolButton} title="Minify JSON" disabled={!isValid || !rawText}>
                        <Minimize size={16} />
                        <span>Minify</span>
                    </button>

                    {!isValid && rawText && (
                        <button onClick={fixJsonWithAI} className={styles.toolButton} title="Fix with AI" disabled={isFixing}>
                            <Wand2 size={16} className={isFixing ? styles.spin : ''} />
                            <span>{isFixing ? 'Fixing...' : 'Fix'}</span>
                        </button>
                    )}
                </div>

                <div className={styles.actions}>
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
            </header>

            <main className={styles.main}>
                <Editor initialValue={rawText} onChange={setText} />
            </main>

            <footer className={`${styles.footer} ${isValid ? styles.valid : styles.invalid} `}>
                <div className={styles.status}>
                    {isValid ? (
                        <>
                            <Check size={14} />
                            <span>Valid JSON</span>
                        </>
                    ) : (
                        <>
                            <AlertTriangle size={14} />
                            <span>{error}</span>
                        </>
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
