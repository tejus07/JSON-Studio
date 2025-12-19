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
                                <h4>AI Features</h4>
                            </div>
                            <p>
                                <strong>Bring Your Own Key</strong>: Use your personal Gemini or OpenAI key.
                                Keys are stored locally. Zero middleman latency.
                            </p>
                            <ul className={styles.list}>
                                <li>✨ <strong>Auto-Fix</strong>: Repairs invalid JSON.</li>
                                <li>📝 <strong>Explain</strong>: Summarizes data structure.</li>
                                <li>🛠 <strong>Schema</strong>: Generates TypeScript interfaces.</li>
                            </ul>
                        </div>

                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <Zap size={20} />
                                <h4>Pro Tips</h4>
                            </div>
                            <ul className={styles.list}>
                                <li><strong>Path Copy</strong>: Click any key in Tree View to copy its path (e.g. <code>users[0].id</code>).</li>
                                <li><strong>Drag & Drop</strong>: Drop any JSON file to open.</li>
                                <li><strong>Auto-Save</strong>: Never worry about refreshing.</li>
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
