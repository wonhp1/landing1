import styles from '../styles/FloatingCartButton.module.css';

export default function FloatingCartButton({ onClick, itemCount }) {
    if (itemCount === 0) return null;

    return (
        <div className={styles.container}>
            <span className={styles.clickText}>클릭!</span>
            <button className={styles.button} onClick={onClick} aria-label="장바구니로 이동">
                <span className={styles.icon}>🛒</span>
                <span className={styles.badge}>{itemCount}</span>
            </button>
        </div>
    );
}
