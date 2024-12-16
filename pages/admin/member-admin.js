import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const getKSTDate = (date = new Date()) => {
    const kstOffset = 9 * 60;
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    return new Date(utc + (kstOffset * 60000));
};

const MemberAdminPage = () => {
    const [name, setName] = useState('');
    const [memberId, setMemberId] = useState('');
    const [message, setMessage] = useState('');
    const [showMessage, setShowMessage] = useState(false);
    const [messageType, setMessageType] = useState('');
    const router = useRouter();

    const today = getKSTDate();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    firstDay.setHours(0, 0, 0, 0);
    lastDay.setHours(23, 59, 59, 999);

    const [startDate, setStartDate] = useState(firstDay.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(lastDay.toISOString().split('T')[0]);
    const [statistics, setStatistics] = useState([]);
    const [statisticsError, setStatisticsError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState('');

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

        // 페이지 이탈 시 이벤트 리스너
        const handleBeforeUnload = () => {
            fetch('/api/auth/logout');
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [router]);

    const fetchStatistics = async () => {
        if (new Date(startDate) > new Date(endDate)) {
            setStatisticsError('시작일이 종료일보다 늦을 수 없습니다.');
            return;
        }

        setIsLoading(true);
        try {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            const response = await fetch(
                `/api/members/statistics?startDate=${start.toISOString()}&endDate=${end.toISOString()}&searchKeyword=${searchKeyword}`
            );
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || '통계 조회 실패');
            }
            
            setStatistics(data);
            setStatisticsError('');
        } catch (error) {
            setStatisticsError(error.message);
            setStatistics({ total: 0, members: [] });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const response = await fetch('/api/members', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, memberId }),
            });

            const data = await response.json();
            
            setMessageType(response.ok ? 'success' : 'error');
            setMessage(data.message);
            setShowMessage(true);

            if (response.ok) {
                setName('');
                setMemberId('');
                setTimeout(() => {
                    setShowMessage(false);
                    setMessage('');
                }, 3000);
            }
        } catch (error) {
            setMessageType('error');
            setMessage('회원 추가 중 오류가 발생했습니다.');
            setShowMessage(true);
        }
    };

    const handleDateChange = (e, isStart) => {
        const date = new Date(e.target.value);
        if (isStart) {
            date.setHours(0, 0, 0, 0);
            setStartDate(date.toISOString().split('T')[0]);
        } else {
            date.setHours(23, 59, 59, 999);
            setEndDate(date.toISOString().split('T')[0]);
        }
    };

    return (
        <div className="container">
            <h1>유효회원 관리</h1>
            
            <div className="form-section">
                <h2>회원 추가</h2>
                <form onSubmit={handleSubmit} className="member-form">
                    <div className="input-group">
                        <input
                            type="text"
                            placeholder="회원 이름"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                        <input
                            type="text"
                            placeholder="회원번호 (4자리)"
                            value={memberId}
                            onChange={(e) => setMemberId(e.target.value)}
                            maxLength={4}
                            pattern="\d{4}"
                            required
                        />
                    </div>
                    <button type="submit" className="submit-button">
                        회원 추가
                    </button>
                </form>
            </div>

            <div className="form-section">
                <h2>회원별 예약 통계</h2>
                <div className="statistics-form">
                    <div className="search-controls">
                        <div className="date-input-group">
                            <div className="date-input">
                                <label>시작일</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => handleDateChange(e, true)}
                                />
                            </div>
                            <div className="date-input">
                                <label>종료일</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => handleDateChange(e, false)}
                                />
                            </div>
                        </div>
                        <div className="search-input-group">
                            <input
                                type="text"
                                placeholder="회원 이름 또는 회원번호로 검색 (미입력시 전체조회)"
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                className="search-input"
                            />
                            <button 
                                onClick={fetchStatistics}
                                disabled={isLoading}
                                className="search-button"
                            >
                                {isLoading ? '조회중...' : '조회'}
                            </button>
                        </div>
                    </div>

                    {statisticsError && (
                        <div className="error-message">{statisticsError}</div>
                    )}

                    {!statisticsError && statistics.members && statistics.members.length === 0 && (
                        <div className="no-results">검색 결과가 없습니다.</div>
                    )}

                    {statistics.members && statistics.members.length > 0 && (
                        <div className="statistics-table">
                            <div className="total-reservations">
                                전체 예약 횟수: {statistics.total}회
                            </div>
                            <table>
                                <thead>
                                    <tr>
                                        <th>회원명</th>
                                        <th>회원번호</th>
                                        <th>예약 횟수</th>
                                        <th>예약 상세</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {statistics.members.map((stat) => (
                                        <tr key={stat.memberId}>
                                            <td>{stat.name}</td>
                                            <td>{stat.memberId}</td>
                                            <td>{stat.count}</td>
                                            <td>
                                                {stat.reservations.map((reservation, index) => (
                                                    <div key={index} className="reservation-detail">
                                                        {reservation.date} {reservation.time}
                                                    </div>
                                                ))}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {showMessage && (
                <div className={`message ${messageType}`}>
                    {message}
                </div>
            )}

            <div className="button-group">
                <button 
                    onClick={() => router.push('/admin')}
                    className="back-button"
                >
                    관리자 페이지로 돌아가기
                </button>
            </div>

            <style jsx>{`
                .container {
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                }

                h1 {
                    text-align: center;
                    color: #333;
                    margin-bottom: 30px;
                }

                .form-section {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    margin-bottom: 20px;
                }

                h2 {
                    color: #444;
                    margin-bottom: 20px;
                }

                .member-form {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .input-group {
                    display: flex;
                    gap: 10px;
                }

                input {
                    flex: 1;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 1rem;
                }

                .submit-button {
                    padding: 12px;
                    background-color: #1a73e8;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 1rem;
                    transition: background-color 0.3s;
                }

                .submit-button:hover {
                    background-color: #1557b0;
                }

                .message {
                    padding: 15px;
                    border-radius: 4px;
                    margin: 20px 0;
                    text-align: center;
                }

                .message.success {
                    background-color: #d4edda;
                    color: #155724;
                    border: 1px solid #c3e6cb;
                }

                .message.error {
                    background-color: #f8d7da;
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                }

                .button-group {
                    display: flex;
                    justify-content: center;
                    margin-top: 20px;
                }

                .back-button {
                    padding: 10px 20px;
                    background-color: #6c757d;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.9rem;
                    transition: background-color 0.3s;
                }

                .back-button:hover {
                    background-color: #5a6268;
                }

                @media (max-width: 768px) {
                    .input-group {
                        flex-direction: column;
                    }
                }

                .statistics-form {
                    margin-top: 20px;
                }

                .statistics-table {
                    margin-top: 20px;
                    overflow-x: auto;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 10px;
                }

                th, td {
                    padding: 12px;
                    text-align: left;
                    border-bottom: 1px solid #ddd;
                }

                th {
                    background-color: #f8f9fa;
                    font-weight: bold;
                }

                tr:hover {
                    background-color: #f5f5f5;
                }

                .error-message {
                    color: #dc3545;
                    margin-top: 10px;
                    padding: 10px;
                    background-color: #f8d7da;
                    border-radius: 4px;
                }

                .date-input-group {
                    display: flex;
                    gap: 15px;
                    align-items: flex-end;
                    margin-bottom: 20px;
                }

                .date-input {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }

                .date-input label {
                    font-size: 0.9rem;
                    color: #666;
                }

                .date-input input {
                    padding: 8px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 1rem;
                }

                .search-controls {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                    margin-bottom: 20px;
                }

                .search-input-group {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                }

                .search-input {
                    flex: 1;
                    padding: 8px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 1rem;
                    min-width: 300px;
                }

                .button-group {
                    display: flex;
                    gap: 10px;
                }

                .search-button {
                    padding: 8px 20px;
                    height: 38px;
                    background-color: #1a73e8;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 1rem;
                    transition: all 0.3s ease;
                    white-space: nowrap;
                }

                @media (max-width: 768px) {
                    .search-input {
                        min-width: auto;
                    }
                }

                .no-results {
                    text-align: center;
                    padding: 20px;
                    background-color: #f8f9fa;
                    border-radius: 4px;
                    color: #666;
                    margin-top: 20px;
                }

                .reservation-detail {
                    font-size: 0.9rem;
                    color: #666;
                    padding: 2px 0;
                }

                .statistics-table td {
                    vertical-align: top;
                    padding: 12px;
                }

                .statistics-table td:first-child {
                    white-space: nowrap;
                    min-width: 60px;
                }

                @media (max-width: 768px) {
                    .statistics-table {
                        font-size: 0.9rem;
                    }

                    .statistics-table td {
                        padding: 8px;
                    }

                    .statistics-table td:first-child {
                        min-width: 54px;
                    }

                    .reservation-detail {
                        font-size: 0.85rem;
                    }
                }

                @media (max-width: 480px) {
                    .statistics-table {
                        font-size: 0.85rem;
                    }

                    .statistics-table td:first-child {
                        min-width: 51px;
                    }
                }

                .total-reservations {
                    background-color: #f8f9fa;
                    padding: 12px;
                    margin-bottom: 16px;
                    border-radius: 8px;
                    font-weight: bold;
                    color: #1a73e8;
                    text-align: right;
                }
            `}</style>
        </div>
    );
};

export default MemberAdminPage; 