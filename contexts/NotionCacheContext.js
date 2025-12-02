import { createContext, useContext, useState } from 'react';

/**
 * Global cache context for Notion images and pages
 * This cache persists across page navigation within the same session
 */
const NotionCacheContext = createContext();

export function NotionCacheProvider({ children }) {
    // Cache for Notion image URLs (pageId -> imageUrl)
    const [imageCache, setImageCache] = useState({});

    // Cache for full Notion page data (pageId -> pageData)
    const [pageCache, setPageCache] = useState({});

    /**
     * Store image URL in cache
     * @param {string} pageId - Notion page ID
     * @param {string} url - Image URL
     */
    const cacheImage = (pageId, url) => {
        setImageCache(prev => ({ ...prev, [pageId]: url }));
    };

    /**
     * Store page data in cache
     * @param {string} pageId - Notion page ID
     * @param {object} data - Complete page data
     */
    const cachePage = (pageId, data) => {
        setPageCache(prev => ({ ...prev, [pageId]: data }));
    };

    /**
     * Get cached image URL
     * @param {string} pageId - Notion page ID
     * @returns {string|null} - Cached URL or null
     */
    const getImage = (pageId) => imageCache[pageId] || null;

    /**
     * Get cached page data
     * @param {string} pageId - Notion page ID
     * @returns {object|null} - Cached page data or null
     */
    const getPage = (pageId) => pageCache[pageId] || null;

    /**
     * Check if image is cached
     * @param {string} pageId - Notion page ID
     * @returns {boolean}
     */
    const hasImage = (pageId) => pageId in imageCache;

    /**
     * Check if page is cached
     * @param {string} pageId - Notion page ID
     * @returns {boolean}
     */
    const hasPage = (pageId) => pageId in pageCache;

    /**
     * Clear all caches (useful for debugging)
     */
    const clearCache = () => {
        setImageCache({});
        setPageCache({});
    };

    const value = {
        // Cache state
        imageCache,
        pageCache,

        // Cache methods
        cacheImage,
        cachePage,
        getImage,
        getPage,
        hasImage,
        hasPage,
        clearCache,

        // Stats
        imageCacheSize: Object.keys(imageCache).length,
        pageCacheSize: Object.keys(pageCache).length,
    };

    return (
        <NotionCacheContext.Provider value={value}>
            {children}
        </NotionCacheContext.Provider>
    );
}

/**
 * Hook to access Notion cache
 * @returns {object} Cache context
 */
export function useNotionCache() {
    const context = useContext(NotionCacheContext);
    if (!context) {
        throw new Error('useNotionCache must be used within NotionCacheProvider');
    }
    return context;
}
