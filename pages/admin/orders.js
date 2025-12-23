import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function AdminOrders() {
    const router = useRouter();
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);

    useEffect(() => {
        checkAuth();
        fetchOrders();
        fetchProducts();
    }, []);

    const checkAuth = async () => {
        try {
            const response = await fetch('/api/auth/check-auth');
            if (!response.ok) {
                router.push('/');
            }
        } catch (error) {
            router.push('/');
        }
    };

    const fetchOrders = async () => {
        try {
            const response = await fetch('/api/orders');
            const data = await response.json();
            setOrders(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        } catch (error) {
            console.error('주문 로딩 실패:', error);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await fetch('/api/products');
            const data = await response.json();
            setProducts(data);
        } catch (error) {
            console.error('상품 로딩 실패:', error);
        }
    };

    const getProductName = (productId) => {
        const product = products.find(p => p.id === productId);
        return product ? product.name : productId;
    };

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            const response = await fetch(`/api/orders/${orderId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (response.ok) {
                fetchOrders();
            }
        } catch (error) {
            console.error('상태 변경 실패:', error);
        }
    };

    const getStatusText = (status) => {
        const statusMap = {
            'pending': '대기중',
            'confirmed': '확인됨',
            'completed': '완료',
            'cancelled': '취소'
        };
        return statusMap[status] || status;
    };

    return (
        <div className="container">
            <h1>주문 관리</h1>

            <div style={{ marginTop: '20px' }}>
                <Link href="/admin">
                    <button className="button" style={{ backgroundColor: '#666', borderColor: '#666' }}>
                        관리자 페이지로
                    </button>
                </Link>
            </div>

            <div style={{ marginTop: '40px' }}>
                {orders.length === 0 ? (
                    <p>주문 내역이 없습니다.</p>
                ) : (
                    orders.map(order => (
                        <div key={order.id} className="card" style={{ marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <div>
                                    <strong>주문 번호:</strong> {order.id}
                                </div>
                                <div>
                                    <strong>주문 시간:</strong> {order.createdAt}
                                </div>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <strong>고객 정보:</strong>
                                <div style={{ marginTop: '8px', color: '#666' }}>
                                    <div>이름: {order.customerName}</div>
                                    <div>전화번호: {order.customerPhone}</div>
                                    {order.customerEmail && <div>이메일: {order.customerEmail}</div>}
                                    {order.address && <div>주소: {order.address}</div>}
                                </div>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <strong>주문 상품:</strong>
                                {typeof order.products === 'string' ? (
                                    <div style={{ marginTop: '8px', color: '#666' }}>{order.products}</div>
                                ) : (
                                    order.products?.map((item, idx) => (
                                        <div key={idx} style={{ marginTop: '8px', color: '#666' }}>
                                            {item.name || getProductName(item.productId)} x {item.quantity}
                                        </div>
                                    ))
                                )}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #eee' }}>
                                <div>
                                    <strong>총 금액:</strong> {order.totalAmount.toLocaleString()}원
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span>상태:</span>
                                    <select
                                        value={order.status}
                                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
                                    >
                                        <option value="pending">대기중</option>
                                        <option value="confirmed">확인됨</option>
                                        <option value="completed">완료</option>
                                        <option value="cancelled">취소</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
