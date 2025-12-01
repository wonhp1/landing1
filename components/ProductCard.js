import React, { useState, useEffect } from 'react';
import styles from '../styles/ProductCard.module.css';

export default function ProductCard({ product, onSelect }) {
    const [thumbnailUrl, setThumbnailUrl] = useState(null);

    useEffect(() => {
        const fetchImage = async () => {
            if (!product.detailPageUrl) return;

            // Check if it's a legacy image URL (comma separated or single)
            if (product.detailPageUrl.includes(',') || /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(product.detailPageUrl)) {
                setThumbnailUrl(product.detailPageUrl.split(',')[0].trim());
                return;
            }

            // It's likely a Notion URL - extract ID and fetch image
            const match = product.detailPageUrl.match(/([a-f0-9]{32}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
            const pageId = match ? match[1].replace(/-/g, '') : null;

            if (pageId) {
                try {
                    const res = await fetch(`/api/notion/image/${pageId}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.imageUrl) {
                            setThumbnailUrl(data.imageUrl);
                        }
                    }
                } catch (e) {
                    console.error("Failed to fetch Notion thumbnail", e);
                }
            }
        };

        fetchImage();
    }, [product.detailPageUrl]);

    return (
        <div className={styles.card}>
            {thumbnailUrl && (
                <div className={styles.imageContainer}>
                    <img src={thumbnailUrl} alt={product.name} />
                </div>
            )}
            <div className={styles.content}>
                <div className={styles.header}>
                    <div className={styles.categoryRow}>
                        {product.category && (
                            <span className={styles.categoryBadge}>{product.category}</span>
                        )}
                        <span className={styles.detailHint}>상세보기 🔍</span>
                    </div>
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
