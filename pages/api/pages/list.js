import { readData, writeData } from '../../../utils/storage';
import { requireAuth } from '../../../middleware/adminAuth';

async function handler(req, res) {
    const pages = readData('pages.json');

    if (req.method === 'GET') {
        // 페이지 목록 조회
        const pageList = Object.keys(pages).map(path => ({
            path,
            title: pages[path].title || path
        }));
        return res.status(200).json(pageList);
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

export default requireAuth(handler);
