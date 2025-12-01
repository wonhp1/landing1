import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function BusinessInfo() {
    const router = useRouter();
    const [info, setInfo] = useState({
        businessName: '',
        representative: '',
        businessLicense: '',
        address: '',
        phone: '',
        email: '',
        ecommerceLicense: '',
        kakaoUrl: ''
    });
    const [message, setMessage] = useState('');

    useEffect(() => {
        checkAuth();
        fetchInfo();
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

    const fetchInfo = async () => {
        const res = await fetch('/api/business-info');
        if (res.ok) {
            const data = await res.json();
            setInfo(data);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setInfo(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('저장 중...');

        try {
            const res = await fetch('/api/business-info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(info)
            });

            if (res.ok) {
                setMessage('저장되었습니다 (구글 시트에 백업됨).');
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage('저장 실패');
            }
        } catch (error) {
            setMessage('오류 발생');
        }
    };

    const handleSyncFromSheet = async () => {
        if (!confirm('구글 시트의 데이터로 덮어쓰시겠습니까?')) {
            return;
        }

        setMessage('구글 시트에서 불러오는 중...');

        try {
            const res = await fetch('/api/business-info?action=sync-from-sheet', {
                method: 'POST'
            });

            if (res.ok) {
                const data = await res.json();
                setInfo(data.data);
                setMessage('구글 시트에서 불러오기 완료');
                setTimeout(() => setMessage(''), 3000);
            } else {
                const error = await res.json();
                setMessage(error.message || '불러오기 실패');
            }
        } catch (error) {
            setMessage('오류 발생');
        }
    };

    return (
        <div className="container">
            <h1>사업자 정보 관리</h1>
            <div style={{ marginBottom: '20px' }}>
                <Link href="/admin" style={{ marginRight: '10px', color: '#0070f3' }}>관리자 페이지로</Link>
            </div>

            <form onSubmit={handleSubmit} style={{ maxWidth: '600px' }}>
                <div className="form-group">
                    <label>상호명</label>
                    <input
                        type="text"
                        name="businessName"
                        value={info.businessName}
                        onChange={handleChange}
                        className="input"
                    />
                </div>
                <div className="form-group">
                    <label>대표자</label>
                    <input
                        type="text"
                        name="representative"
                        value={info.representative}
                        onChange={handleChange}
                        className="input"
                    />
                </div>
                <div className="form-group">
                    <label>사업자등록번호</label>
                    <input
                        type="text"
                        name="businessLicense"
                        value={info.businessLicense}
                        onChange={handleChange}
                        className="input"
                    />
                </div>
                <div className="form-group">
                    <label>주소</label>
                    <input
                        type="text"
                        name="address"
                        value={info.address}
                        onChange={handleChange}
                        className="input"
                    />
                </div>
                <div className="form-group">
                    <label>전화번호</label>
                    <input
                        type="text"
                        name="phone"
                        value={info.phone}
                        onChange={handleChange}
                        className="input"
                    />
                </div>
                <div className="form-group">
                    <label>이메일</label>
                    <input
                        type="email"
                        name="email"
                        value={info.email}
                        onChange={handleChange}
                        className="input"
                    />
                </div>
                <div className="form-group">
                    <label>통신판매업신고번호</label>
                    <input
                        type="text"
                        name="ecommerceLicense"
                        value={info.ecommerceLicense}
                        onChange={handleChange}
                        className="input"
                    />
                </div>
                <div className="form-group">
                    <label>카카오톡 고객센터 URL (예: https://pf.kakao.com/_example)</label>
                    <input
                        type="url"
                        name="kakaoUrl"
                        value={info.kakaoUrl}
                        onChange={handleChange}
                        className="input"
                        placeholder="https://..."
                    />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="submit" className="button">저장 (구글 시트 백업)</button>
                    <button
                        type="button"
                        className="button"
                        onClick={handleSyncFromSheet}
                        style={{ backgroundColor: '#28a745', borderColor: '#28a745' }}
                    >
                        구글 시트에서 불러오기
                    </button>
                </div>
                {message && <p style={{ marginTop: '10px', color: 'green' }}>{message}</p>}
            </form>

            <style jsx>{`
                .container { padding: 20px; max-width: 800px; margin: 0 auto; }
                .form-group { margin-bottom: 15px; }
                .form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
                .input { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
                .button { padding: 10px 20px; background-color: #0070f3; color: white; border: none; border-radius: 4px; cursor: pointer; }
                .button:hover { background-color: #0051a2; }
            `}</style>
        </div>
    );
}
