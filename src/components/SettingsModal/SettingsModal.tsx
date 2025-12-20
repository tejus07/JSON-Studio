import { useState, useEffect } from 'react';
import { useJsonStore } from '../../store/useJsonStore';
import { listModels } from '../../services/aiService';
import { X, Key, ShieldCheck, BoxSelect, RefreshCw, Palette, Sun, Moon } from 'lucide-react';
import styles from './SettingsModal.module.css';

export function SettingsModal() {
    const { isAiModalOpen, setAiModalOpen, apiKey, setApiKey, preferredModel, setPreferredModel, theme, setTheme } = useJsonStore();

    // Local state for pending changes
    const [localKey, setLocalKey] = useState(apiKey);
    const [localTheme, setLocalTheme] = useState(theme);
    const [localModel, setLocalModel] = useState(preferredModel);

    const [models, setModels] = useState<any[]>([]);
    const [loadingModels, setLoadingModels] = useState(false);

    // Sync local state when modal opens
    useEffect(() => {
        if (isAiModalOpen) {
            setLocalKey(apiKey);
            setLocalTheme(theme);
            setLocalModel(preferredModel);

            if (apiKey) {
                fetchModels(apiKey);
            }
        }
    }, [isAiModalOpen, apiKey, theme, preferredModel]);

    const fetchModels = async (key: string) => {
        if (!key) return;
        setLoadingModels(true);
        const list = await listModels(key);
        setModels(list);
        setLoadingModels(false);
    };

    if (!isAiModalOpen) return null;

    const handleSave = () => {
        setApiKey(localKey);
        setTheme(localTheme);
        setPreferredModel(localModel);
        setAiModalOpen(false);
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h3>Settings</h3>
                    <button onClick={() => setAiModalOpen(false)} className={styles.closeBtn}>
                        <X size={18} />
                    </button>
                </div>

                <div className={styles.content}>
                    <div className={styles.sectionTitle}>General</div>
                    <div className={styles.inputGroup}>
                        <label>Appearance</label>
                        <div className={styles.inputWrapper}>
                            <Palette size={16} className={styles.inputIcon} />
                            <div className={styles.toggleRow} onClick={() => setLocalTheme(localTheme === 'dark' ? 'light' : 'dark')}>
                                <span className={styles.toggleText}>{localTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                                <button className={styles.themeBtn}>
                                    {localTheme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className={styles.sectionDivider} />

                    <div className={styles.sectionTitle}>Intelligence</div>
                    <div className={styles.inputGroup}>
                        <label>Google Gemini API Key</label>
                        <div className={styles.inputWrapper}>
                            <Key size={16} className={styles.inputIcon} />
                            <input
                                type="password"
                                placeholder="Enter your API Key"
                                value={localKey}
                                onChange={(e) => setLocalKey(e.target.value)}
                                className={styles.input}
                            />
                        </div>
                        <p className={styles.hint}>
                            Your key is stored locally in your browser. We never see it.
                        </p>
                    </div>

                    <div className={styles.inputGroup}>
                        <label>Preferred Model</label>
                        <div className={styles.inputWrapper}>
                            <BoxSelect size={16} className={styles.inputIcon} />
                            <select
                                value={localModel}
                                onChange={(e) => setLocalModel(e.target.value)}
                                className={styles.select}
                                disabled={loadingModels || models.length === 0}
                            >
                                <option value="auto">Auto (Recommended)</option>
                                {models.map((m) => (
                                    <option key={m.name} value={m.name}>
                                        {m.displayName || m.name.replace('models/', '')}
                                    </option>
                                ))}
                            </select>
                            {models.length === 0 && localKey && (
                                <button onClick={() => fetchModels(localKey)} className={styles.refreshBtn} title="Refresh Models">
                                    <RefreshCw size={14} className={loadingModels ? styles.spin : ''} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className={styles.info}>
                        <ShieldCheck size={16} className={styles.infoIcon} />
                        <span>Enables Fix, Generate, Query, Schema, and more.</span>
                    </div>
                </div>

                <div className={styles.footer}>
                    <button onClick={() => setAiModalOpen(false)} className={styles.cancelBtn}>Cancel</button>
                    <button onClick={handleSave} className={styles.saveBtn}>Save Settings</button>
                </div>
            </div>
        </div>
    );
}
