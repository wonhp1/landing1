import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Admin() {
    const router = useRouter();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const response = await fetch('/api/auth/check-auth');
            if (!response.ok) {
                router.push('/');
            }
        } catch (error) {
            console.error('Authentication check failed:', error);
            router.push('/');
        }
    };

    return (
        <div className="container">
            <h1>관리자 페이지</h1>

            <div className="grid" style={{ marginTop: '40px' }}>
                <Link href="/admin/products">
                    <div className="card" style={{ cursor: 'pointer', textAlign: 'center' }}>
                        <h2>상품 관리</h2>
                        <p style={{ color: '#666' }}>상품 등록, 수정, 삭제</p>
                    </div>
                </Link>

                <Link href="/admin/orders">
                    <div className="card" style={{ cursor: 'pointer', textAlign: 'center' }}>
                        <h2>주문 관리</h2>
                        <p style={{ color: '#666' }}>주문 내역 조회</p>
                    </div>
                </Link>

                <Link href="/admin/homepage-settings">
                    <div className="card" style={{ cursor: 'pointer', textAlign: 'center' }}>
                        <h2>메인 페이지 설정</h2>
                        <p style={{ color: '#666' }}>메인 페이지 상품 설정</p>
                    </div>
                </Link>

                <Link href="/admin/pages">
                    <div className="card" style={{ cursor: 'pointer', textAlign: 'center' }}>
                        <h2>페이지 관리</h2>
                        <p style={{ color: '#666' }}>페이지 생성, 편집</p>
                    </div>
                </Link>

                <Link href="/admin/change-password">
                    <div className="card" style={{ cursor: 'pointer', textAlign: 'center' }}>
                        <h2>비밀번호 변경</h2>
                        <p style={{ color: '#666' }}>관리자 비밀번호 변경</p>
                    </div>
                </Link>
            </div>

            <div style={{ marginTop: '40px', display: 'flex', gap: '10px' }}>
                <Link href="/">
                    <button className="button" style={{ backgroundColor: '#666', borderColor: '#666' }}>
                        메인 페이지로
                    </button>
                </Link>
                <Link href="/api/auth/logout">
                    <button className="button" style={{ backgroundColor: '#dc3545', borderColor: '#dc3545' }}>
                        로그아웃
                    </button>
                </Link>
            </div>
        </div>
    );
}
