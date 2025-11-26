import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Modal from '../../components/Modal';

export default function AdminPages() {
    const router = useRouter();
    const [pages, setPages] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        path: '',
        title: ''
    });

    useEffect(() => {
        checkAuth();
        fetchPages();
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

    const fetchPages = async () => {
        try {
            const response = await fetch('/api/pages/list');
            const data = await response.json();
            setPages(data);
        } catch (error) {
            console.error('페이지 로딩 실패:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch('/api/pages/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                fetchPages();
                setIsModalOpen(false);
                setFormData({ path: '', title: '' });
            }
        } catch (error) {
            console.error('페이지 생성 실패:', error);
        }
    };

    const handleDelete = async (path) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;

        try {
            const response = await fetch(`/api/pages/${path}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                fetchPages();
            }
        } catch (error) {
            console.error('삭제 실패:', error);
        }
    };

    return (
        <div className="container">
            <h1>페이지 관리</h1>

            <div style={{ marginTop: '20px' }}>
                <button className="button" onClick={() => setIsModalOpen(true)}>
                    새 페이지 생성
                </button>
                <Link href="/admin">
                    <button className="button" style={{ backgroundColor: '#666', borderColor: '#666' }}>
                        관리자 페이지로
                    </button>
                </Link>
            </div>

            <div style={{ marginTop: '40px' }}>
                {pages.length === 0 ? (
                    <p>생성된 페이지가 없습니다.</p>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>경로</th>
                                <th>제목</th>
                                <th>작업</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pages.map(page => (
                                <tr key={page.path}>
                                    <td>/{page.path}</td>
                                    <td>{page.title}</td>
                                    <td>
                                        <Link href={`/${page.path}`}>
                                            <button
                                                className="button"
                                                style={{ padding: '6px 12px', fontSize: '14px', backgroundColor: '#28a745', borderColor: '#28a745' }}
                                            >
                                                보기
                                            </button>
                                        </Link>
                                        <button
                                            className="button"
                                            onClick={() => handleDelete(page.path)}
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

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="새 페이지 생성">
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="페이지 경로 (예: about)"
                        className="input"
                        value={formData.path}
                        onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                        required
                    />
                    <input
                        type="text"
                        placeholder="페이지 제목"
                        className="input"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                    />
                    <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
                        페이지를 생성한 후, 해당 페이지로 이동하여 컨텐츠를 편집할 수 있습니다.
                    </p>
                    <button type="submit" className="button">
                        생성
                    </button>
                </form>
            </Modal>
        </div>
    );
}
