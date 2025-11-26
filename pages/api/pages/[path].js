import { readData, writeData } from '../../../utils/storage';
import { requireAuth } from '../../../middleware/adminAuth';

async function handler(req, res) {
    const { path } = req.query;
    const pages = readData('pages.json');

    if (!pages[path]) {
        return res.status(404).json({ error: '페이지를 찾을 수 없습니다.' });
    }

    if (req.method === 'GET') {
        // 페이지 조회 (공개)
        return res.status(200).json(pages[path]);
    }

    if (req.method === 'PUT') {
        // 페이지 수정 (관리자 전용)
        const { title, sections } = req.body;

        pages[path] = {
            ...pages[path],
            ...(title && { title }),
            ...(sections && { sections }),
            updatedAt: new Date().toISOString()
        };

        writeData('pages.json', pages);

        return res.status(200).json(pages[path]);
    }

    if (req.method === 'DELETE') {
        // 페이지 삭제 (관리자 전용)
        delete pages[path];
        writeData('pages.json', pages);

        return res.status(200).json({ success: true, message: '페이지가 삭제되었습니다.' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

export default async function (req, res) {
    if (req.method === 'GET') {
        return handler(req, res);
    }
    // PUT, DELETE는 관리자 전용
    return requireAuth(handler)(req, res);
};
