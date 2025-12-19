import { useState, useEffect } from 'react';
import { useJsonStore } from '../../store/useJsonStore';
import { listModels } from '../../services/aiService';
import { X, Key, ShieldCheck, BoxSelect, RefreshCw } from 'lucide-react';
import styles from './SettingsModal.module.css';

export function SettingsModal() {
    const { isAiModalOpen, setAiModalOpen, apiKey, setApiKey, preferredModel, setPreferredModel } = useJsonStore();
    const [inputKey, setInputKey] = useState(apiKey);
    const [models, setModels] = useState<any[]>([]);
    const [loadingModels, setLoadingModels] = useState(false);

    useEffect(() => {
        if (isAiModalOpen && apiKey) {
            setInputKey(apiKey);
            fetchModels(apiKey);
        }
    }, [isAiModalOpen, apiKey]);

    const fetchModels = async (key: string) => {
        if (!key) return;
        setLoadingModels(true);
        const list = await listModels(key);
        setModels(list);
        setLoadingModels(false);
    };

    if (!isAiModalOpen) return null;

    const handleSave = () => {
        setApiKey(inputKey);
        setAiModalOpen(false);
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h3>AI Settings</h3>
                    <button onClick={() => setAiModalOpen(false)} className={styles.closeBtn}>
                        <X size={18} />
                    </button>
                </div>

                <div className={styles.content}>
                    <div className={styles.inputGroup}>
                        <label>Google Gemini API Key</label>
                        <div className={styles.inputWrapper}>
                            <Key size={16} className={styles.inputIcon} />
                            <input
                                type="password"
                                placeholder="Enter your API Key"
                                value={inputKey}
                                onChange={(e) => setInputKey(e.target.value)}
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
                                value={preferredModel}
                                onChange={(e) => setPreferredModel(e.target.value)}
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
                            {models.length === 0 && inputKey && (
                                <button onClick={() => fetchModels(inputKey)} className={styles.refreshBtn} title="Refresh Models">
                                    <RefreshCw size={14} className={loadingModels ? styles.spin : ''} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className={styles.info}>
                        <ShieldCheck size={16} className={styles.infoIcon} />
                        <span>Enables "Fix JSON" and "Explain" features.</span>
                    </div>
                </div>

                <div className={styles.footer}>
                    <button onClick={() => setAiModalOpen(false)} className={styles.cancelBtn}>Cancel</button>
                    <button onClick={handleSave} className={styles.saveBtn}>Save Key</button>
                </div>
            </div>
        </div>
    );
}
