import { readData, writeData } from '../../../utils/storage';
import { requireAuth } from '../../../middleware/adminAuth';

async function handler(req, res) {
    const orders = readData('orders.json');

    if (req.method === 'GET') {
        // 모든 주문 조회 (관리자 전용)
        return res.status(200).json(orders);
    }

    if (req.method === 'POST') {
        // 새 주문 생성 (공개)
        const { customerName, customerPhone, customerEmail, products, address } = req.body;

        if (!customerName || !customerPhone || !products || products.length === 0) {
            return res.status(400).json({ error: '필수 정보를 입력해주세요.' });
        }

        // 총 금액 계산
        const productsData = readData('products.json');
        let totalAmount = 0;

        for (const item of products) {
            const product = productsData.find(p => p.id === item.productId);
            if (product) {
                totalAmount += product.price * item.quantity;
            }
        }

        const newOrder = {
            id: `order-${Date.now()}`,
            customerName,
            customerPhone,
            customerEmail: customerEmail || '',
            address: address || '',
            products,
            totalAmount,
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        orders.push(newOrder);
        writeData('orders.json', orders);

        return res.status(201).json(newOrder);
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

export default async function (req, res) {
    if (req.method === 'POST') {
        // 주문 생성은 공개
        return handler(req, res);
    }
    // GET은 관리자 전용
    return requireAuth(handler)(req, res);
};
