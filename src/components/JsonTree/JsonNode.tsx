import { useState, memo } from 'react';
import { ChevronRight, ChevronDown, Braces, Brackets } from 'lucide-react';
import { toast } from 'sonner';
import styles from './JsonTree.module.css';

interface JsonNodeProps {
    name: string;
    value: any;
    isLast: boolean;
    depth?: number;
    path?: string;
}

export function JsonNodeComponent({ name, value, isLast, depth = 0, path = '' }: JsonNodeProps) {
    const [expanded, setExpanded] = useState(depth === 0);
    const [justCopied, setJustCopied] = useState(false);
    const [visibleCount, setVisibleCount] = useState(50); // Pagination limit

    const isObject = value !== null && typeof value === 'object';
    const isArray = Array.isArray(value);
    const isEmpty = isObject && Object.keys(value).length === 0;

    const handleCopyPath = (e: React.MouseEvent) => {
        e.stopPropagation();
        const pathRef = path || (name ? `["${name}"]` : '');
        if (!pathRef) return;

        navigator.clipboard.writeText(pathRef);
        setJustCopied(true);
        toast.success(`Copied path: ${pathRef}`);
        setTimeout(() => setJustCopied(false), 1500);
    };

    const toggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setExpanded(!expanded);
    };

    const showMore = (e: React.MouseEvent) => {
        e.stopPropagation();
        setVisibleCount((prev) => prev + 50);
    };

    const getTypeColor = (val: any) => {
        if (val === null) return 'var(--syntax-constant)';
        if (typeof val === 'string') return 'var(--syntax-string)';
        if (typeof val === 'number') return 'var(--syntax-number)';
        if (typeof val === 'boolean') return 'var(--syntax-keyword)';
        return 'var(--text-main)';
    };

    const renderValue = (val: any) => {
        if (val === null) return 'null';
        if (typeof val === 'string') return `"${val}"`;
        return String(val);
    };

    const getPreview = (val: any) => {
        if (Array.isArray(val)) {
            return `${val.length} items`;
        }
        const keys = Object.keys(val);
        if (keys.length === 0) return '{}';

        // Pick first 2-3 interesting keys (try to find 'name', 'id', 'title' first)
        const priorityKeys = ['name', 'id', 'title', 'key', 'type', 'label'];
        let previewKeys = keys.filter(k => priorityKeys.includes(k.toLowerCase()));

        if (previewKeys.length === 0) {
            previewKeys = keys.slice(0, 3);
        } else {
            // Add a couple more non-priority if we have room
            const remaining = keys.filter(k => !priorityKeys.includes(k.toLowerCase())).slice(0, 1);
            previewKeys = [...previewKeys, ...remaining].slice(0, 3);
        }

        const previewParts = previewKeys.map(k => {
            const v = val[k];
            if (typeof v === 'object' && v !== null) return `${k}: [...]`;
            return `${k}: ${renderValue(v)}`;
        });

        return `{ ${previewParts.join(', ')}${keys.length > previewKeys.length ? ', ...' : ''} }`;
    };

    if (!isObject) {
        return (
            <div className={styles.line} style={{ paddingLeft: depth * 20 }}>
                {name && (
                    <span
                        className={`${styles.key} ${styles.copyableKey} ${justCopied ? styles.copied : ''}`}
                        onClick={handleCopyPath}
                        title="Click to copy path"
                    >
                        {name}:
                    </span>
                )}
                {!name && path && (
                    <span
                        className={`${styles.key} ${styles.copyableKey} ${justCopied ? styles.copied : ''}`}
                        onClick={handleCopyPath}
                        title="Click to copy path"
                        style={{ marginRight: 8, cursor: 'copy' }}
                    >•</span>
                )}
                <span className={styles.value} style={{ color: getTypeColor(value) }}>
                    {renderValue(value)}
                </span>
                {!isLast && <span className={styles.punct}>,</span>}
            </div>
        );
    }

    const keys = Object.keys(value);
    const visibleKeys = keys.slice(0, visibleCount);
    const hasMore = keys.length > visibleCount;
    const Icon = isArray ? Brackets : Braces;

    return (
        <div className={styles.node}>
            <div
                className={`${styles.line} ${styles.clickable}`}
                onClick={toggle}
                style={{ paddingLeft: depth * 20 }}
            >
                <button className={styles.toggleBtn}>
                    {!isEmpty && (expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
                </button>

                {name && (
                    <span
                        className={`${styles.key} ${styles.copyableKey} ${justCopied ? styles.copied : ''}`}
                        onClick={handleCopyPath}
                        title="Click to copy path"
                    >
                        {name}:
                    </span>
                )}

                <span className={styles.bracket}>
                    <Icon size={14} className={styles.nodeIcon} />
                </span>

                {!expanded && (
                    <span className={styles.collapsed}>
                        {getPreview(value)}
                    </span>
                )}

                {!expanded && (
                    <span className={styles.bracket}>
                        {isArray ? ']' : '}'}
                        {(!isLast) && ','}
                    </span>
                )}
            </div>

            {expanded && !isEmpty && (
                <div className={styles.children}>
                    {visibleKeys.map((key, index) => (
                        <JsonNode
                            key={key}
                            name={isArray ? '' : key}
                            value={value[key]}
                            isLast={index === keys.length - 1} // Logic is complicated with pagination, but visual 'isLast' within visible is ok.
                            // However, strictly speaking, isLast mostly controls the trailing comma.
                            // If we have more items hidden, the last visible item should probably have a comma if it's not truly the last item of the whole array.
                            // But simplifying: let's just show comma if index !== keys.length - 1
                            depth={depth + 1}
                            path={isArray ? `${path}[${index}]` : `${path ? path : ''}["${key}"]`}
                        />
                    ))}
                    {hasMore && (
                        <div className={styles.showMore} style={{ paddingLeft: (depth + 1) * 20 }}>
                            <button onClick={showMore} className={styles.showMoreBtn}>
                                Show {Math.min(50, keys.length - visibleCount)} more... ({keys.length - visibleCount} remaining)
                            </button>
                        </div>
                    )}
                </div>
            )}

            {expanded && (
                <div className={styles.line} style={{ paddingLeft: depth * 20 }}>
                    <span className={styles.bracket}>{isArray ? ']' : '}'}</span>
                    {!isLast && <span className={styles.punct}>,</span>}
                </div>
            )}
        </div>
    );
}

export const JsonNode = memo(JsonNodeComponent);
