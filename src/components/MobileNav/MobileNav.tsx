import { Code, FolderTree } from 'lucide-react';
import { useJsonStore } from '../../store/useJsonStore';
import styles from './MobileNav.module.css';

export function MobileNav() {
    const { viewMode, setViewMode } = useJsonStore();

    return (
        <nav className={styles.nav}>
            <button
                className={`${styles.navItem} ${viewMode === 'code' ? styles.active : ''}`}
                onClick={() => setViewMode('code')}
            >
                <Code size={20} />
                <span>Code</span>
            </button>
            <div className={styles.divider} />
            <button
                className={`${styles.navItem} ${viewMode === 'tree' ? styles.active : ''}`}
                onClick={() => setViewMode('tree')}
            >
                <FolderTree size={20} />
                <span>Tree</span>
            </button>
        </nav>
    );
}
