// Toss Payments V2 결제 승인 API
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { paymentKey, orderId, amount } = req.body;

    if (!paymentKey || !orderId || !amount) {
        return res.status(400).json({
            message: 'Missing required parameters: paymentKey, orderId, amount'
        });
    }

    const secretKey = process.env.TOSS_SECRET_KEY || 'test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6';

    try {
        // Call Toss Payments confirm API
        const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${Buffer.from(secretKey + ':').toString('base64')}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                paymentKey,
                orderId,
                amount: Number(amount),
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('Payment confirmation failed:', result);
            return res.status(response.status).json(result);
        }

        // Payment confirmed successfully
        return res.status(200).json(result);
    } catch (error) {
        console.error('Payment confirmation error:', error);
        return res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
}
