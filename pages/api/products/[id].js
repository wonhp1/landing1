import { readData, writeData } from '../../../utils/storage';
import { requireAuth } from '../../../middleware/adminAuth';

async function handler(req, res) {
    const { id } = req.query;
    const products = readData('products.json');
    const productIndex = products.findIndex(p => p.id === id);

    if (productIndex === -1) {
        return res.status(404).json({ error: '상품을 찾을 수 없습니다.' });
    }

    if (req.method === 'GET') {
        // 특정 상품 조회 (공개)
        return res.status(200).json(products[productIndex]);
    }

    if (req.method === 'PUT') {
        // 상품 수정 (관리자 전용)
        const { name, description, price, imageUrl, available, category } = req.body;

        const updatedProduct = {
            ...products[productIndex],
            ...(name && { name }),
            ...(description !== undefined && { description }),
            ...(price && { price: Number(price) }),
            ...(imageUrl !== undefined && { imageUrl }),
            ...(available !== undefined && { available }),
            ...(category !== undefined && {
                category: category && category.trim() ? category.trim() : '기타'
            }),
            updatedAt: new Date().toISOString()
        };

        products[productIndex] = updatedProduct;
        writeData('products.json', products);

        return res.status(200).json(updatedProduct);
    }

    if (req.method === 'DELETE') {
        // 상품 삭제 (관리자 전용)
        products.splice(productIndex, 1);
        writeData('products.json', products);

        return res.status(200).json({ success: true, message: '상품이 삭제되었습니다.' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

export default async function (req, res) {
    if (req.method === 'GET') {
        return handler(req, res);
    }
    // PUT, DELETE는 인증 필요
    return requireAuth(handler)(req, res);
};
