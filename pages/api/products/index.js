import { readData, writeData } from '../../../utils/storage';
import { requireAuth } from '../../../middleware/adminAuth';

async function handler(req, res) {
    const products = readData('products.json');

    if (req.method === 'GET') {
        // 모든 상품 조회 (공개)
        return res.status(200).json(products);
    }

    if (req.method === 'POST') {
        // 새 상품 생성 (관리자 전용)
        const { name, description, price, imageUrl, available = true, category } = req.body;

        if (!name || !price) {
            return res.status(400).json({ error: '상품명과 가격은 필수입니다.' });
        }

        const newProduct = {
            id: `product-${Date.now()}`,
            name,
            description: description || '',
            price: Number(price),
            imageUrl: imageUrl || '',
            available,
            category: category && category.trim() ? category.trim() : '기타',
            createdAt: new Date().toISOString()
        };

        products.push(newProduct);
        writeData('products.json', products);

        return res.status(201).json(newProduct);
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

export default async function (req, res) {
    if (req.method === 'GET') {
        return handler(req, res);
    }
    // POST는 인증 필요
    return requireAuth(handler)(req, res);
};
