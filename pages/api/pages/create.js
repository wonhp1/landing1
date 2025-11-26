import { readData, writeData } from '../../../utils/storage';
import { requireAuth } from '../../../middleware/adminAuth';

async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { path, title, sections = [] } = req.body;

    if (!path || !title) {
        return res.status(400).json({ error: '페이지 경로와 제목은 필수입니다.' });
    }

    const pages = readData('pages.json');

    if (pages[path]) {
        return res.status(409).json({ error: '이미 존재하는 페이지 경로입니다.' });
    }

    pages[path] = {
        title,
        sections,
        createdAt: new Date().toISOString()
    };

    writeData('pages.json', pages);

    res.status(201).json(pages[path]);
}

export default requireAuth(handler);
