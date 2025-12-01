import { Client } from '@notionhq/client';

const notion = new Client({
    auth: process.env.NOTION_API_KEY,
});

/**
 * Extract page ID from Notion URL or return as-is if already an ID
 * @param {string} notionUrlOrId - Notion page URL or page ID
 * @returns {string} - Clean page ID (32 characters, no hyphens)
 */
export function extractNotionPageId(notionUrlOrId) {
    if (!notionUrlOrId) return '';

    // If it's a URL, extract the ID from the URL
    // Notion URLs: https://notion.so/Page-Name-abc123def456...
    // or https://www.notion.so/workspace/Page-Name-abc123def456...
    const urlMatch = notionUrlOrId.match(/([a-f0-9]{32}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
    if (urlMatch) {
        return urlMatch[1].replace(/-/g, '');
    }

    // If it's already an ID (with or without hyphens), clean it
    return notionUrlOrId.replace(/-/g, '');
}

/**
 * Fetch Notion page content (blocks)
 * @param {string} pageId - Notion page URL or ID
 * @returns {Promise<object>} - Page metadata and blocks
 */
export async function getNotionPage(pageId) {
    try {
        const cleanPageId = extractNotionPageId(pageId);

        if (!cleanPageId || cleanPageId.length !== 32) {
            throw new Error('Invalid Notion page ID');
        }

        // Fetch page metadata
        const page = await notion.pages.retrieve({ page_id: cleanPageId });

        // Fetch page blocks (content)
        const blocks = await notion.blocks.children.list({
            block_id: cleanPageId,
            page_size: 100, // Maximum allowed by Notion API
        });

        return {
            page,
            blocks: blocks.results,
        };
    } catch (error) {
        console.error('Error fetching Notion page:', error);
        throw new Error(error.message || 'Failed to fetch Notion page');
    }
}

/**
 * Extract first image URL from Notion page
 * @param {string} pageId - Notion page URL or ID
 * @returns {Promise<string|null>} - First image URL or null if not found
 */
export async function getNotionFirstImage(pageId) {
    try {
        const { blocks } = await getNotionPage(pageId);

        // Find first image block
        const imageBlock = blocks.find(block => block.type === 'image');

        if (!imageBlock) return null;

        const imageData = imageBlock.image;
        return imageData?.file?.url || imageData?.external?.url || null;
    } catch (error) {
        console.error('Error extracting first image:', error);
        return null;
    }
}
