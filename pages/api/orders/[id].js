import { requireAuth } from '../../../middleware/adminAuth';
import { getOrderById, updateOrderStatus } from '../../../utils/googleSheets';

async function handler(req, res) {
    const { id } = req.query;

    try {
        // Google Sheets에서 주문 조회
        const order = await getOrderById(id);

        if (!order) {
            return res.status(404).json({ error: '주문을 찾을 수 없습니다.' });
        }

        if (req.method === 'GET') {
            // 특정 주문 조회
            return res.status(200).json(order);
        }

        if (req.method === 'PUT') {
            // 주문 상태 업데이트 (관리자 전용)
            const { status } = req.body;

            if (!status) {
                return res.status(400).json({ error: '상태를 입력해주세요.' });
            }

            // Google Sheets에서 상태 업데이트
            const updated = await updateOrderStatus(id, status);

            if (!updated) {
                return res.status(500).json({ error: '상태 업데이트에 실패했습니다.' });
            }

            return res.status(200).json({
                ...order,
                status,
                updatedAt: new Date().toISOString()
            });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('주문 처리 중 오류:', error);
        return res.status(500).json({ error: '주문 처리 중 오류가 발생했습니다.' });
    }
}

export default requireAuth(handler);
