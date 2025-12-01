import { useEffect, useState } from 'react';
import styles from '../styles/ProductDetailModal.module.css';

export default function ProductDetailModal({ isOpen, onClose, product, onAddToCart }) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Parse detail images from detailPageUrl (comma-separated)
    const detailImages = product?.detailPageUrl
        ?.split(',')
        .map(url => url.trim())
        .filter(url => url.length > 0) || [];

    useEffect(() => {
        setCurrentImageIndex(0);
    }, [product]);

    // Lock body scroll when modal is open and preserve scroll position
    useEffect(() => {
        if (isOpen) {
            // Save current scroll position
            const scrollY = window.scrollY;
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = '100%';
            document.body.style.overflow = 'hidden';
        } else {
            // Restore scroll position
            const scrollY = document.body.style.top;
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            document.body.style.overflow = '';
            if (scrollY) {
                window.scrollTo(0, parseInt(scrollY || '0') * -1);
            }
        }
    }, [isOpen]);

    if (!isOpen || !product) return null;

    const handleAddToCart = () => {
        onAddToCart(product);
        onClose();
    };

    const handlePrevImage = () => {
        setCurrentImageIndex((prev) =>
            prev === 0 ? detailImages.length - 1 : prev - 1
        );
    };

    const handleNextImage = () => {
        setCurrentImageIndex((prev) =>
            prev === detailImages.length - 1 ? 0 : prev + 1
        );
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose}>×</button>

                <div className={styles.productHeader}>
                    {product.imageUrl && (
                        <img
                            src={product.imageUrl}
                            alt={product.name}
                            className={styles.productImage}
                        />
                    )}
                    <div className={styles.productInfo}>
                        {product.category && (
                            <span className={styles.categoryBadge}>{product.category}</span>
                        )}
                        <h2 className={styles.productName}>{product.name}</h2>
                        <p className={styles.productDescription}>{product.description}</p>
                        <div className={styles.priceInfo}>
                            {product.weight > 0 && (
                                <span className={styles.weight}>{product.weight}g</span>
                            )}
                            <span className={styles.price}>{product.price.toLocaleString()}원</span>
                        </div>
                    </div>
                </div>

                {/* Detail Image Gallery */}
                {detailImages.length > 0 && (
                    <div className={styles.detailSection}>
                        <h3 className={styles.sectionTitle}>상품 상세 정보</h3>
                        <div className={styles.imageGallery}>
                            <div className={styles.imageContainer}>
                                <img
                                    src={detailImages[currentImageIndex]}
                                    alt={`상세 이미지 ${currentImageIndex + 1}`}
                                    className={styles.detailImage}
                                />

                                {detailImages.length > 1 && (
                                    <>
                                        <button
                                            className={`${styles.navButton} ${styles.navButtonPrev}`}
                                            onClick={handlePrevImage}
                                            aria-label="이전 이미지"
                                        >
                                            ‹
                                        </button>
                                        <button
                                            className={`${styles.navButton} ${styles.navButtonNext}`}
                                            onClick={handleNextImage}
                                            aria-label="다음 이미지"
                                        >
                                            ›
                                        </button>
                                        <div className={styles.imageCounter}>
                                            {currentImageIndex + 1} / {detailImages.length}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <button
                    className={styles.addButton}
                    onClick={handleAddToCart}
                    disabled={!product.available}
                >
                    {product.available ? '장바구니 담기' : '품절'}
                </button>
            </div>
        </div>
    );
}
