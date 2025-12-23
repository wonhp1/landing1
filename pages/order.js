import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Script from 'next/script';
import ProductCard from '../components/ProductCard';
import Toast from '../components/Toast';
import FloatingCartButton from '../components/FloatingCartButton';
import PaymentModal from '../components/PaymentModal';
import ProductDetailModal from '../components/ProductDetailModal';
import { useNotionCache } from '../contexts/NotionCacheContext';
import { prefetchWithPriority } from '../utils/prefetchUtils';
import styles from '../styles/OrderPage.module.css';

export default function OrderPage() {
    const router = useRouter();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState(['전체']);
    const [selectedCategories, setSelectedCategories] = useState(['전체']);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [businessInfo, setBusinessInfo] = useState(null);
    const [customerInfo, setCustomerInfo] = useState({
        name: '',
        phone: '',
        address: '',
        detailAddress: '',
        password: '',
        request: ''  // 요청사항 (비필수)
    });
    const [isPostcodeOpen, setIsPostcodeOpen] = useState(false);
    const [isDaumScriptLoaded, setIsDaumScriptLoaded] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [toast, setToast] = useState(null);
    const [toastTimer, setToastTimer] = useState(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedDetailProduct, setSelectedDetailProduct] = useState(null);
    const cartRef = useRef(null);

    // Get global cache for prefetching
    const cache = useNotionCache();

    const scrollToCart = () => {
        cartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const showToast = (msg) => {
        if (toastTimer) clearTimeout(toastTimer);
        setToast({ message: msg, visible: true });
        const timer = setTimeout(() => {
            setToast(prev => ({ ...prev, visible: false }));
        }, 2000);
        setToastTimer(timer);
    };

    useEffect(() => {
        fetchProducts();
        fetchBusinessInfo();
    }, []);

    // 🚀 Prefetch all product details when products are loaded
    // Optimized: Waits for window load and idle state
    useEffect(() => {
        if (products.length > 0) {
            const startPrefetch = () => {
                // Use requestIdleCallback if available, otherwise setTimeout
                if (window.requestIdleCallback) {
                    window.requestIdleCallback(() => {
                        prefetchAllProducts();
                    }, { timeout: 5000 });
                } else {
                    setTimeout(prefetchAllProducts, 2000);
                }
            };

            // Check if page is already loaded
            if (document.readyState === 'complete') {
                startPrefetch();
            } else {
                window.addEventListener('load', startPrefetch);
                return () => window.removeEventListener('load', startPrefetch);
            }
        }
    }, [products]);

    const prefetchAllProducts = async () => {
        console.log(`📦 Starting prefetch for ${products.length} products on order page...`);

        // Prefetch with priority: first 6 products (visible on most screens) get priority
        await prefetchWithPriority(products, 6, cache);
    };


    // Check if Daum Postcode script is loaded
    useEffect(() => {
        if (window.daum && window.daum.Postcode) {
            setIsDaumScriptLoaded(true);
            return;
        }

        const checkScript = setInterval(() => {
            if (window.daum && window.daum.Postcode) {
                setIsDaumScriptLoaded(true);
                clearInterval(checkScript);
            }
        }, 100);

        // Timeout after 10 seconds
        const timeout = setTimeout(() => {
            clearInterval(checkScript);
        }, 10000);

        return () => {
            clearInterval(checkScript);
            clearTimeout(timeout);
        };
    }, []);

    // Lock body scroll when postcode modal is open
    useEffect(() => {
        if (isPostcodeOpen) {
            // Save current scroll position
            const scrollY = window.scrollY;
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = '100%';
            document.body.style.overflow = 'hidden';
        } else {
            // Restore scroll position
            const scrollY = document.body.style.top;
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            document.body.style.overflow = '';
            if (scrollY) {
                window.scrollTo(0, parseInt(scrollY || '0') * -1);
            }
        }
    }, [isPostcodeOpen]);

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

    const fetchProducts = async () => {
        try {
            const response = await fetch('/api/products');
            const data = await response.json();
            const availableProducts = data.filter(p => p.available);
            // Sort by displayOrder
            availableProducts.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
            setProducts(availableProducts);

            // 사용 가능한 카테고리 목록 생성
            const distinctCategories = Array.from(
                new Set(
                    availableProducts.map(p => p.category || '기타')
                )
            );
            setCategories(['전체', ...distinctCategories]);
        } catch (error) {
            console.error('상품 로딩 실패:', error);
        }
    };

    const handleSelectProduct = (product) => {
        const existing = selectedProducts.find(p => p.productId === product.id);
        if (existing) {
            setSelectedProducts(selectedProducts.map(p =>
                p.productId === product.id ? { ...p, quantity: p.quantity + 1 } : p
            ));
        } else {
            setSelectedProducts([...selectedProducts, {
                productId: product.id,
                quantity: 1,
                name: product.name,
                price: product.price,
                weight: product.weight || 0
            }]);
        }
        showToast(`${product.name}이(가) 추가되었습니다.`);
    };

    const handleCardClick = (product) => {
        setSelectedDetailProduct(product);
        setIsDetailModalOpen(true);
    };

    const handleQuantityChange = (productId, change) => {
        setSelectedProducts(selectedProducts.map(p => {
            if (p.productId === productId) {
                const newQuantity = p.quantity + change;
                return newQuantity > 0 ? { ...p, quantity: newQuantity } : p;
            }
            return p;
        }).filter(p => p.quantity > 0));
    };

    const handleRemoveProduct = (productId) => {
        setSelectedProducts(selectedProducts.filter(p => p.productId !== productId));
    };

    const handleFindAddress = () => {
        // Check if script is loaded
        if (!isDaumScriptLoaded || !window.daum || !window.daum.Postcode) {
            alert('주소 검색 기능을 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
            return;
        }

        const layer = document.getElementById('daum-postcode-layer');
        const frame = document.getElementById('daum-postcode-frame');

        if (!layer || !frame) {
            alert('주소 검색 레이어를 찾을 수 없습니다.');
            return;
        }

        layer.style.display = 'block';
        setIsPostcodeOpen(true);

        new window.daum.Postcode({
            oncomplete: function (data) {
                let addr = ''; // 주소 (도로명 우선)
                let extraAddr = ''; // 참고항목

                // 도로명 주소가 있으면 항상 도로명으로, 없을 때만 지번 사용
                if (data.roadAddress) {
                    addr = data.roadAddress;
                } else {
                    addr = data.jibunAddress;
                }

                if (data.roadAddress) {
                    if (data.bname !== '' && /[동|로|가]$/g.test(data.bname)) {
                        extraAddr += data.bname;
                    }
                    if (data.buildingName !== '' && data.apartment === 'Y') {
                        extraAddr += (extraAddr !== '' ? ', ' + data.buildingName : data.buildingName);
                    }
                    if (extraAddr !== '') {
                        extraAddr = ' (' + extraAddr + ')';
                    }
                }

                const fullAddress = (addr + (extraAddr || '')).trim();

                setCustomerInfo(prev => ({
                    ...prev,
                    postcode: data.zonecode || '',
                    mainAddress: fullAddress,
                    detailAddress: '' // 주소 검색 후 상세주소 초기화
                }));

                layer.style.display = 'none';
                setIsPostcodeOpen(false);
            },
            onclose: function () {
                layer.style.display = 'none';
                setIsPostcodeOpen(false);
            },
            width: '100%',
            height: '100%'
        }).embed(frame);
    };

    const getTotalAmount = () => {
        return selectedProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    };

    // 전화번호 자동 포맷팅 함수
    const formatPhoneNumber = (value) => {
        // 숫자만 추출
        const numbers = value.replace(/[^0-9]/g, '');

        // 010-0000-0000 형식으로 포맷팅
        if (numbers.length <= 3) {
            return numbers;
        } else if (numbers.length <= 7) {
            return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
        } else {
            return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
        }
    };

    const handlePhoneChange = (e) => {
        const formatted = formatPhoneNumber(e.target.value);
        setCustomerInfo({ ...customerInfo, phone: formatted });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (selectedProducts.length === 0) {
            setMessage('상품을 선택해주세요.');
            return;
        }

        if (!customerInfo.name) {
            setMessage('이름을 입력해주세요.');
            return;
        }

        if (!customerInfo.phone) {
            setMessage('전화번호를 입력해주세요.');
            return;
        }

        // 전화번호 형식 검증 (010-0000-0000)
        const phoneRegex = /^010-\d{4}-\d{4}$/;
        if (!phoneRegex.test(customerInfo.phone)) {
            setMessage('전화번호는 010-0000-0000 형식으로 입력해주세요.');
            return;
        }

        if (!customerInfo.mainAddress) {
            setMessage('주소를 입력해주세요. "주소 찾기" 버튼을 클릭하세요.');
            return;
        }

        if (!customerInfo.detailAddress || customerInfo.detailAddress.trim() === '') {
            setMessage('상세 주소를 입력해주세요.');
            return;
        }

        // Open Payment Modal
        setMessage('');
        setIsPaymentModalOpen(true);
    };

    const handleCategoryClick = (category) => {
        if (category === '전체') {
            setSelectedCategories(['전체']);
        } else {
            let newCategories;
            if (selectedCategories.includes('전체')) {
                newCategories = [category];
            } else if (selectedCategories.includes(category)) {
                newCategories = selectedCategories.filter(c => c !== category);
            } else {
                newCategories = [...selectedCategories, category];
            }

            if (newCategories.length === 0) {
                newCategories = ['전체'];
            }
            setSelectedCategories(newCategories);
        }
    };

    const filteredProducts = products.filter(product => {
        if (selectedCategories.includes('전체')) return true;
        return selectedCategories.includes(product.category || '기타');
    });

    return (
        <div className="container">
            {/* Daum 주소 API 스크립트 로드 */}
            <Script
                src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
                strategy="lazyOnload"
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <h1 style={{ margin: 0 }}>주문하기</h1>
                <Link href="/myorders">
                    <button className="button" style={{ backgroundColor: '#666', borderColor: '#666', padding: '10px 20px' }}>
                        주문 확인하기
                    </button>
                </Link>
            </div>

            <h2 style={{ marginTop: '40px' }}>상품 선택</h2>

            {/* 상위 카테고리 선택 */}
            {/* 상위 카테고리 선택 */}
            <div className={styles.categoryContainer}>
                {categories.map(category => (
                    <button
                        key={category}
                        className={`${styles.categoryButton} ${selectedCategories.includes(category) ? styles.categoryButtonActive : ''}`}
                        onClick={() => handleCategoryClick(category)}
                    >
                        {category}
                    </button>
                ))}
            </div>

            <div className="grid">
                {filteredProducts.map(product => (
                    <div key={product.id} onClick={() => handleCardClick(product)} style={{ cursor: 'pointer' }}>
                        <ProductCard
                            product={product}
                            onSelect={(e) => {
                                if (e && e.stopPropagation) {
                                    e.stopPropagation();
                                }
                                handleSelectProduct(product);
                            }}
                        />
                    </div>
                ))}
            </div>

            {selectedProducts.length > 0 && (
                <div className="card" style={{ marginTop: '40px' }} ref={cartRef}>
                    <h2>선택한 상품</h2>
                    {selectedProducts.map(product => (
                        <div key={product.productId} className={styles.selectedItem}>
                            <div className={styles.productInfo}>
                                <span>{product.name}</span>
                                {product.weight > 0 && (
                                    <span className={styles.weightInfo}>
                                        {product.weight}g x {product.quantity}개 = {(product.weight * product.quantity).toLocaleString()}g
                                    </span>
                                )}
                            </div>
                            <div className={styles.controls}>
                                <button
                                    onClick={() => handleQuantityChange(product.productId, -1)}
                                    className={`button ${styles.quantityButton}`}
                                >
                                    -
                                </button>
                                <span>{product.quantity}개</span>
                                <button
                                    onClick={() => handleQuantityChange(product.productId, 1)}
                                    className={`button ${styles.quantityButton}`}
                                >
                                    +
                                </button>
                                <span style={{ marginLeft: '20px', fontWeight: 'bold' }}>
                                    {(product.price * product.quantity).toLocaleString()}원
                                </span>
                                <button
                                    onClick={() => handleRemoveProduct(product.productId)}
                                    className={`button ${styles.removeButton}`}
                                >
                                    제거
                                </button>
                            </div>
                        </div>
                    ))}
                    <div style={{ marginTop: '20px', textAlign: 'right', fontSize: '20px', fontWeight: 'bold' }}>
                        총 금액: {getTotalAmount().toLocaleString()}원
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="card" style={{ marginTop: '40px' }}>
                <h2>주문자 정보</h2>
                <input
                    type="text"
                    placeholder="이름 *"
                    className="input"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                    required
                />
                <input
                    type="tel"
                    placeholder="전화번호 * (010-0000-0000)"
                    className="input"
                    value={customerInfo.phone}
                    onChange={handlePhoneChange}
                    maxLength="13"
                    required
                />
                {/* 주소: 다음 우편번호 API + 기본주소 + 상세주소 */}
                <div style={{ marginTop: '10px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>주소 *</span>
                    <button
                        type="button"
                        className="button"
                        style={{ padding: '8px 16px', fontSize: '14px' }}
                        onClick={handleFindAddress}
                    >
                        주소 찾기
                    </button>
                </div>
                <input
                    type="text"
                    placeholder="우편번호"
                    className="input"
                    value={customerInfo.postcode}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, postcode: e.target.value })}
                    readOnly
                />
                <input
                    type="text"
                    placeholder="기본 주소"
                    className="input"
                    value={customerInfo.mainAddress}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, mainAddress: e.target.value })}
                    readOnly
                />
                <input
                    type="text"
                    placeholder="상세 주소 * (건물명, 호수 등)"
                    className="input"
                    value={customerInfo.detailAddress}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, detailAddress: e.target.value })}
                    required
                />

                <textarea
                    placeholder="요청사항 (선택사항)"
                    className="input"
                    value={customerInfo.request}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, request: e.target.value })}
                    rows="3"
                    style={{ resize: 'vertical', fontFamily: 'inherit' }}
                />
                <button type="submit" className="button" disabled={isSubmitting}>
                    {isSubmitting ? '주문 중...' : '주문하기'}
                </button>
                {message && (
                    <p style={{
                        marginTop: '10px',
                        color: message.includes('완료') ? 'green' : 'red'
                    }}>
                        {message}
                    </p>
                )}
            </form>
            {/* 다음 우편번호 서비스 레이어 */}
            <div
                id="daum-postcode-layer"
                style={{
                    display: 'none',
                    position: 'fixed',
                    zIndex: 9999,
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    pointerEvents: 'auto'
                }}
                onClick={(e) => {
                    if (e.target.id === 'daum-postcode-layer') {
                        e.currentTarget.style.display = 'none';
                        setIsPostcodeOpen(false);
                    }
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '90%',
                        maxWidth: '500px',
                        height: '80vh',
                        maxHeight: '600px',
                        backgroundColor: '#fff',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                    }}
                >
                    <div id="daum-postcode-frame" style={{ width: '100%', height: '100%' }} />
                </div>
            </div>
            <FloatingCartButton
                onClick={scrollToCart}
                itemCount={selectedProducts.reduce((sum, item) => sum + item.quantity, 0)}
            />
            {toast && (
                <Toast message={toast.message} isVisible={toast.visible} />
            )}

            <footer style={{ marginTop: '50px', padding: '20px', borderTop: '1px solid #eee', color: '#666', fontSize: '12px', textAlign: 'center' }}>
                {businessInfo && (
                    <div style={{ lineHeight: '1.6' }}>
                        <p style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '10px' }}>{businessInfo.businessName}</p>
                        <p>대표: {businessInfo.representative} | 사업자등록번호: {businessInfo.businessLicense}</p>
                        <p>주소: {businessInfo.address}</p>
                        <p>전화: {businessInfo.phone} | 이메일: {businessInfo.email}</p>
                        <p>통신판매업신고: {businessInfo.ecommerceLicense}</p>
                        {businessInfo.kakaoUrl && (
                            <div style={{ marginTop: '15px' }}>
                                <a
                                    href={businessInfo.kakaoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: 'inline-block',
                                        padding: '8px 16px',
                                        backgroundColor: '#FEE500',
                                        color: '#3C1E1E',
                                        borderRadius: '20px',
                                        fontSize: '13px',
                                        fontWeight: 'bold',
                                        textDecoration: 'none',
                                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    💬 카카오톡 고객센터로 문의하기
                                </a>
                            </div>
                        )}
                    </div>
                )}
            </footer>

            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                amount={getTotalAmount()}
                orderId={'ORDER_' + new Date().getTime()}
                orderName={selectedProducts.length > 1 ? `${selectedProducts[0].name} 외 ${selectedProducts.length - 1}건` : selectedProducts[0]?.name}
                customerName={customerInfo.name}
                customerEmail="" // Optional
                customerMobilePhone={customerInfo.phone.replace(/[^0-9]/g, '')} // 하이픈 제거하고 숫자만 전달
                products={selectedProducts}
                customerInfo={customerInfo}
            />

            <ProductDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                product={selectedDetailProduct}
                onAddToCart={handleSelectProduct}
            />
        </div>
    );
}
