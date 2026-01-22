import { FileJson, Upload, Keyboard, Search, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useJsonStore } from '../../store/useJsonStore';
import { JsonNode } from './JsonNode';
import styles from './JsonTree.module.css';

export function JsonTree() {
    const { parsedData, isValid, rawText } = useJsonStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [isSearchVisible, setIsSearchVisible] = useState(false);

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleToggleSearch = () => {
        if (isSearchVisible) {
            // Closing
            setSearchQuery('');
            setIsSearchVisible(false);
        } else {
            // Opening
            setIsSearchVisible(true);
        }
    };

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
            {isSearchVisible ? (
                <div className={styles.searchContainer}>
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="Find in JSON..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                    />
                    <button onClick={handleToggleSearch} className={styles.closeSearchBtn} title="Close Search">
                        <X size={16} />
                    </button>
                    <Search size={14} className={styles.searchIcon} />
                </div>
            ) : (
                <button
                    className={styles.floatingSearchBtn}
                    onClick={handleToggleSearch}
                    title="Find in JSON"
                >
                    <Search size={14} />
                    <span className={styles.btnLabel}>Find/Search</span>
                </button>
            )}

            <JsonNode
                name=""
                value={parsedData}
                isLast={true}
                defaultExpandedDepth={initialDepth}
                searchQuery={debouncedQuery.toLowerCase()}
            />
        </div>
    );
}
