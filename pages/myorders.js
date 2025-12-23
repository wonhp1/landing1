import { useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';

export default function MyOrdersPage() {
    const [phone, setPhone] = useState('');
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [hasSearched, setHasSearched] = useState(false);

    // 전화번호 자동 포맷팅
    const formatPhoneNumber = (value) => {
        const numbers = value.replace(/[^0-9]/g, '');
        if (numbers.length <= 3) return numbers;
        if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    };

    const handlePhoneChange = (e) => {
        setPhone(formatPhoneNumber(e.target.value));
    };

    const handleSearch = async (e) => {
        e.preventDefault();

        if (!phone || phone.replace(/[^0-9]/g, '').length < 10) {
            setMessage('올바른 전화번호를 입력해주세요.');
            return;
        }

        setIsLoading(true);
        setMessage('');

        try {
            const response = await fetch(`/api/orders/search?phone=${encodeURIComponent(phone)}`);
            const data = await response.json();

            if (response.ok) {
                setOrders(data);
                setHasSearched(true);
                if (data.length === 0) {
                    setMessage('해당 전화번호로 등록된 주문이 없습니다.');
                }
            } else {
                setMessage(data.message || '주문 조회에 실패했습니다.');
            }
        } catch (error) {
            console.error('주문 조회 실패:', error);
            setMessage('주문 조회 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelOrder = async (orderId) => {
        const reason = prompt('취소 사유를 입력해주세요:');
        if (!reason) return;

        if (!confirm('정말로 주문을 취소하시겠습니까?\n취소된 주문은 복구할 수 없습니다.')) return;

        try {
            const response = await fetch('/api/cancel-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: orderId,
                    cancelReason: reason,
                }),
            });

            const result = await response.json();

            if (response.ok) {
                alert('주문이 취소되었습니다.');
                // 주문 목록 새로고침
                handleSearch({ preventDefault: () => {} });
            } else {
                alert(`취소 실패: ${result.message}`);
            }
        } catch (error) {
            console.error('주문 취소 실패:', error);
            alert('주문 취소 중 오류가 발생했습니다.');
        }
    };

    const getStatusText = (status) => {
        const statusMap = {
            'pending': '대기중',
            'confirmed': '확인됨',
            'completed': '완료',
            'cancelled': '취소됨'
        };
        return statusMap[status] || status;
    };

    const getStatusColor = (status) => {
        const colorMap = {
            'pending': '#F4D03F',
            'confirmed': '#007AFF',
            'completed': '#34C759',
            'cancelled': '#FF3B30'
        };
        return colorMap[status] || '#666';
    };

    return (
        <>
            <Head>
                <title>내 주문 조회</title>
            </Head>
            <div className="container">
                <h1>내 주문 조회</h1>

                <div style={{ marginTop: '20px', marginBottom: '20px' }}>
                    <Link href="/order">
                        <button className="button" style={{ backgroundColor: '#666', borderColor: '#666' }}>
                            주문하기 페이지로
                        </button>
                    </Link>
                </div>

                <form onSubmit={handleSearch} className="card" style={{ marginTop: '20px' }}>
                    <h2>전화번호로 주문 조회</h2>
                    <p style={{ color: '#666', marginBottom: '20px' }}>
                        주문 시 입력한 전화번호로 주문 내역을 조회할 수 있습니다.
                    </p>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <input
                            type="tel"
                            placeholder="전화번호 (010-0000-0000)"
                            className="input"
                            value={phone}
                            onChange={handlePhoneChange}
                            maxLength="13"
                            required
                            style={{ flex: 1, minWidth: '200px' }}
                        />
                        <button type="submit" className="button" disabled={isLoading}>
                            {isLoading ? '조회 중...' : '주문 조회'}
                        </button>
                    </div>
                    {message && (
                        <p style={{ marginTop: '15px', color: orders.length === 0 ? '#ff4d4f' : '#666' }}>
                            {message}
                        </p>
                    )}
                </form>

                {hasSearched && orders.length > 0 && (
                    <div style={{ marginTop: '40px' }}>
                        <h2>주문 내역 ({orders.length}건)</h2>
                        {orders.map(order => (
                            <div key={order.id} className="card" style={{ marginTop: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                                    <div>
                                        <strong>주문 번호:</strong> {order.id}
                                    </div>
                                    <div style={{
                                        padding: '6px 14px',
                                        borderRadius: '20px',
                                        backgroundColor: getStatusColor(order.status) + '20',
                                        color: getStatusColor(order.status),
                                        fontWeight: 'bold',
                                        fontSize: '14px'
                                    }}>
                                        {getStatusText(order.status)}
                                    </div>
                                </div>

                                <div style={{ marginBottom: '16px', color: '#666', fontSize: '14px' }}>
                                    <div>주문일시: {order.createdAt}</div>
                                    {order.address && <div style={{ marginTop: '4px' }}>배송지: {order.address}</div>}
                                    {order.request && <div style={{ marginTop: '4px' }}>요청사항: {order.request}</div>}
                                </div>

                                <div style={{ marginBottom: '16px' }}>
                                    <strong>주문 상품:</strong>
                                    <div style={{ marginTop: '8px', backgroundColor: '#f9f9f9', borderRadius: '8px', padding: '12px' }}>
                                        {/* products가 문자열인 경우 (Google Sheets) */}
                                        {typeof order.products === 'string' ? (
                                            <div style={{ padding: '4px 0' }}>{order.products}</div>
                                        ) : (
                                            /* products가 배열인 경우 */
                                            order.products?.map((item, idx) => (
                                                <div key={idx} style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    padding: '4px 0',
                                                    borderBottom: idx < order.products.length - 1 ? '1px solid #eee' : 'none'
                                                }}>
                                                    <span>{item.name || item.productId} x {item.quantity}개</span>
                                                    {item.price && (
                                                        <span style={{ color: '#666' }}>
                                                            {(item.price * item.quantity).toLocaleString()}원
                                                        </span>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginTop: '16px',
                                    paddingTop: '16px',
                                    borderTop: '1px solid #eee',
                                    flexWrap: 'wrap',
                                    gap: '10px'
                                }}>
                                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                                        총 금액: {order.totalAmount.toLocaleString()}원
                                    </div>

                                    {/* 고객 취소 버튼: pending 상태이고 paymentKey가 있는 경우만 */}
                                    {order.status === 'pending' && order.hasPaymentKey && (
                                        <button
                                            onClick={() => handleCancelOrder(order.id)}
                                            style={{
                                                padding: '10px 20px',
                                                backgroundColor: '#ff4d4f',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontWeight: 'bold',
                                                transition: 'background-color 0.2s'
                                            }}
                                            onMouseOver={(e) => e.target.style.backgroundColor = '#ff2222'}
                                            onMouseOut={(e) => e.target.style.backgroundColor = '#ff4d4f'}
                                        >
                                            주문 취소
                                        </button>
                                    )}
                                </div>

                                {order.status === 'cancelled' && order.cancelReason && (
                                    <div style={{
                                        marginTop: '16px',
                                        padding: '12px',
                                        backgroundColor: '#fff5f5',
                                        borderRadius: '8px',
                                        color: '#ff4d4f',
                                        fontSize: '14px'
                                    }}>
                                        <strong>취소 사유:</strong> {order.cancelReason}
                                        {order.cancelledAt && (
                                            <span style={{ marginLeft: '10px', color: '#999' }}>
                                                ({new Date(order.cancelledAt).toLocaleString('ko-KR')})
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
