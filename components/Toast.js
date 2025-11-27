import styles from '../styles/Toast.module.css';

export default function Toast({ message, isVisible }) {
    if (!isVisible) return null;

    return (
        <div className={styles.toast}>
            {message}
        </div>
    );
}
