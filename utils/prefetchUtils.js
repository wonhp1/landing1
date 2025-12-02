/**
 * Utility functions for prefetching Notion images and pages
 */

/**
 * Extract Notion page ID from URL or return as-is if already an ID
 * @param {string} urlOrId - Notion URL or page ID
 * @returns {string|null} - Clean page ID (32 characters, no hyphens) or null
 */
export function extractNotionPageId(urlOrId) {
    if (!urlOrId) return null;

    // Remove whitespace
    const cleaned = urlOrId.trim();

    // Check if it's a URL and extract ID
    // Notion URLs: https://notion.so/Page-Name-abc123def456...
    // or https://www.notion.so/workspace/Page-Name-abc123def456...
    const urlMatch = cleaned.match(/([a-f0-9]{32}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);

    if (urlMatch) {
        return urlMatch[1].replace(/-/g, '');
    }

    // If it's already an ID (with or without hyphens), clean it
    if (/^[a-f0-9-]{32,36}$/i.test(cleaned)) {
        return cleaned.replace(/-/g, '');
    }

    return null;
}

/**
 * Prefetch Notion image for a product
 * @param {object} product - Product object
 * @param {function} cacheImage - Function to store image in cache
 * @returns {Promise<string|null>} - Image URL or null
 */
export async function prefetchNotionImage(product, cacheImage) {
    if (!product.detailPageUrl) return null;

    const detailUrl = product.detailPageUrl;

    // Check if it's a legacy image URL (comma separated or direct image link)
    if (detailUrl.includes(',') || /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(detailUrl)) {
        const imageUrl = detailUrl.split(',')[0].trim();
        // Store in cache even for direct image URLs
        const pageId = `direct_${product.id}`;
        cacheImage(pageId, imageUrl);
        return imageUrl;
    }

    // Extract Notion page ID
    const pageId = extractNotionPageId(detailUrl);
    if (!pageId) return null;

    try {
        const res = await fetch(`/api/notion/image/${pageId}`);
        if (res.ok) {
            const data = await res.json();
            if (data.imageUrl) {
                cacheImage(pageId, data.imageUrl);
                return data.imageUrl;
            }
        }
    } catch (error) {
        console.error(`Failed to prefetch image for ${product.name}:`, error);
    }

    return null;
}

/**
 * Prefetch full Notion page data for a product
 * @param {object} product - Product object
 * @param {function} cachePage - Function to store page in cache
 * @returns {Promise<object|null>} - Page data or null
 */
export async function prefetchNotionPage(product, cachePage) {
    if (!product.detailPageUrl) return null;

    const detailUrl = product.detailPageUrl;

    // Skip if it's a direct image URL (not a Notion page)
    if (detailUrl.includes(',') || /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(detailUrl)) {
        return null;
    }

    // Extract Notion page ID
    const pageId = extractNotionPageId(detailUrl);
    if (!pageId) return null;

    try {
        const res = await fetch(`/api/notion/${pageId}`);
        if (res.ok) {
            const data = await res.json();
            cachePage(pageId, data);
            return data;
        }
    } catch (error) {
        console.error(`Failed to prefetch page for ${product.name}:`, error);
    }

    return null;
}

/**
 * Prefetch both image and page data for a single product
 * @param {object} product - Product object
 * @param {object} cache - Cache context with cacheImage and cachePage methods
 * @returns {Promise<void>}
 */
export async function prefetchProduct(product, cache) {
    const { cacheImage, cachePage } = cache;

    // Prefetch both in parallel
    await Promise.all([
        prefetchNotionImage(product, cacheImage),
        prefetchNotionPage(product, cachePage)
    ]);
}

/**
 * Prefetch multiple products with priority and throttling
 * Uses requestIdleCallback to ensure main thread is not blocked
 * @param {Array} products - Array of product objects
 * @param {object} cache - Cache context
 * @param {object} options - Prefetch options
 * @param {number} options.batchSize - Number of concurrent requests (default: 2)
 * @param {number} options.delayBetweenBatches - Delay in ms between batches (default: 200)
 * @param {function} options.onProgress - Callback for progress updates
 * @returns {Promise<void>}
 */
export async function prefetchProducts(products, cache, options = {}) {
    const {
        batchSize = 2, // Reduced default batch size for better responsiveness
        delayBetweenBatches = 200,
        onProgress = null
    } = options;

    console.log(`🚀 Queueing prefetch for ${products.length} products (waiting for idle)...`);

    let completed = 0;
    let currentIndex = 0;

    // Helper to process a single batch
    const processBatch = async () => {
        if (currentIndex >= products.length) {
            console.log(`🎉 Prefetch complete! Cached ${completed}/${products.length} products`);
            return;
        }

        const batch = products.slice(currentIndex, currentIndex + batchSize);
        currentIndex += batchSize;

        // Prefetch batch in parallel
        await Promise.all(
            batch.map(async (product) => {
                try {
                    await prefetchProduct(product, cache);
                    completed++;
                    // Log less frequently to reduce console noise
                    if (completed % 5 === 0 || completed === products.length) {
                        console.log(`✅ Prefetched: ${completed}/${products.length}`);
                    }

                    if (onProgress) {
                        onProgress(completed, products.length);
                    }
                } catch (error) {
                    // Silent fail to not disturb user
                    completed++;
                }
            })
        );

        // Schedule next batch when browser is idle again
        if (currentIndex < products.length) {
            if (typeof window !== 'undefined' && window.requestIdleCallback) {
                window.requestIdleCallback(() => {
                    setTimeout(processBatch, delayBetweenBatches);
                }, { timeout: 2000 });
            } else {
                // Fallback for browsers without requestIdleCallback
                setTimeout(processBatch, delayBetweenBatches + 300);
            }
        } else {
            console.log(`🎉 Prefetch complete! Cached ${completed}/${products.length} products`);
        }
    };

    // Start processing when browser is idle
    if (typeof window !== 'undefined' && window.requestIdleCallback) {
        window.requestIdleCallback(processBatch, { timeout: 2000 });
    } else {
        setTimeout(processBatch, 1000);
    }
}

/**
 * Prefetch with priority: visible products first, then the rest
 * Optimized to be non-blocking and respect main thread
 * @param {Array} allProducts - All products
 * @param {number} visibleCount - Number of visible products to prioritize
 * @param {object} cache - Cache context
 * @returns {Promise<void>}
 */
export async function prefetchWithPriority(allProducts, visibleCount, cache) {
    const visibleProducts = allProducts.slice(0, visibleCount);
    const hiddenProducts = allProducts.slice(visibleCount);

    console.log(`📊 Priority prefetch: ${visibleProducts.length} visible, ${hiddenProducts.length} hidden`);

    // Step 1: Prefetch visible products (higher priority but still idle-friendly)
    await prefetchProducts(visibleProducts, cache, {
        batchSize: 3,
        delayBetweenBatches: 100
    });

    // Step 2: Prefetch hidden products with lower priority
    if (hiddenProducts.length > 0) {
        // Longer delay before starting hidden products to ensure UI is fully interactive
        if (typeof window !== 'undefined' && window.requestIdleCallback) {
            window.requestIdleCallback(() => {
                prefetchProducts(hiddenProducts, cache, {
                    batchSize: 2, // Very gentle batch size
                    delayBetweenBatches: 500 // Long delay between batches
                });
            }, { timeout: 5000 });
        } else {
            setTimeout(() => {
                prefetchProducts(hiddenProducts, cache, {
                    batchSize: 2,
                    delayBetweenBatches: 500
                });
            }, 2000);
        }
    }
}

