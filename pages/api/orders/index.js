import { readData } from '../../../utils/storage';
import { requireAuth } from '../../../middleware/adminAuth';
import { appendOrder, getAllOrders } from '../../../utils/googleSheets';

async function handler(req, res) {
    if (req.method === 'GET') {
        // 모든 주문 조회 (관리자 전용) - Google Sheets에서 조회
        try {
            const orders = await getAllOrders();
            return res.status(200).json(orders);
        } catch (error) {
            console.error('주문 조회 실패:', error);
            return res.status(500).json({ error: '주문 조회에 실패했습니다.' });
        }
    }

    if (req.method === 'POST') {
        // 새 주문 생성 (공개)
        const { customerName, customerPhone, customerEmail, products, address, request, paymentKey, orderId: tossOrderId } = req.body;

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
        const orderId = tossOrderId || `order-${Date.now()}`;

        // Google Sheets에 주문 저장 (메인 DB)
        try {
            await appendOrder({
                timestamp,
                products: enrichedProducts,
                customerName,
                customerPhone,
                address,
                request: request || '',
                totalAmount,
                orderId,
                status: 'pending',
                paymentKey: paymentKey || ''
            });

            return res.status(201).json({
                id: orderId,
                customerName,
                customerPhone,
                address,
                products: enrichedProducts,
                totalAmount,
                status: 'pending',
                createdAt: timestamp
            });
        } catch (error) {
            console.error('주문 저장 실패:', error);
            return res.status(500).json({ error: '주문 저장에 실패했습니다.' });
        }
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
