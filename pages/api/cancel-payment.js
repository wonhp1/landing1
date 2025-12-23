import { getOrderById, updateOrderStatus } from '../../utils/googleSheets';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { orderId, cancelReason } = req.body;

    if (!orderId || !cancelReason) {
        return res.status(400).json({
            message: 'orderId와 cancelReason은 필수입니다.'
        });
    }

    try {
        // Google Sheets에서 주문 조회
        const order = await getOrderById(orderId);

        if (!order) {
            return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
        }

        // 이미 취소된 주문 확인
        if (order.status === 'cancelled') {
            return res.status(400).json({ message: '이미 취소된 주문입니다.' });
        }

        // 고객 취소: pending 상태만 가능
        if (order.status !== 'pending') {
            return res.status(400).json({
                message: '대기 중인 주문만 취소할 수 있습니다.'
            });
        }

        // paymentKey가 없으면 결제 취소 불가
        if (!order.paymentKey) {
            return res.status(400).json({
                message: '결제 정보가 없어 취소할 수 없습니다. 고객센터에 문의해주세요.'
            });
        }

        const secretKey = process.env.TOSS_SECRET_KEY;

        if (!secretKey) {
            return res.status(500).json({
                message: '결제 시스템 설정 오류입니다. 관리자에게 문의해주세요.'
            });
        }

        // 토스페이먼츠 취소 API 호출
        const response = await fetch(
            `https://api.tosspayments.com/v1/payments/${order.paymentKey}/cancel`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${Buffer.from(secretKey + ':').toString('base64')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cancelReason: cancelReason,
                }),
            }
        );

        const result = await response.json();

        if (!response.ok) {
            console.error('Payment cancellation failed:', result);
            return res.status(response.status).json({
                message: result.message || '결제 취소 실패',
                code: result.code
            });
        }

        // Google Sheets에서 주문 상태 업데이트
        const updated = await updateOrderStatus(orderId, 'cancelled', cancelReason);

        if (!updated) {
            console.error('주문 상태 업데이트 실패');
            // 결제는 취소되었지만 상태 업데이트 실패
            return res.status(200).json({
                message: '결제는 취소되었으나 주문 상태 업데이트에 실패했습니다. 관리자에게 문의해주세요.',
                paymentCancelled: true
            });
        }

        return res.status(200).json({
            message: '주문이 취소되었습니다.',
            orderId: orderId
        });

    } catch (error) {
        console.error('Payment cancellation error:', error);
        return res.status(500).json({
            message: '결제 취소 중 오류가 발생했습니다.',
            error: error.message
        });
    }
}
