import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Script from 'next/script';
import ProductCard from '../components/ProductCard';

export default function OrderPage() {
    const router = useRouter();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState(['전체']);
    const [selectedCategory, setSelectedCategory] = useState('전체');
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [customerInfo, setCustomerInfo] = useState({
        name: '',
        phone: '',
        postcode: '',
        sido: '',
        sigungu: '',
        dong: '',
        addressDetail: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [isPostcodeOpen, setIsPostcodeOpen] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await fetch('/api/products');
            const data = await response.json();
            const availableProducts = data.filter(p => p.available);
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
            setSelectedProducts([...selectedProducts, { productId: product.id, quantity: 1, name: product.name, price: product.price }]);
        }
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
        // 다음 주소 API가 로드되지 않은 경우
        if (typeof window === 'undefined' || !window.daum || !window.daum.Postcode) {
            alert('주소 검색 스크립트를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
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
                let addr = ''; // 주소
                let extraAddr = ''; // 참고항목

                if (data.userSelectedType === 'R') {
                    addr = data.roadAddress;
                } else {
                    addr = data.jibunAddress;
                }

                if (data.userSelectedType === 'R') {
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
                    sido: data.sido || '',
                    sigungu: data.sigungu || '',
                    dong: data.bname || data.bname1 || '',
                    addressDetail: prev.addressDetail
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (selectedProducts.length === 0) {
            setMessage('상품을 선택해주세요.');
            return;
        }

        if (!customerInfo.name || !customerInfo.phone) {
            setMessage('이름과 전화번호를 입력해주세요.');
            return;
        }

        setIsSubmitting(true);
        setMessage('');

        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: customerInfo.name,
                    phone: customerInfo.phone,
                    address: `${customerInfo.postcode ? `(${customerInfo.postcode}) ` : ''}${customerInfo.sido} ${customerInfo.sigungu} ${customerInfo.dong} ${customerInfo.addressDetail}`.trim(),
                    products: selectedProducts.map(p => ({ productId: p.productId, quantity: p.quantity }))
                }),
            });

            if (response.ok) {
                setMessage('주문이 완료되었습니다!');
                setSelectedProducts([]);
                setCustomerInfo({
                    name: '',
                    phone: '',
                    postcode: '',
                    sido: '',
                    sigungu: '',
                    dong: '',
                    addressDetail: ''
                });

                setTimeout(() => {
                    router.push('/');
                }, 2000);
            } else {
                setMessage('주문 중 오류가 발생했습니다.');
            }
        } catch (error) {
            console.error('주문 실패:', error);
            setMessage('주문 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredProducts = products.filter(product => {
        if (selectedCategory === '전체') return true;
        return (product.category || '기타') === selectedCategory;
    });

    return (
        <div className="container">
            {/* Daum 주소 API 스크립트 로드 */}
            <Script
                src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
                strategy="lazyOnload"
            />
            <h1>주문하기</h1>

            <h2 style={{ marginTop: '40px' }}>상품 선택</h2>

            {/* 상위 카테고리 선택 */}
            <div style={{ marginBottom: '20px', maxWidth: '300px' }}>
                <select
                    className="input"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                >
                    {categories.map(category => (
                        <option key={category} value={category}>
                            {category}
                        </option>
                    ))}
                </select>
            </div>

            <div className="grid">
                {filteredProducts.map(product => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        onSelect={handleSelectProduct}
                    />
                ))}
            </div>

            {selectedProducts.length > 0 && (
                <div className="card" style={{ marginTop: '40px' }}>
                    <h2>선택한 상품</h2>
                    {selectedProducts.map(product => (
                        <div key={product.productId} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '10px 0',
                            borderBottom: '1px solid #eee'
                        }}>
                            <span>{product.name}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <button
                                    onClick={() => handleQuantityChange(product.productId, -1)}
                                    className="button"
                                    style={{ padding: '4px 12px' }}
                                >
                                    -
                                </button>
                                <span>{product.quantity}개</span>
                                <button
                                    onClick={() => handleQuantityChange(product.productId, 1)}
                                    className="button"
                                    style={{ padding: '4px 12px' }}
                                >
                                    +
                                </button>
                                <span style={{ marginLeft: '20px', fontWeight: 'bold' }}>
                                    {(product.price * product.quantity).toLocaleString()}원
                                </span>
                                <button
                                    onClick={() => handleRemoveProduct(product.productId)}
                                    className="button"
                                    style={{ padding: '4px 12px', marginLeft: '12px', backgroundColor: '#dc3545', borderColor: '#dc3545' }}
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
                    placeholder="전화번호 *"
                    className="input"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                    required
                />
                {/* 주소: 다음 우편번호 API + 행정구역 + 상세주소 */}
                <div style={{ marginTop: '10px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>주소</span>
                    <button
                        type="button"
                        className="button"
                        style={{ padding: '4px 10px', fontSize: '13px' }}
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
                    placeholder="시/도 (예: 서울특별시)"
                    className="input"
                    value={customerInfo.sido}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, sido: e.target.value })}
                    readOnly
                />
                <input
                    type="text"
                    placeholder="시군구 (예: 송파구)"
                    className="input"
                    value={customerInfo.sigungu}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, sigungu: e.target.value })}
                    readOnly
                />
                <input
                    type="text"
                    placeholder="읍/면/동 (예: 가락1동)"
                    className="input"
                    value={customerInfo.dong}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, dong: e.target.value })}
                    readOnly
                />
                <textarea
                    placeholder="상세주소 (도로명, 건물명/호수 등)"
                    className="input"
                    rows="3"
                    value={customerInfo.addressDetail}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, addressDetail: e.target.value })}
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
                    zIndex: 1000,
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.4)'
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
                        width: '100%',
                        maxWidth: '500px',
                        height: '400px',
                        backgroundColor: '#fff',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
                    }}
                >
                    <div id="daum-postcode-frame" style={{ width: '100%', height: '100%' }} />
                </div>
            </div>
        </div>
    );
}
