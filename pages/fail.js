import { useRouter } from 'next/router';
import Link from 'next/link';

export default function FailPage() {
    const router = useRouter();
    const { message, code } = router.query;

    return (
        <div className="container" style={{ textAlign: 'center', paddingTop: '100px' }}>
            <div className="card" style={{ maxWidth: '600px', margin: '0 auto', padding: '40px' }}>
                <h1 style={{ color: '#FF3B30', marginBottom: '20px' }}>결제 실패</h1>
                <p style={{ fontSize: '18px', marginBottom: '10px' }}>
                    {message || '결제 중 오류가 발생했습니다.'}
                </p>
                <p style={{ color: '#666', marginBottom: '40px' }}>
                    에러 코드: {code || 'UNKNOWN'}
                </p>

                <Link href="/order">
                    <button className="button" style={{ padding: '15px 40px', fontSize: '18px' }}>
                        다시 시도하기
                    </button>
                </Link>
            </div>
        </div>
    );
}
