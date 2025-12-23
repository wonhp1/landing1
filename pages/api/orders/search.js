import { getOrdersByPhone } from '../../../utils/googleSheets';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { phone } = req.query;

    if (!phone) {
        return res.status(400).json({ message: '전화번호를 입력해주세요.' });
    }

    // 전화번호 정규화 (하이픈 제거)
    const normalizedPhone = phone.replace(/[^0-9]/g, '');

    if (normalizedPhone.length < 10) {
        return res.status(400).json({ message: '올바른 전화번호를 입력해주세요.' });
    }

    try {
        // Google Sheets에서 주문 조회
        const orders = await getOrdersByPhone(phone);
        return res.status(200).json(orders);
    } catch (error) {
        console.error('주문 조회 실패:', error);
        return res.status(500).json({ message: '주문 조회에 실패했습니다.' });
    }
}
