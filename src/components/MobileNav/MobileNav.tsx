import { Code, FolderTree, GitCompare } from 'lucide-react';
import { useJsonStore } from '../../store/useJsonStore';
import styles from './MobileNav.module.css';

export function MobileNav() {
    const { viewMode, setViewMode, isDiffView, setDiffView } = useJsonStore();

    return (
        <nav className={styles.nav}>
            <button
                className={`${styles.navItem} ${viewMode === 'code' && !isDiffView ? styles.active : ''}`}
                onClick={() => { setViewMode('code'); setDiffView(false); }}
            >
                <Code size={20} />
                <span>Code</span>
            </button>
            <div className={styles.divider} />
            <button
                className={`${styles.navItem} ${viewMode === 'tree' && !isDiffView ? styles.active : ''}`}
                onClick={() => { setViewMode('tree'); setDiffView(false); }}
            >
                <FolderTree size={20} />
                <span>Tree</span>
            </button>
            <div className={styles.divider} />
            <button
                className={`${styles.navItem} ${isDiffView ? styles.active : ''}`}
                onClick={() => setDiffView(true)}
                style={{ position: 'relative' }}
            >
                <GitCompare size={20} />
                <span>Diff</span>
                <span className={styles.betaBadge}>BETA</span>
            </button>
        </nav>
    );
}
