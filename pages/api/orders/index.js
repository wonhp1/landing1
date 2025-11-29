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
        const { customerName, customerPhone, customerEmail, products, address, request } = req.body;

        if (!customerName || !customerPhone || !products || products.length === 0) {
            return res.status(400).json({ error: '필수 정보를 입력해주세요.' });
        }

        // 총 금액 계산
        const productsData = readData('products.json');
        let totalAmount = 0;

        // products에 name 정보 추가 (Google Sheets용)
        const enrichedProducts = [];

        for (const item of products) {
            const product = productsData.find(p => p.id === item.productId);
            if (product) {
                totalAmount += product.price * item.quantity;
                enrichedProducts.push({
                    ...item,
                    name: product.name,
                    price: product.price
                });
            }
        }

        const timestamp = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

        const newOrder = {
            id: `order-${Date.now()}`,
            customerName,
            customerPhone,
            customerEmail: customerEmail || '',
            address: address || '',
            request: request || '',
            products: enrichedProducts,
            totalAmount,
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        orders.push(newOrder);
        writeData('orders.json', orders);

        // 구글 시트에 주문 추가 (비동기, 실패해도 주문은 저장됨)
        try {
            const { appendOrder } = await import('../../../utils/googleSheets');
            await appendOrder({
                timestamp,
                products: enrichedProducts,
                customerName,
                customerPhone,
                address,
                request: request || '',
                totalAmount
            });
        } catch (error) {
            console.error('구글 시트 저장 실패 (주문은 로컬에 저장됨):', error);
        }

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
