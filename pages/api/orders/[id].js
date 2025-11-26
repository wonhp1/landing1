import { readData, writeData } from '../../../utils/storage';
import { requireAuth } from '../../../middleware/adminAuth';

async function handler(req, res) {
    const { id } = req.query;
    const orders = readData('orders.json');
    const orderIndex = orders.findIndex(o => o.id === id);

    if (orderIndex === -1) {
        return res.status(404).json({ error: '주문을 찾을 수 없습니다.' });
    }

    if (req.method === 'GET') {
        // 특정 주문 조회
        return res.status(200).json(orders[orderIndex]);
    }

    if (req.method === 'PUT') {
        // 주문 상태 업데이트 (관리자 전용)
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ error: '상태를 입력해주세요.' });
        }

        const updatedOrder = {
            ...orders[orderIndex],
            status,
            updatedAt: new Date().toISOString()
        };

        orders[orderIndex] = updatedOrder;
        writeData('orders.json', orders);

        return res.status(200).json(updatedOrder);
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

export default requireAuth(handler);
