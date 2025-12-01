import { getNotionPage } from '../../../utils/notion';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { pageId } = req.query;

    if (!pageId) {
        return res.status(400).json({ error: 'Page ID is required' });
    }

    // Check if Notion API key is configured
    if (!process.env.NOTION_API_KEY) {
        return res.status(500).json({
            error: 'Notion API not configured',
            message: 'NOTION_API_KEY environment variable is not set'
        });
    }

    try {
        const notionData = await getNotionPage(pageId);

        // Return the data
        res.status(200).json(notionData);
    } catch (error) {
        console.error('Notion API error:', error);

        // Return appropriate error based on error type
        if (error.message.includes('Invalid')) {
            res.status(400).json({
                error: 'Invalid page ID',
                message: error.message
            });
        } else if (error.code === 'object_not_found') {
            res.status(404).json({
                error: 'Page not found',
                message: 'The Notion page does not exist or is not shared with the integration'
            });
        } else if (error.code === 'unauthorized') {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid Notion API key or page not shared with integration'
            });
        } else {
            res.status(500).json({
                error: 'Failed to fetch Notion page',
                message: error.message
            });
        }
    }
}
