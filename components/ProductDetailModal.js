import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useNotionCache } from '../contexts/NotionCacheContext';
import { extractNotionPageId } from '../utils/prefetchUtils';
import styles from '../styles/ProductDetailModal.module.css';

// Dynamic import to avoid SSR issues with react-notion-x
const NotionRenderer = dynamic(() => import('./NotionRenderer'), {
    ssr: false,
    loading: () => (
        <div style={{ padding: '40px', textAlign: 'center' }}>
            <div className="spinner"></div>
            <p>상세페이지를 불러오는 중</p>
        </div>
    )
});


export default function ProductDetailModal({ isOpen, onClose, product, onAddToCart }) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [notionData, setNotionData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Get global cache
    const { getPage, cachePage } = useNotionCache();

    // Parse detail images from detailPageUrl (comma-separated)
    const detailImages = product?.detailPageUrl
        ?.split(',')
        .map(url => url.trim())
        .filter(url => url.length > 0) || [];

    useEffect(() => {
        setCurrentImageIndex(0);
    }, [product]);

    // Lock body scroll when modal is open and preserve scroll position
    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Detect if detailPageUrl is a Notion page ID/URL or image URLs
    const isNotionPage = product?.detailPageUrl && (() => {
        const url = product.detailPageUrl.trim();

        // If it contains comma, it's multiple image URLs
        if (url.includes(',')) return false;

        // If it's a regular image URL (http/https ending with image extension)
        if (/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(url)) return false;

        // If it's a Notion URL (notion.so or notion.site) or looks like a page ID
        if (url.includes('notion.so') || url.includes('notion.site') ||
            /^[a-f0-9]{32}$/i.test(url.replace(/-/g, ''))) {
            return true;
        }

        return false;
    })();


    // Fetch Notion content when modal opens (if it's a Notion page)
    useEffect(() => {
        if (isOpen && isNotionPage && product?.detailPageUrl) {
            fetchNotionContent();
        } else {
            // Reset Notion data when switching to image gallery or closing
            setNotionData(null);
            setLoading(false);
            setError(null);
        }
    }, [isOpen, product?.detailPageUrl]);

    const fetchNotionContent = async () => {
        setError(null);

        try {
            // Extract clean page ID from URL
            const pageId = extractNotionPageId(product.detailPageUrl);

            if (!pageId) {
                throw new Error('유효하지 않은 Notion 페이지 URL입니다');
            }

            // 🚀 Check global cache first
            const cachedData = getPage(pageId);
            if (cachedData) {
                console.log(`⚡ Cache hit for page: ${product.name}`);
                setNotionData(cachedData);
                setLoading(false);
                return; // Skip API call!
            }

            // Cache miss - fetch from API
            console.log(`🔄 Cache miss - fetching page: ${product.name}`);
            setLoading(true);

            const res = await fetch(`/api/notion/${encodeURIComponent(pageId)}`);

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to fetch Notion page');
            }

            const data = await res.json();

            // Store in global cache
            cachePage(pageId, data);
            setNotionData(data);
        } catch (err) {
            console.error('Error fetching Notion content:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };


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

                {/* Detail Content Section - Notion or Image Gallery */}
                {product.detailPageUrl && (
                    <div className={styles.detailSection}>
                        <h3 className={styles.sectionTitle}>상품 상세 정보</h3>

                        {/* Notion Content */}
                        {isNotionPage && (
                            <>
                                {loading && (
                                    <div className={styles.loadingContainer}>
                                        <div className={styles.spinner}></div>
                                        <p>상세 정보를 불러오는 중...</p>
                                    </div>
                                )}

                                {error && (
                                    <div className={styles.errorContainer}>
                                        <p>❌ 상세 정보를 불러올 수 없습니다.</p>
                                        <small>{error}</small>
                                    </div>
                                )}

                                {notionData && !loading && !error && (
                                    <div className={styles.notionContent}>
                                        <NotionRenderer
                                            blocks={notionData.blocks}
                                            page={notionData.page}
                                        />
                                    </div>
                                )}
                            </>
                        )}

                        {/* Image Gallery (backward compatibility) */}
                        {!isNotionPage && detailImages.length > 0 && (
                            <div className={styles.imageGallery}>
                                <div className={styles.imageContainer}>
                                    <img
                                        src={detailImages[currentImageIndex]}
                                        alt={`상세 이미지 ${currentImageIndex + 1} `}
                                        className={styles.detailImage}
                                    />

                                    {detailImages.length > 1 && (
                                        <>
                                            <button
                                                className={`${styles.navButton} ${styles.navButtonPrev} `}
                                                onClick={handlePrevImage}
                                                aria-label="이전 이미지"
                                            >
                                                ‹
                                            </button>
                                            <button
                                                className={`${styles.navButton} ${styles.navButtonNext} `}
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
                        )}
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
