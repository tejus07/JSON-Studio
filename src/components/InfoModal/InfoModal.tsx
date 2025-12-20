import { X, Shield, Cpu, Zap, Share2 } from 'lucide-react';
import { useJsonStore } from '../../store/useJsonStore';
import styles from './InfoModal.module.css';

export function InfoModal() {
    const { isInfoModalOpen, setInfoModalOpen } = useJsonStore();

    if (!isInfoModalOpen) return null;

    return (
        <div className={styles.overlay} onClick={() => setInfoModalOpen(false)}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <div className={styles.titleRow}>
                        <h2>JSON Studio</h2>
                        <span className={styles.version}>v1.0</span>
                    </div>
                    <button
                        className={styles.closeBtn}
                        onClick={() => setInfoModalOpen(false)}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.content}>
                    <section className={styles.privacySection}>
                        <div className={styles.iconBox}>
                            <Shield size={24} className={styles.shieldIcon} />
                        </div>
                        <div className={styles.privacyText}>
                            <h3>Client-Side & Private</h3>
                            <p>
                                Your data never leaves your browser. We do not store any JSON on our servers.
                                Persistence is handled strictly via your browser's <code>localStorage</code>.
                            </p>
                        </div>
                    </section>

                    <div className={styles.grid}>
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <Cpu size={20} />
                                <h4>AI Power Tools</h4>
                            </div>
                            <p>
                                Press <kbd>Cmd+K</kbd> to open the Command Palette.
                            </p>
                            <ul className={styles.list}>
                                <li>✨ <strong>Generate</strong>: Create mock data from descriptions.</li>
                                <li>🔍 <strong>Query</strong>: Filter using natural language.</li>
                                <li>🔄 <strong>Convert</strong>: Transform JSON to CSV/XML/YAML.</li>
                                <li>🐛 <strong>Auto-Fix</strong>: Repair invalid JSON instantly.</li>
                            </ul>
                        </div>

                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <Zap size={20} />
                                <h4>Pro Shortcuts</h4>
                            </div>
                            <ul className={styles.shortcutList}>
                                <li>
                                    <span>Find & Replace</span>
                                    <kbd>Cmd + F</kbd>
                                </li>
                                <li>
                                    <span>Command Palette</span>
                                    <kbd>Cmd + K</kbd>
                                </li>
                                <li>
                                    <span>Quick Fix</span>
                                    <kbd>Cmd + Shift + F</kbd>
                                </li>
                                <li>
                                    <span>Save File</span>
                                    <kbd>Cmd + S</kbd>
                                </li>
                                <li>
                                    <span>Magic Paste</span>
                                    <kbd>Cmd + V</kbd>
                                    <span className={styles.subtext}>(on empty screen)</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className={styles.footer}>
                        <p>Designed for focus and speed.</p>
                        <a href="https://github.com/tejus07/JSON-Studio" target="_blank" rel="noopener noreferrer" className={styles.link}>
                            View on GitHub <Share2 size={12} />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
