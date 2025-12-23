import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function SuccessPage() {
    const router = useRouter();
    const { paymentKey, orderId, amount } = router.query;
    const [isProcessing, setIsProcessing] = useState(true);
    const [message, setMessage] = useState('결제 확인 중...');

    useEffect(() => {
        if (!router.isReady) return;

        const processOrder = async () => {
            const tempOrderStr = localStorage.getItem('tempOrder');
            if (!tempOrderStr) {
                setMessage('주문 정보를 찾을 수 없습니다.');
                setIsProcessing(false);
                return;
            }

            const tempOrder = JSON.parse(tempOrderStr);

            // Verify orderId matches
            if (tempOrder.orderId !== orderId) {
                setMessage('주문 정보가 일치하지 않습니다.');
                setIsProcessing(false);
                return;
            }

            try {
                // STEP 1: Confirm payment with Toss Payments
                const confirmResponse = await fetch('/api/confirm-payment', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        paymentKey: paymentKey,
                        orderId: orderId,
                        amount: Number(amount),
                    }),
                });

                if (!confirmResponse.ok) {
                    const error = await confirmResponse.json();
                    console.error('Payment confirmation failed:', error);
                    setMessage(`결제 승인 실패: ${error.message || '알 수 없는 오류'}`);
                    setIsProcessing(false);
                    return;
                }

                const confirmResult = await confirmResponse.json();
                console.log('Payment confirmed:', confirmResult);

                // STEP 2: Save order to backend
                const response = await fetch('/api/orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        customerName: tempOrder.customerInfo.name,
                        customerPhone: tempOrder.customerInfo.phone,
                        customerEmail: tempOrder.customerInfo.email || '',
                        address: `${tempOrder.customerInfo.postcode ? `(${tempOrder.customerInfo.postcode}) ` : ''}${tempOrder.customerInfo.mainAddress || ''} ${tempOrder.customerInfo.detailAddress || ''}`.trim(),
                        request: tempOrder.customerInfo.request || '',
                        products: tempOrder.products.map(p => ({ productId: p.productId, quantity: p.quantity })),
                        paymentKey: paymentKey,
                        orderId: orderId,
                    }),
                });

                if (response.ok) {
                    setMessage('주문이 성공적으로 완료되었습니다!');
                    localStorage.removeItem('tempOrder');
                } else {
                    setMessage('주문 저장 중 오류가 발생했습니다.');
                }
            } catch (error) {
                console.error('Order save failed:', error);
                setMessage('주문 저장 중 오류가 발생했습니다.');
            } finally {
                setIsProcessing(false);
            }
        };

        processOrder();
    }, [router.isReady, paymentKey, orderId, amount]);

    return (
        <div className="container" style={{ textAlign: 'center', paddingTop: '100px' }}>
            <div className="card" style={{ maxWidth: '600px', margin: '0 auto', padding: '40px' }}>
                <h1 style={{ color: '#007AFF', marginBottom: '20px' }}>
                    {isProcessing ? '처리 중...' : (message.includes('성공') ? '결제 성공!' : '오류 발생')}
                </h1>
                <p style={{ fontSize: '18px', marginBottom: '40px', lineHeight: '1.6' }}>
                    {message}
                </p>

                {!isProcessing && (
                    <Link href="/order">
                        <button className="button" style={{ padding: '15px 40px', fontSize: '18px' }}>
                            주문 페이지로 돌아가기
                        </button>
                    </Link>
                )}
            </div>
        </div>
    );
}
