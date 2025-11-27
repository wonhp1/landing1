import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Modal from '../../components/Modal';

const CATEGORY_OPTIONS = ['수산물', '과일', '야채', '축산물', '가공식품', '기타'];

export default function AdminProducts() {
    const router = useRouter();
    const [products, setProducts] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        imageUrl: '',
        available: true,
        category: CATEGORY_OPTIONS[0],
        weight: ''
    });

    useEffect(() => {
        checkAuth();
        fetchProducts();

        // Cleanup function to reset overflow when component unmounts
        return () => {
            document.body.style.overflow = 'auto';
        };
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

    const fetchProducts = async () => {
        try {
            const response = await fetch('/api/products');
            const data = await response.json();
            setProducts(data);
        } catch (error) {
            console.error('상품 로딩 실패:', error);
        }
    };

    const handleOpenModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                description: product.description,
                price: product.price,
                imageUrl: product.imageUrl,
                available: product.available,
                category: product.category || '기타',
                weight: product.weight || ''
            });
        } else {
            setEditingProduct(null);
            setFormData({
                name: '',
                description: '',
                price: '',
                imageUrl: '',
                available: true,
                category: CATEGORY_OPTIONS[0],
                weight: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
            const method = editingProduct ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                fetchProducts();
                setIsModalOpen(false);
            }
        } catch (error) {
            console.error('저장 실패:', error);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;

        try {
            const response = await fetch(`/api/products/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                fetchProducts();
            }
        } catch (error) {
            console.error('삭제 실패:', error);
        }
    };

    const dragItem = useRef();
    const dragOverItem = useRef();

    const handleDragStart = (e, position) => {
        dragItem.current = position;
        e.target.style.opacity = '0.5';
    };

    const handleDragEnter = (e, position) => {
        e.preventDefault();
        dragOverItem.current = position;

        const dragIndex = dragItem.current;
        const dragOverIndex = dragOverItem.current;

        if (dragIndex === undefined || dragOverIndex === undefined || dragIndex === dragOverIndex) return;

        const newProducts = [...products];
        const draggedItemContent = newProducts[dragIndex];

        newProducts.splice(dragIndex, 1);
        newProducts.splice(dragOverIndex, 0, draggedItemContent);

        dragItem.current = dragOverIndex;
        setProducts(newProducts);
    };

    const handleBackupToSheet = async () => {
        if (!confirm('현재 상품 데이터를 구글 시트에 백업하시겠습니까?')) {
            return;
        }

        try {
            const res = await fetch('/api/products?action=backup-to-sheet', {
                method: 'POST'
            });

            if (res.ok) {
                alert('구글 시트에 백업 완료');
            } else {
                alert('백업 실패');
            }
        } catch (error) {
            alert('오류 발생');
        }
    };

    const handleSyncFromSheet = async () => {
        if (!confirm('구글 시트의 데이터로 덮어쓰시겠습니까? 현재 데이터는 삭제됩니다.')) {
            return;
        }

        try {
            const res = await fetch('/api/products?action=sync-from-sheet', {
                method: 'POST'
            });

            if (res.ok) {
                const data = await res.json();
                setProducts(data.data);
                alert('구글 시트에서 불러오기 완료');
            } else {
                alert('불러오기 실패');
            }
        } catch (error) {
            alert('오류 발생');
        }
    };

    const handleDragEnd = async (e) => {
        e.target.style.opacity = '1';
        dragItem.current = null;
        dragOverItem.current = null;
        saveOrder();
    };

    const saveOrder = async () => {
        // Update displayOrder
        const updates = products.map((p, i) => ({
            id: p.id,
            displayOrder: i
        }));

        try {
            await fetch('/api/products/reorder', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
        } catch (error) {
            console.error('Failed to save order:', error);
            fetchProducts(); // Revert on error
        }
    };

    // Mobile Touch Handlers
    const handleTouchStart = (e, index) => {
        dragItem.current = index;
        e.currentTarget.style.opacity = '0.5';
        document.body.style.overflow = 'hidden'; // Prevent scrolling while dragging
    };

    const handleTouchMove = (e) => {
        const touch = e.touches[0];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        const row = element?.closest('tr');

        if (!row) return;

        const rowIndex = Array.from(row.parentNode.children).indexOf(row);

        if (rowIndex !== -1 && rowIndex !== dragItem.current) {
            const dragIndex = dragItem.current;
            const dragOverIndex = rowIndex;

            const newProducts = [...products];
            const draggedItemContent = newProducts[dragIndex];

            newProducts.splice(dragIndex, 1);
            newProducts.splice(dragOverIndex, 0, draggedItemContent);

            dragItem.current = dragOverIndex;
            setProducts(newProducts);
        }
    };

    const handleTouchEnd = (e) => {
        e.currentTarget.style.opacity = '1';
        document.body.style.overflow = 'auto'; // Restore scrolling
        dragItem.current = null;
        saveOrder();
    };

    return (
        <div className="container">
            <h1>상품 관리</h1>

            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button onClick={() => handleOpenModal()} className="button">상품 추가</button>
                <button onClick={handleBackupToSheet} className="button" style={{ backgroundColor: '#28a745', borderColor: '#28a745' }}>시트 백업</button>
                <button onClick={handleSyncFromSheet} className="button" style={{ backgroundColor: '#ffc107', borderColor: '#ffc107' }}>시트 불러오기</button>
                <Link href="/admin">
                    <button className="button" style={{ backgroundColor: '#666', borderColor: '#666' }}>관리자 홈</button>
                </Link>
            </div>

            <div style={{ marginTop: '40px' }}>
                {products.length === 0 ? (
                    <p>등록된 상품이 없습니다.</p>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>순서</th>
                                <th>이미지</th>
                                <th>상품명</th>
                                <th>구분</th>
                                <th>가격</th>
                                <th>중량(g)</th>
                                <th>상태</th>
                                <th>작업</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product, index) => (
                                <tr
                                    key={product.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragEnter={(e) => handleDragEnter(e, index)}
                                    onDragEnd={handleDragEnd}
                                    onDragOver={(e) => e.preventDefault()}
                                    onTouchStart={(e) => handleTouchStart(e, index)}
                                    onTouchMove={handleTouchMove}
                                    onTouchEnd={handleTouchEnd}
                                    onTouchCancel={handleTouchEnd}
                                    style={{
                                        cursor: 'move',
                                        userSelect: 'none',
                                        backgroundColor: 'white',
                                        touchAction: 'none' // Important for touch events
                                    }}
                                >
                                    <td style={{ textAlign: 'center', color: '#999', fontSize: '20px' }}>
                                        ☰
                                    </td>
                                    <td>
                                        {product.imageUrl && (
                                            <img src={product.imageUrl} alt={product.name} style={{ width: '50px', height: '50px', objectFit: 'cover' }} />
                                        )}
                                    </td>
                                    <td>{product.name}</td>
                                    <td>{product.category || '기타'}</td>
                                    <td>{product.price.toLocaleString()}원</td>
                                    <td>{product.weight ? `${product.weight}g` : '-'}</td>
                                    <td>{product.available ? '판매중' : '품절'}</td>
                                    <td>
                                        <button
                                            className="button"
                                            onClick={() => handleOpenModal(product)}
                                            style={{ padding: '6px 12px', fontSize: '14px' }}
                                        >
                                            수정
                                        </button>
                                        <button
                                            className="button"
                                            onClick={() => handleDelete(product.id)}
                                            style={{ padding: '6px 12px', fontSize: '14px', backgroundColor: '#dc3545', borderColor: '#dc3545' }}
                                        >
                                            삭제
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProduct ? '상품 수정' : '새 상품 추가'}>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="상품명 *"
                        className="input"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                    <textarea
                        placeholder="설명"
                        className="input"
                        rows="3"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                    <input
                        type="number"
                        placeholder="가격 *"
                        className="input"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        required
                    />
                    <input
                        type="number"
                        placeholder="중량 (g)"
                        className="input"
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    />
                    <input
                        type="url"
                        placeholder="이미지 URL"
                        className="input"
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    />
                    <select
                        className="input"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                        {CATEGORY_OPTIONS.map(option => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                            type="checkbox"
                            checked={formData.available}
                            onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                        />
                        판매 가능
                    </label>
                    <button type="submit" className="button" style={{ marginTop: '20px' }}>
                        {editingProduct ? '수정' : '추가'}
                    </button>
                </form>
            </Modal>
        </div>
    );
}
