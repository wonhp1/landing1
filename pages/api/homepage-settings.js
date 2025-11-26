import { readData, writeData } from '../../utils/storage';
import { requireAuth } from '../../middleware/adminAuth';

async function handler(req, res) {
    if (req.method === 'GET') {
        // 메인 페이지 설정 조회 (공개)
        const settings = readData('homepage-settings.json');
        return res.status(200).json(settings);
    }

    if (req.method === 'PUT') {
        // 메인 페이지 설정 업데이트 (관리자 전용)
        const { displayProducts, selectedProducts } = req.body;

        const settings = {
            displayProducts: displayProducts !== undefined ? displayProducts : true,
            selectedProducts: selectedProducts || []
        };

        writeData('homepage-settings.json', settings);
        return res.status(200).json(settings);
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

export default async function (req, res) {
    if (req.method === 'GET') {
        return handler(req, res);
    }
    // PUT은 관리자 전용
    return requireAuth(handler)(req, res);
};
