import React from 'react';
import styles from '../styles/ProductCard.module.css';

export default function ProductCard({ product, onSelect }) {
    return (
        <div className={styles.card}>
            {product.imageUrl && (
                <div className={styles.imageContainer}>
                    <img src={product.imageUrl} alt={product.name} />
                </div>
            )}
            <div className={styles.content}>
                <div className={styles.header}>
                    {product.category && (
                        <span className={styles.categoryBadge}>{product.category}</span>
                    )}
                    <h3 className={styles.name}>{product.name}</h3>
                </div>
                <p className={styles.description}>{product.description}</p>
                <div className={styles.footer}>
                    <div className={styles.priceContainer}>
                        {product.weight > 0 && (
                            <span className={styles.weight} style={{ fontSize: '12px', color: '#666' }}>
                                {product.weight}g
                            </span>
                        )}
                        <span className={styles.price}>
                            {product.price.toLocaleString()}원
                        </span>
                    </div>
                    {onSelect && (
                        <button
                            className={styles.button}
                            onClick={(e) => onSelect(e)}
                            disabled={!product.available}
                        >
                            {product.available ? '장바구니 담기' : '품절'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
