import { FileJson, Upload, Keyboard } from 'lucide-react';
import { useJsonStore } from '../../store/useJsonStore';
import { JsonNode } from './JsonNode';
import styles from './JsonTree.module.css';

export function JsonTree() {
    const { parsedData, isValid, rawText } = useJsonStore();

    if (!rawText || !rawText.trim()) {
        return (
            <div className={styles.empty}>
                <div className={styles.emptyContent}>
                    <FileJson size={48} className={styles.emptyIcon} />
                    <h3>Ready to Visualize</h3>
                    <div className={styles.instructions}>
                        <div className={styles.instruction}>
                            <Keyboard size={16} />
                            <span>Type or Paste JSON</span>
                        </div>
                        <div className={styles.instruction}>
                            <Upload size={16} />
                            <span>Drag & Drop File</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!isValid || parsedData === null) {
        return (
            <div className={styles.empty}>
                <p>Invalid JSON</p>
            </div>
        );
    }

    // Determine default expansion depth based on size
    // < 10k: depth 3
    // < 50k: depth 2
    // > 50k: depth 0 (strictly virtualized)
    const size = rawText.length;
    const initialDepth = size < 10000 ? 3 : size < 50000 ? 1 : 0;

    return (
        <div className={styles.container}>
            <JsonNode
                name=""
                value={parsedData}
                isLast={true}
                defaultExpandedDepth={initialDepth}
            />
        </div>
    );
}
