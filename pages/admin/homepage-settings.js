import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function AdminHomepageSettings() {
    const router = useRouter();
    const [products, setProducts] = useState([]);
    const [settings, setSettings] = useState({
        displayProducts: true,
        selectedProducts: []
    });
    const [message, setMessage] = useState('');

    useEffect(() => {
        checkAuth();
        fetchData();
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

    const fetchData = async () => {
        try {
            const [productsRes, settingsRes] = await Promise.all([
                fetch('/api/products'),
                fetch('/api/homepage-settings')
            ]);

            const productsData = await productsRes.json();
            const settingsData = await settingsRes.json();

            setProducts(productsData);
            setSettings(settingsData);
        } catch (error) {
            console.error('데이터 로딩 실패:', error);
        }
    };

    const handleToggleProduct = (productId) => {
        setSettings(prev => ({
            ...prev,
            selectedProducts: prev.selectedProducts.includes(productId)
                ? prev.selectedProducts.filter(id => id !== productId)
                : [...prev.selectedProducts, productId]
        }));
    };

    const handleSave = async () => {
        try {
            const response = await fetch('/api/homepage-settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(settings),
            });

            if (response.ok) {
                setMessage('설정이 저장되었습니다.');
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage('저장 실패');
            }
        } catch (error) {
            console.error('저장 실패:', error);
            setMessage('저장 중 오류 발생');
        }
    };

    return (
        <div className="container">
            <h1>메인 페이지 설정</h1>

            <div style={{ marginTop: '20px' }}>
                <Link href="/admin">
                    <button className="button" style={{ backgroundColor: '#666', borderColor: '#666' }}>
                        관리자 페이지로
                    </button>
                </Link>
            </div>

            <div className="card" style={{ marginTop: '40px' }}>
                <h2>상품 표시 설정</h2>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '20px' }}>
                    <input
                        type="checkbox"
                        checked={settings.displayProducts}
                        onChange={(e) => setSettings({ ...settings, displayProducts: e.target.checked })}
                    />
                    메인 페이지에 상품 선택 표시
                </label>

                {settings.displayProducts && (
                    <div style={{ marginTop: '30px' }}>
                        <h3>메인 페이지에 표시할 상품 선택</h3>
                        <p style={{ color: '#666', fontSize: '14px' }}>
                            선택한 상품만 메인 페이지에서 선택 가능합니다.
                        </p>

                        {products.length === 0 ? (
                            <p style={{ marginTop: '20px', color: '#999' }}>
                                등록된 상품이 없습니다. 먼저 상품을 등록해주세요.
                            </p>
                        ) : (
                            <div style={{ marginTop: '20px' }}>
                                {products.map(product => (
                                    <label
                                        key={product.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            padding: '12px',
                                            border: '1px solid #eee',
                                            borderRadius: '8px',
                                            marginBottom: '10px',
                                            cursor: 'pointer',
                                            backgroundColor: settings.selectedProducts.includes(product.id) ? '#f0f8ff' : 'white'
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={settings.selectedProducts.includes(product.id)}
                                            onChange={() => handleToggleProduct(product.id)}
                                        />
                                        {product.imageUrl && (
                                            <img
                                                src={product.imageUrl}
                                                alt={product.name}
                                                style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                                            />
                                        )}
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 'bold' }}>{product.name}</div>
                                            <div style={{ color: '#666', fontSize: '14px' }}>
                                                {product.price.toLocaleString()}원
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '12px', color: product.available ? '#28a745' : '#dc3545' }}>
                                            {product.available ? '판매중' : '품절'}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <button
                    className="button"
                    onClick={handleSave}
                    style={{ marginTop: '30px' }}
                >
                    설정 저장
                </button>

                {message && (
                    <p style={{
                        marginTop: '10px',
                        color: message.includes('성공') || message.includes('저장되었습니다') ? 'green' : 'red'
                    }}>
                        {message}
                    </p>
                )}
            </div>
        </div>
    );
}
