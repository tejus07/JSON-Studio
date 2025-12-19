import { useJsonStore } from '../../store/useJsonStore';
import { JsonNode } from './JsonNode';
import styles from './JsonTree.module.css';

export function JsonTree() {
    const { parsedData, isValid, rawText } = useJsonStore();

    if (!rawText || !rawText.trim()) {
        return (
            <div className={styles.empty}>
                <p>Start typing or paste JSON to visualize</p>
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

    return (
        <div className={styles.container}>
            <JsonNode
                name=""
                value={parsedData}
                isLast={true}
            />
        </div>
    );
}
