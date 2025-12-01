import { getNotionFirstImage } from '../../../../utils/notion';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { pageId } = req.query;

    if (!pageId) {
        return res.status(400).json({ error: 'Page ID is required' });
    }

    if (!process.env.NOTION_API_KEY) {
        return res.status(500).json({
            error: 'Notion API not configured',
            message: 'NOTION_API_KEY environment variable is not set'
        });
    }

    try {
        const imageUrl = await getNotionFirstImage(pageId);

        if (!imageUrl) {
            return res.status(404).json({ error: 'No image found in Notion page' });
        }

        res.status(200).json({ imageUrl });
    } catch (error) {
        console.error('Notion API error:', error);
        res.status(500).json({
            error: 'Failed to fetch Notion image',
            message: error.message
        });
    }
}
