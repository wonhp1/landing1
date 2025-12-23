import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useNotionCache } from '../contexts/NotionCacheContext';
import { prefetchProducts } from '../utils/prefetchUtils';

export default function Home() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPasswordInput, setShowPasswordInput] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // 상품 선택 관련 state
    const [products, setProducts] = useState([]);
    const [homepageSettings, setHomepageSettings] = useState(null);
    const [selectedProductId, setSelectedProductId] = useState('');
    const [businessInfo, setBusinessInfo] = useState(null);

    // Get global cache for prefetching
    const cache = useNotionCache();

    useEffect(() => {
        fetchHomepageSettings();
        fetchBusinessInfo();
    }, []);

    // 🚀 Prefetch products when they're loaded
    useEffect(() => {
        if (products.length > 0) {
            const timer = setTimeout(() => {
                prefetchHomePageProducts();
            }, 1000); // Slightly longer delay on home page

            return () => clearTimeout(timer);
        }
    }, [products]);

    const prefetchHomePageProducts = async () => {
        if (products.length === 0) return;

        console.log(`🏠 Prefetching ${products.length} homepage products...`);
        await prefetchProducts(products, cache, {
            batchSize: 2,
            delayBetweenBatches: 200
        });
    };

    const fetchHomepageSettings = async () => {
        try {
            const [settingsRes, productsRes] = await Promise.all([
                fetch('/api/homepage-settings'),
                fetch('/api/products')
            ]);

            const settings = await settingsRes.json();
            const allProducts = await productsRes.json();

            setHomepageSettings(settings);

            // 메인 페이지에 표시할 상품만 필터링
            if (settings.selectedProducts && settings.selectedProducts.length > 0) {
                const selectedProducts = allProducts.filter(p =>
                    settings.selectedProducts.includes(p.id) && p.available
                );
                setProducts(selectedProducts);
                if (selectedProducts.length > 0) {
                    setSelectedProductId(selectedProducts[0].id);
                }
            }
        } catch (error) {
            console.error('설정 로딩 실패:', error);
        }
    };

    const fetchBusinessInfo = async () => {
        try {
            const res = await fetch('/api/business-info');
            if (res.ok) {
                const data = await res.json();
                setBusinessInfo(data);
            }
        } catch (error) {
            console.error('Failed to fetch business info:', error);
        }
    };

    const handleLogin = async () => {
        try {
            setError('');
            setIsLoading(true);

            const response = await fetch('/api/auth/verify-admin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password }),
            });

            const data = await response.json();

            if (data.isValid) {
                router.push('/admin');
            } else {
                setError('비밀번호가 틀렸습니다.');
                setPassword('');
            }
        } catch (error) {
            console.error('Error verifying admin password:', error);
            setError('인증 중 오류가 발생했습니다.');
            setPassword('');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    };

    const getSelectedProduct = () => {
        return products.find(p => p.id === selectedProductId);
    };

    return (
        <div className="container" style={{ maxWidth: '800px' }}>
            <div className="card" style={{ marginTop: '100px', textAlign: 'center' }}>
                <h1>주문 시스템</h1>
                <p style={{ color: '#666', marginTop: '10px' }}>
                    주문하려면 아래 버튼을 클릭하세요
                </p>

                {/* 상품 선택 토글 */}
                {homepageSettings?.displayProducts && products.length > 0 && (
                    <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '12px' }}>
                        <h3 style={{ marginBottom: '16px' }}>상품 선택</h3>
                        <select
                            className="input"
                            value={selectedProductId}
                            onChange={(e) => setSelectedProductId(e.target.value)}
                            style={{ maxWidth: '400px', margin: '0 auto' }}
                        >
                            {products.map(product => (
                                <option key={product.id} value={product.id}>
                                    {product.name} - {product.price.toLocaleString()}원
                                </option>
                            ))}
                        </select>

                        {selectedProductId && getSelectedProduct() && (
                            <div style={{ marginTop: '20px', padding: '16px', backgroundColor: 'white', borderRadius: '8px' }}>
                                <h4>{getSelectedProduct().name}</h4>
                                {getSelectedProduct().imageUrl && (
                                    <img
                                        src={getSelectedProduct().imageUrl}
                                        alt={getSelectedProduct().name}
                                        style={{ maxWidth: '200px', height: 'auto', margin: '10px auto', display: 'block', borderRadius: '8px' }}
                                    />
                                )}
                                <p style={{ color: '#666', margin: '10px 0' }}>
                                    {getSelectedProduct().description}
                                </p>
                                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#0070f3' }}>
                                    {getSelectedProduct().price.toLocaleString()}원
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <div style={{ marginTop: '30px', display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link href="/order">
                        <button className="button" style={{ fontSize: '18px', padding: '16px 32px' }}>
                            주문하기
                        </button>
                    </Link>
                    <Link href="/myorders">
                        <button className="button" style={{ fontSize: '18px', padding: '16px 32px', backgroundColor: '#666', borderColor: '#666' }}>
                            주문 확인하기
                        </button>
                    </Link>
                </div>

                <div style={{ marginTop: '50px', paddingTop: '30px', borderTop: '1px solid #eee' }}>
                    {!showPasswordInput ? (
                        <button
                            onClick={() => setShowPasswordInput(true)}
                            className="button"
                            style={{
                                backgroundColor: '#666',
                                borderColor: '#666',
                                fontSize: '14px'
                            }}
                        >
                            관리자 페이지
                        </button>
                    ) : (
                        <div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="비밀번호"
                                className="input"
                                style={{ maxWidth: '300px', margin: '0 auto' }}
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleLogin}
                                className="button"
                                disabled={isLoading}
                            >
                                {isLoading ? '로그인 중...' : '로그인'}
                            </button>
                            {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
                        </div>
                    )}
                </div>
            </div>

            <footer style={{ marginTop: '50px', padding: '20px', borderTop: '1px solid #eee', color: '#666', fontSize: '12px', textAlign: 'center' }}>
                {businessInfo && (
                    <div style={{ lineHeight: '1.6' }}>
                        <p style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '10px' }}>{businessInfo.businessName}</p>
                        <p>대표: {businessInfo.representative} | 사업자등록번호: {businessInfo.businessLicense}</p>
                        <p>주소: {businessInfo.address}</p>
                        <p>전화: {businessInfo.phone} | 이메일: {businessInfo.email}</p>
                        <p>통신판매업신고: {businessInfo.ecommerceLicense}</p>
                    </div>
                )}
            </footer>
        </div >
    );
}
