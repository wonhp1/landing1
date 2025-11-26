import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function AdminChangePassword() {
    const router = useRouter();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

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
            router.push('/');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (newPassword !== confirmPassword) {
            setError('새 비밀번호가 일치하지 않습니다.');
            return;
        }

        try {
            const response = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('비밀번호가 변경되었습니다.');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                setError(data.error || '비밀번호 변경에 실패했습니다.');
            }
        } catch (error) {
            console.error('비밀번호 변경 실패:', error);
            setError('비밀번호 변경 중 오류가 발생했습니다.');
        }
    };

    return (
        <div className="container">
            <h1>비밀번호 변경</h1>

            <div style={{ marginTop: '20px' }}>
                <Link href="/admin">
                    <button className="button" style={{ backgroundColor: '#666', borderColor: '#666' }}>
                        관리자 페이지로
                    </button>
                </Link>
            </div>

            <div className="card" style={{ marginTop: '40px', maxWidth: '500px' }}>
                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        placeholder="현재 비밀번호"
                        className="input"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="새 비밀번호"
                        className="input"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="새 비밀번호 확인"
                        className="input"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                    <button type="submit" className="button">
                        비밀번호 변경
                    </button>
                    {message && <p style={{ color: 'green', marginTop: '10px' }}>{message}</p>}
                    {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
                </form>
            </div>
        </div>
    );
}
