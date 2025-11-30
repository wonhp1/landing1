import styles from '../styles/Toast.module.css';

export default function Toast({ message, isVisible }) {
    if (!isVisible) return null;

    return (
        <div className={styles.toast}>
            <span className={styles.icon}>✓</span>
            <span className={styles.message}>{message}</span>
        </div>
    );
}
