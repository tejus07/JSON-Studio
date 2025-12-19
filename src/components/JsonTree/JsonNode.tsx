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
    const [expanded, setExpanded] = useState(true);
    const [justCopied, setJustCopied] = useState(false);

    const isObject = value !== null && typeof value === 'object';
    const isArray = Array.isArray(value);
    const isEmpty = isObject && Object.keys(value).length === 0;

    const handleCopyPath = (e: React.MouseEvent) => {
        e.stopPropagation();
        // If it's the root node (no name), we might just say "root" or empty
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
                    /* For array items that are primitives, maybe allow clicking the value or a bullet? 
                       For now, just the value */
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
                        {isArray ? `${keys.length} items` : `${keys.length} keys`}
                    </span>
                )}

                {!expanded && (
                    <span className={styles.bracket}>
                        {isArray ? ']' : '}'}
                        {!isLast && ','}
                    </span>
                )}
            </div>

            {expanded && !isEmpty && (
                <div className={styles.children}>
                    {keys.map((key, index) => (
                        <JsonNode
                            key={key}
                            name={isArray ? '' : key}
                            value={value[key]}
                            isLast={index === keys.length - 1}
                            depth={depth + 1}
                            path={isArray ? `${path}[${index}]` : `${path ? path : ''}["${key}"]`}
                        />
                    ))}
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
