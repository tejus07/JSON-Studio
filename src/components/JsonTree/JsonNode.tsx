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

    defaultExpandedDepth?: number;
    searchQuery?: string;
}

// Helper: Does this value or its children match?
// Note: This needs to be efficient.
// We will do a simpler check first: Does THIS node match?
const doesNodeMatch = (key: string, value: any, query: string): boolean => {
    if (!query) return true;
    if (key.toLowerCase().includes(query)) return true;
    if (value === null) return 'null'.includes(query);
    if (typeof value === 'string') return value.toLowerCase().includes(query);
    if (typeof value === 'number') return String(value).includes(query);
    if (typeof value === 'boolean') return String(value).includes(query);
    return false;
};

// Helper: Highlight text
const HighlightText = ({ text, query }: { text: string, query: string }) => {
    if (!query || !text.toLowerCase().includes(query)) return <>{text}</>;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
        <>
            {parts.map((part, i) =>
                part.toLowerCase() === query.toLowerCase() ? (
                    <span key={i} className={styles.highlight}>{part}</span>
                ) : (
                    part
                )
            )}
        </>
    );
};

// Helper: Recursive check for deep matching
const doesValueMatchDeep = (val: any, query: string): boolean => {
    if (!query) return false;
    if (val === null || typeof val !== 'object') return false;

    return Object.entries(val).some(([k, v]) => {
        if (doesNodeMatch(k, v, query)) return true;
        if (typeof v === 'object') return doesValueMatchDeep(v, query);
        return false;
    });
};

export function JsonNodeComponent({ name, value, isLast, depth = 0, path = '', defaultExpandedDepth = 0, searchQuery = '' }: JsonNodeProps) {
    // Search Logic
    // If query exists, we need to know if we should render.
    // We render if:
    // 1. We match the query (Name or Value)
    // 2. Any of our children match the query (search deep)

    // Derived state for matching
    // Warning: Deep recursion on every render might be slow for huge JSON.
    // React's memo helps, but if query changes, everything re-renders.
    // For MVP "Find", this is acceptable up to ~10k lines.

    const matchesSelf = doesNodeMatch(name, value, searchQuery);

    // We need to check children to decide if we stay visible even if self doesn't match
    const isObject = value !== null && typeof value === 'object';
    const isArray = Array.isArray(value);

    // Lazy check for children matching if we are an object
    // This is the expensive part.
    // Optimization: If searchQuery is empty, don't filter.

    let hasMatchingChild = false;
    // Filtering Logic:
    // If we have a search query, we want to know WHICH children match, so we can only show those.
    // But for "hasMatchingChild" (used for auto-expansion/visibility), we just need to know if ANY match.
    // To support "Fix Search Pagination", we need to compute the list of matching keys.

    let filteredKeys: string[] | null = null;

    if (searchQuery && isObject) {
        // Helper to check specific child
        const shouldShowNode = (k: string, v: any) => {
            return doesNodeMatch(k, v, searchQuery) || doesValueMatchDeep(v, searchQuery);
        };

        filteredKeys = Object.keys(value).filter(k => shouldShowNode(k, value[k]));
        hasMatchingChild = filteredKeys.length > 0;
    } else if (isObject) {
        // No search, but check if we need to know children existence? 
        // Actually if no search, hasMatchingChild is irrelevant (false).
    }

    // Force expand if children match
    const shouldExpand = searchQuery ? hasMatchingChild : depth <= defaultExpandedDepth;
    const [expanded, setExpanded] = useState(shouldExpand);
    const [justCopied, setJustCopied] = useState(false);
    const [visibleCount, setVisibleCount] = useState(50); // Pagination limit

    // Sync expansion with search
    if (searchQuery && hasMatchingChild && !expanded) {
        setExpanded(true); // Auto expand on search
    }

    // Visibility decision:
    // Show if: No query OR self match OR children match
    const isVisible = !searchQuery || matchesSelf || hasMatchingChild;

    if (!isVisible) return null;

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

    const showAll = (e: React.MouseEvent) => {
        e.stopPropagation();
        setVisibleCount(keys.length);
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
                        <HighlightText text={name} query={searchQuery} />:
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
                    {typeof value === 'string' ? (
                        <>
                            "<HighlightText text={value} query={searchQuery} />"
                        </>
                    ) : (
                        <HighlightText text={String(value)} query={searchQuery} />
                    )}
                </span>
                {!isLast && <span className={styles.punct}>,</span>}
            </div>
        );
    }

    const keys = filteredKeys || Object.keys(value);
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
                        <HighlightText text={name} query={searchQuery} />:
                    </span>
                )}

                <span className={styles.bracket}>
                    <Icon size={14} className={styles.nodeIcon} />
                </span>

                {!expanded && (
                    <span className={styles.collapsed}>
                        {getPreview(value)}
                        {/* Note: We don't highlight preview text to keep it simple, or we could if needed */}
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
                            defaultExpandedDepth={defaultExpandedDepth}
                            searchQuery={searchQuery}
                        />
                    ))}
                    {hasMore && (
                        <div className={styles.showMore} style={{ paddingLeft: (depth + 1) * 20 }}>
                            <button onClick={showMore} className={styles.showMoreBtn}>
                                Show {Math.min(50, keys.length - visibleCount)} more... ({keys.length - visibleCount} remaining)
                            </button>
                            <span style={{ margin: '0 8px', color: 'var(--text-muted)' }}>|</span>
                            <button onClick={showAll} className={styles.showMoreBtn}>
                                View All ({keys.length} items)
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
