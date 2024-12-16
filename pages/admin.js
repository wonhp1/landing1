import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../styles/index.module.css';

const Admin = () => {
    const router = useRouter();

    useEffect(() => {
        // 페이지 로드 시 인증 상태 확인
        const checkAuth = async () => {
            try {
                const response = await fetch('/api/auth/check-auth');
                if (!response.ok) {
                    router.push('/');
                    return;
                }
            } catch (error) {
                console.error('Authentication check failed:', error);
                router.push('/');
            }
        };

        checkAuth();

        // 뒤로가기 감지 및 처리
        const handlePopState = () => {
            checkAuth();
        };

        window.addEventListener('popstate', handlePopState);

        // 페이지 이탈 시 이벤트 리스너
        const handleBeforeUnload = () => {
            fetch('/api/auth/logout');
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        // 페이지 숨김/표시 감지
        const handleVisibilityChange = () => {
            if (document.hidden) {
                handleBeforeUnload();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('popstate', handlePopState);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [router]);

    return (
        <div>
            <div>
                <h1>관리자 페이지</h1>
            </div>
            
            <div className={styles.buttonContainer}>
                <Link href="/admin/reservation-admin">
                    <button className={styles.button}>예약 관리</button>
                </Link>
                <Link href="/admin/member-admin">
                    <button className={styles.button}>유효회원 관리</button>
                </Link>
                <Link href="/admin/intro-settings">
                    <button className={styles.button}>소개 페이지 관리</button>
                </Link>
                
                <div className={styles.adminNavigationButtons}>
                    <Link href="/">
                        <button className={`${styles.button} ${styles.greenButton}`}>
                            메인 페이지로 돌아가기
                        </button>
                    </Link>
                    <Link href="/api/auth/logout">
                        <button className={`${styles.button} ${styles.redButton}`}>
                            로그아웃
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Admin;