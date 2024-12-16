import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useRouter } from 'next/router';

const AdminPage = () => {
    const [disabledDates, setDisabledDates] = useState([]);
    const [availableHours, setAvailableHours] = useState(null);
    const [showCurrentSettings, setShowCurrentSettings] = useState(false);
    const [settingsMessage, setSettingsMessage] = useState('');
    const [saveMessage, setSaveMessage] = useState('');
    const [showSaveMessage, setShowSaveMessage] = useState(false);
    const [reservationStartDate, setReservationStartDate] = useState(null);
    const [reservationEndDate, setReservationEndDate] = useState(null);
    const [holidays, setHolidays] = useState([]);
    const router = useRouter();

    const loadSettings = async () => {
        try {
            const response = await fetch('/api/settings');
            if (!response.ok) {
                throw new Error('설정을 불러오는데 실패했습니다');
            }
            const data = await response.json();
            setDisabledDates(data.disabledDates.map(date => new Date(date)));
            setHolidays(data.holidays.map(date => new Date(date)));
            
            // 기본값 설정
            const defaultSettings = {
                weekday: { start: "14", end: "22" },
                weekend: { start: "10", end: "17" },
                holiday: { start: "10", end: "17" },
                notice: "* 예약 가능 시간\n평일 - 오후 2시 ~ 오후 10시\n주말 - 오전 10시 ~ 오후 5시",
                sameDay: {
                    enabled: true,
                    minHoursAfter: 2
                }
            };

            setAvailableHours({
                ...defaultSettings,
                ...data.availableHours
            });

            // 초약 기간 설정
            if (data.reservationPeriod) {
                setReservationStartDate(data.reservationPeriod.startDate);
                setReservationEndDate(data.reservationPeriod.endDate);
            }
        } catch (error) {
            console.error('설정을 불러오는데 실패했습니다:', error);
            setAvailableHours({
                weekday: { start: "14", end: "22" },
                weekend: { start: "10", end: "17" },
                holiday: { start: "10", end: "17" },
                notice: "* 예약 가능 시간\n평일 - 오후 2시 ~ 오후 10시\n주말 - 오전 10시 ~ 오후 5시",
                sameDay: {
                    enabled: true,
                    minHoursAfter: 2
                }
            });
        }
    };

    useEffect(() => {
        // 페이지 로드 시 인증 상태 확인
        const checkAuth = async () => {
            try {
                const response = await fetch('/api/auth/check-auth');
                if (!response.ok) {
                    router.push('/');
                    return;
                }
                // 인증 성공 시에만 설정 로드
                await loadSettings();
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

    // availableHours가 로드되지 않았 때 로딩 표시
    if (!availableHours) {
        return <div>Loading...</div>;
    }

    const handleDateClick = (date) => {
        if (!date) return;

        const newDate = new Date(date);
        if (isNaN(newDate.getTime())) return;

        newDate.setHours(9, 0, 0, 0);
        
        setDisabledDates(prev => {
            const isDateDisabled = prev.some(d => {
                const disabled = new Date(d);
                disabled.setHours(9, 0, 0, 0);
                return disabled.getTime() === newDate.getTime();
            });
            return isDateDisabled
                ? prev.filter(d => {
                    const disabled = new Date(d);
                    disabled.setHours(9, 0, 0, 0);
                    return disabled.getTime() !== newDate.getTime();
                })
                : [...prev, newDate];
        });
    };

    const handleHourChange = (type, period, value) => {
        const hourValue = parseInt(value);
        if (isNaN(hourValue) || hourValue < 0 || hourValue > 23) return;

        setAvailableHours(prev => {
            const newHours = {
                ...prev,
                [type]: {
                    ...prev[type],
                    [period]: value
                }
            };

            if (period === 'start' && parseInt(newHours[type].start) > parseInt(newHours[type].end)) {
                return prev;
            }
            if (period === 'end' && parseInt(newHours[type].end) < parseInt(newHours[type].start)) {
                return prev;
            }

            return newHours;
        });
    };

    const handleNoticeChange = (value) => {
        setAvailableHours(prev => ({
            ...prev,
            notice: value
        }));
    };

    const tileClassName = ({ date }) => {
        const localDate = new Date(date);
        localDate.setHours(9, 0, 0, 0);
        
        // 예약 불가능 날짜 체크
        const isDisabled = disabledDates.some(disabledDate => {
            const disabled = new Date(disabledDate);
            disabled.setHours(9, 0, 0, 0);
            return disabled.getTime() === localDate.getTime();
        });

        // 예약 가능 기간 체크
        let isAvailable = false;
        if (reservationStartDate && reservationEndDate) {
            const start = new Date(reservationStartDate + 'T00:00:00+09:00');
            const end = new Date(reservationEndDate + 'T00:00:00+09:00');
            start.setHours(9, 0, 0, 0);
            end.setHours(9, 0, 0, 0);
            isAvailable = localDate >= start && localDate <= end;
        }

        return `${isDisabled ? 'disabled-date' : ''} ${isAvailable ? 'available-date' : ''}`.trim();
    };

    const formatDateForDisplay = (dateStr) => {
        if (!dateStr) return '';
        try {
            return new Date(dateStr).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
            });
        } catch (error) {
            console.error('날짜 형식 오류:', error);
            return '날짜 형식 오류';
        }
    };

    const checkCurrentSettings = async () => {
        try {
            const response = await fetch('/api/settings');
            const data = await response.json();
            
            // 현재 설정값들을 보기 좋게 포맷팅
            const disabledDatesStr = data.disabledDates.length > 0 
                ? data.disabledDates
                    .map(date => formatDateForDisplay(date))
                    .join('\n')
                : '없음';

            let reservationPeriodStr = '설정되지 않음';
            if (data.reservationPeriod?.startDate && data.reservationPeriod?.endDate) {
                reservationPeriodStr = `시작: ${formatDateForDisplay(data.reservationPeriod.startDate)}\n종료: ${formatDateForDisplay(data.reservationPeriod.endDate)}`;
            }

            const message = `
                [현재 설정 상태]

                ◆ 예약 기간 설정:
                ${reservationPeriodStr}

                ◆ 예약 불가능한 날짜:
                ${disabledDatesStr}

                ◆ 예약 가능 시간
                ▶ 평일: ${data.availableHours.weekday.start}:00 ~ ${data.availableHours.weekday.end}:00
                ▶ 주말: ${data.availableHours.weekend.start}:00 ~ ${data.availableHours.weekend.end}:00
                ▶ 공휴일: ${data.availableHours.holiday.start}:00 ~ ${data.availableHours.holiday.end}:00
            `;

            setSettingsMessage(message);
            setShowCurrentSettings(true);

            setTimeout(() => {
                setShowCurrentSettings(false);
                setSettingsMessage('');
            }, 5000);
        } catch (error) {
            console.error('설정 확인 중 오류:', error);
        }
    };

    const handleSaveSettings = async () => {
        try {
            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    disabledDates: disabledDates.map(d => {
                        const date = new Date(d);
                        date.setHours(9, 0, 0, 0);
                        return date.toISOString();
                    }),
                    holidays: holidays.map(d => {
                        const date = new Date(d);
                        date.setHours(9, 0, 0, 0);
                        return date.toISOString();
                    }),
                    availableHours,
                    reservationPeriod: {
                        startDate: reservationStartDate,
                        endDate: reservationEndDate
                    }
                })
            });

            if (response.ok) {
                setSaveMessage('설정이 성공적으로 저장되었습니다.');
                setShowSaveMessage(true);
                
                setTimeout(() => {
                    setShowSaveMessage(false);
                    setSaveMessage('');
                }, 500);
            } else {
                throw new Error('설정 저장에 실패했습니다.');
            }
        } catch (error) {
            setSaveMessage('설정 저장 중 오류가 발생했습니다.');
            setShowSaveMessage(true);
            setTimeout(() => {
                setShowSaveMessage(false);
                setSaveMessage('');
            }, 3000);
        }
    };

    const handleHolidayClick = (date) => {
        if (!date) return;

        const newDate = new Date(date);
        if (isNaN(newDate.getTime())) return;

        newDate.setHours(9, 0, 0, 0);
        
        setHolidays(prev => {
            const isHoliday = prev.some(d => {
                const holiday = new Date(d);
                holiday.setHours(9, 0, 0, 0);
                return holiday.getTime() === newDate.getTime();
            });
            return isHoliday
                ? prev.filter(d => {
                    const holiday = new Date(d);
                    holiday.setHours(9, 0, 0, 0);
                    return holiday.getTime() !== newDate.getTime();
                })
                : [...prev, newDate];
        });
    };

    const handleStartDateChange = (e) => {
        const newStartDate = e.target.value;
        setReservationStartDate(newStartDate);
        // 종료일이 시작일보다 이전이면 종료일 초기화
        if (reservationEndDate && new Date(reservationEndDate) < new Date(newStartDate)) {
            setReservationEndDate('');
        }
    };

    const handleEndDateChange = (e) => {
        const newEndDate = e.target.value;
        if (reservationStartDate && new Date(newEndDate) < new Date(reservationStartDate)) {
            alert('종료일은 시작일보다 이후여야 합니다.');
            return;
        }
        setReservationEndDate(newEndDate);
    };

    return (
        <div className="admin-container">
            <h1>관리자 페이지</h1>
            
            <div className="settings-check">
                <button 
                    className="check-button"
                    onClick={checkCurrentSettings}
                >
                    현재 설정 확인하기
                </button>
            </div>

            {showCurrentSettings && (
                <div className="settings-status">
                    <pre>{settingsMessage}</pre>
                </div>
            )}

            {showSaveMessage && (
                <div className="save-message-overlay">
                    <div className={`save-message-popup ${saveMessage.includes('성공') ? 'success' : 'error'}`}>
                        {saveMessage}
                    </div>
                </div>
            )}

            {/* 1. 예약 기간 설정 */}
            <div className="settings-section">
                <h2>예약 기간 설정</h2>
                <div className="period-settings">
                    <div className="date-picker-group">
                        <div className="date-picker">
                            <label>시작 날짜</label>
                            <input 
                                type="date"
                                value={reservationStartDate || ''}
                                onChange={handleStartDateChange}
                                min={new Date().toISOString().split('T')[0]}
                            />
                            {reservationStartDate && (
                                <small className="date-display">
                                    {formatDateForDisplay(reservationStartDate)}
                                </small>
                            )}
                        </div>
                        <div className="date-picker">
                            <label>종료 날짜</label>
                            <input 
                                type="date"
                                value={reservationEndDate || ''}
                                onChange={handleEndDateChange}
                                min={reservationStartDate || new Date().toISOString().split('T')[0]}
                            />
                            {reservationEndDate && (
                                <small className="date-display">
                                    {formatDateForDisplay(reservationEndDate)}
                                </small>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. 예약 가능 시간 설정 */}
            <div className="hours-section">
                <h2>예약 가능 시간 설정</h2>
                <div className="time-settings">
                    <div className="time-group">
                        <h3>평일</h3>
                        <div className="time-inputs">
                            <div className="time-input">
                                <label>시작 시</label>
                                <select 
                                    value={availableHours.weekday.start}
                                    onChange={(e) => handleHourChange('weekday', 'start', e.target.value)}
                                >
                                    {[...Array(24)].map((_, i) => (
                                        <option key={i} value={i}>{i}:00</option>
                                    ))}
                                </select>
                            </div>
                            <div className="time-input">
                                <label>종료 시간</label>
                                <select 
                                    value={availableHours.weekday.end}
                                    onChange={(e) => handleHourChange('weekday', 'end', e.target.value)}
                                >
                                    {[...Array(24)].map((_, i) => (
                                        <option key={i} value={i}>{i}:00</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="time-group">
                        <h3>주말</h3>
                        <div className="time-inputs">
                            <div className="time-input">
                                <label>시작 시간</label>
                                <select 
                                    value={availableHours.weekend.start}
                                    onChange={(e) => handleHourChange('weekend', 'start', e.target.value)}
                                >
                                    {[...Array(24)].map((_, i) => (
                                        <option key={i} value={i}>{i}:00</option>
                                    ))}
                                </select>
                            </div>
                            <div className="time-input">
                                <label>종료 시간</label>
                                <select 
                                    value={availableHours.weekend.end}
                                    onChange={(e) => handleHourChange('weekend', 'end', e.target.value)}
                                >
                                    {[...Array(24)].map((_, i) => (
                                        <option key={i} value={i}>{i}:00</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="time-group">
                        <h3>공휴일</h3>
                        <div className="time-inputs">
                            <div className="time-input">
                                <label>시작 시간</label>
                                <select 
                                    value={availableHours.holiday.start}
                                    onChange={(e) => handleHourChange('holiday', 'start', e.target.value)}
                                >
                                    {[...Array(24)].map((_, i) => (
                                        <option key={i} value={i}>{i}:00</option>
                                    ))}
                                </select>
                            </div>
                            <div className="time-input">
                                <label>종료 시간</label>
                                <select 
                                    value={availableHours.holiday.end}
                                    onChange={(e) => handleHourChange('holiday', 'end', e.target.value)}
                                >
                                    {[...Array(24)].map((_, i) => (
                                        <option key={i} value={i}>{i}:00</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* 당일 예약 설정 추가 */}
                    <div className="same-day-section">
                        <h2>당일 예약 설정</h2>
                        <div className="same-day-settings">
                            <div className="setting-row">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={availableHours.sameDay.enabled}
                                        onChange={(e) => setAvailableHours(prev => ({
                                            ...prev,
                                            sameDay: {
                                                ...prev.sameDay,
                                                enabled: e.target.checked
                                            }
                                        }))}
                                    />
                                    <span className="checkbox-text">당일 예약 허용</span>
                                </label>
                            </div>
                            {availableHours.sameDay.enabled && (
                                <div className="setting-row">
                                    <label>최소 예약 가능 시간</label>
                                    <select
                                        value={availableHours.sameDay.minHoursAfter}
                                        onChange={(e) => setAvailableHours(prev => ({
                                            ...prev,
                                            sameDay: {
                                                ...prev.sameDay,
                                                minHoursAfter: parseInt(e.target.value)
                                            }
                                        }))}
                                    >
                                        {[1, 2, 3, 4, 5, 6].map(hours => (
                                            <option key={hours} value={hours}>{hours}시간 후부터</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. 공휴일 설정 */}
            <div className="calendar-section">
                <h2>공휴일 설정</h2>
                <p>날짜를 클릭하여 공휴일을 추가/제거할 수 있습니다.</p>
                <Calendar
                    onChange={handleHolidayClick}
                    value={null}
                    tileClassName={({ date }) => {
                        const localDate = new Date(date);
                        localDate.setHours(9, 0, 0, 0);
                        
                        const isHoliday = holidays.some(holiday => {
                            const h = new Date(holiday);
                            h.setHours(9, 0, 0, 0);
                            return h.getTime() === localDate.getTime();
                        });

                        return isHoliday ? 'holiday-date' : '';
                    }}
                />
            </div>

            {/* 4. 예약 불가능한 날짜 설정 */}
            <div className="calendar-section">
                <h2>예약 불가능한 날짜 설정</h2>
                <p>날짜를 클릭하여 예약 가능/불가능을 토글할 수 있습니다.</p>
                <p className="calendar-notice">
                    * 초록색 바탕의 날짜들이 설정된 선택 가능한 날짜입니다
                </p>
                <Calendar
                    onChange={handleDateClick}
                    value={null}
                    tileClassName={tileClassName}
                />
            </div>

            {/* 5. 예약 시간 및 주의사항 안내문구 */}
            <div className="notice-section">
                <h2>예약 시간 및 주의사항 안내문구</h2>
                <textarea
                    value={availableHours.notice || ''}
                    onChange={(e) => handleNoticeChange(e.target.value)}
                    placeholder="예약 시간 및 주의사항 안내문구를 입력하세요"
                    rows={4}
                    className="notice-textarea"
                />
            </div>

            {/* 설정 저장 버튼 */}
            <div className="save-settings-bottom">
                <button 
                    className="save-button"
                    onClick={handleSaveSettings}
                >
                    설정 저장하기
                </button>
            </div>

            <div className="admin-access">
                <button 
                    className="main-button"
                    onClick={() => router.push('/admin')}
                >
                    관리자 페이지로 돌아가기
                </button>
            </div>

            <style jsx>{`
                .admin-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                }

                h1 {
                    text-align: center;
                    margin-bottom: 30px;
                    color: #333;
                }

                h2 {
                    color: #444;
                    margin-bottom: 20px;
                }

                .settings-container {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 40px;
                    margin-bottom: 30px;
                }

                .calendar-section, .hours-section {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                .time-settings {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .time-group {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                }

                .time-inputs {
                    display: flex;
                    gap: 20px;
                    margin-top: 10px;
                }

                .time-input {
                    flex: 1;
                }

                label {
                    display: block;
                    margin-bottom: 5px;
                    color: #666;
                }

                select {
                    width: 100%;
                    padding: 8px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 1rem;
                }

                .back-button {
                    display: block;
                    margin: 20px auto;
                    padding: 10px 20px;
                    background-color: #007bff;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 1rem;
                }

                .back-button:hover {
                    background-color: #0056b3;
                }

                @media (max-width: 768px) {
                    .settings-container {
                        grid-template-columns: 1fr;
                    }

                    .time-inputs {
                        flex-direction: column;
                    }
                }

                .settings-check {
                    display: flex;
                    justify-content: center;
                    gap: 20px;
                    margin: 20px 0;
                }

                .check-button {
                    background-color: #4CAF50;
                    color: white;
                    padding: 10px 20px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 1rem;
                    transition: background-color 0.3s;
                }

                .check-button:hover {
                    background-color: #45a049;
                }

                .save-button {
                    background-color: #007bff;
                    color: white;
                    padding: 10px 20px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 1rem;
                    transition: background-color 0.3s;
                }

                .save-button:hover {
                    background-color: #0056b3;
                }

                .save-message {
                    max-width: 600px;
                    margin: 20px auto;
                    padding: 15px;
                    border-radius: 4px;
                    text-align: center;
                    animation: fadeIn 0.3s ease-in;
                }

                .save-message.success {
                    background-color: #d4edda;
                    color: #155724;
                    border: 1px solid #c3e6cb;
                }

                .save-message.error {
                    background-color: #f8d7da;
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                }

                .settings-status {
                    max-width: 600px;
                    margin: 20px auto;
                    padding: 20px;
                    background-color: #f8f9fa;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    animation: fadeIn 0.3s ease-in;
                }

                .settings-status pre {
                    white-space: pre-wrap;
                    font-family: inherit;
                    margin: 0;
                    line-height: 1.6;
                }

                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .notice-setting {
                    margin-top: 20px;
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                }

                .notice-textarea {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 0.9rem;
                    resize: vertical;
                    min-height: 100px;
                    margin-top: 10px;
                }

                .notice-textarea:focus {
                    outline: none;
                    border-color: #007bff;
                    box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
                }

                .same-day-settings {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                    padding: 10px;
                }

                .setting-row {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .checkbox-label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                }

                .checkbox-label input[type="checkbox"] {
                    width: 16px;
                    height: 16px;
                    cursor: pointer;
                }

                .setting-row select {
                    padding: 8px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 1rem;
                }

                .settings-section {
                    margin: 20px 0;
                    padding: 20px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                
                .period-type-buttons {
                    display: flex;
                    gap: 10px;
                    margin-top: 15px;
                }
                
                .period-button {
                    padding: 10px 20px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    background: white;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .period-button.active {
                    background: #1a73e8;
                    color: white;
                    border-color: #1a73e8;
                }
                
                .period-button:hover {
                    background: #f5f5f5;
                }
                
                .period-button.active:hover {
                    background: #1557b0;
                }

                .period-settings {
                    margin-top: 20px;
                    padding: 20px;
                    background: #f8f9fa;
                    border-radius: 8px;
                }

                .date-picker-group {
                    display: flex;
                    gap: 20px;
                    margin-bottom: 15px;
                }

                .date-picker {
                    flex: 1;
                }

                .date-picker label, .setting-row label {
                    display: block;
                    margin-bottom: 8px;
                    color: #666;
                    font-size: 0.9rem;
                }

                .date-picker input[type="date"] {
                    width: 100%;
                    padding: 8px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 1rem;
                }

                .setting-row {
                    margin-bottom: 15px;
                }

                .setting-row select {
                    width: 100%;
                    padding: 8px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 1rem;
                }

                .next-extension-info {
                    margin-top: 15px;
                    padding: 10px;
                    background: #e3f2fd;
                    border-radius: 4px;
                    color: #1976d2;
                    font-size: 0.9rem;
                }

                @media (max-width: 768px) {
                    .date-picker-group {
                        flex-direction: column;
                        gap: 15px;
                    }
                }

                .save-settings-bottom {
                    margin-top: 30px;
                    text-align: center;
                    padding: 20px;
                }

                .save-button {
                    padding: 15px 30px;
                    font-size: 1.1rem;
                    background-color: #1a73e8;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: background-color 0.3s ease;
                }

                .save-button:hover {
                    background-color: #1557b0;
                }

                .save-message-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                }

                .save-message-popup {
                    background: white;
                    padding: 20px 40px;
                    border-radius: 8px;
                    font-size: 1.2rem;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }

                .save-message-popup.success {
                    border-left: 5px solid #4caf50;
                }

                .save-message-popup.error {
                    border-left: 5px solid #f44336;
                }

                .same-day-section {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    margin: 20px 0;
                }

                .same-day-section h2 {
                    margin-bottom: 20px;
                    color: #333;
                    font-size: 1.5rem;
                }

                .checkbox-label {
                    display: flex;
                    align-items: center;
                    font-size: 1.2rem;
                    cursor: pointer;
                }

                .checkbox-label input[type="checkbox"] {
                    width: 24px;
                    height: 24px;
                    margin-right: 12px;
                    cursor: pointer;
                }

                .checkbox-text {
                    font-size: 1.2rem;
                    color: #333;
                }

                .setting-row {
                    padding: 15px;
                    background: #f8f9fa;
                    border-radius: 6px;
                }

                .calendar-notice {
                    color: #666;
                    font-size: 0.9rem;
                    margin-bottom: 10px;
                    font-style: italic;
                }

                .auto-settings-notice {
                    background-color: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    color: #666;
                    font-size: 0.9rem;
                    line-height: 1.6;
                    margin: 15px 0;
                    border-left: 4px solid #1a73e8;
                }

                .same-day-section {
                    margin-top: 20px;
                    padding: 20px;
                    background-color: #f8f9fa;
                    border-radius: 8px;
                }

                .same-day-settings {
                    margin-top: 10px;
                }

                .checkbox-label {
                    display: flex;
                    align-items: center;
                    cursor: pointer;
                }

                .checkbox-text {
                    margin-left: 8px;
                }

                .setting-row {
                    display: flex;
                    align-items: center;
                    margin-top: 10px;
                    gap: 10px;
                }

                .setting-row label {
                    min-width: 150px;
                }

                .setting-row select {
                    padding: 8px;
                    border-radius: 4px;
                    border: 1px solid #ddd;
                }
            `}</style>

            <style jsx global>{`
                .disabled-date {
                    background-color: #ffebee !important;
                    color: #d32f2f !important;
                }

                .disabled-date:hover {
                    background-color: #ffcdd2 !important;
                }

                .react-calendar {
                    width: 100% !important;
                    border: none !important;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                .react-calendar__tile {
                    padding: 10px 6px;
                    height: auto;
                }

                .react-calendar__tile:enabled:hover {
                    background-color: #e6e6e6;
                }

                .available-date {
                    background-color: #e8f5e9 !important;
                    position: relative;
                }

                .available-date:hover {
                    background-color: #c8e6c9 !important;
                }

                .available-date.disabled-date {
                    background-color: #ffebee !important;
                }

                .available-date.disabled-date:hover {
                    background-color: #ffcdd2 !important;
                }

                .holiday-date {
                    background-color: #ffebee !important;
                    color: #d32f2f !important;
                }

                .holiday-date:hover {
                    background-color: #ffcdd2 !important;
                }
            `}</style>
        </div>
    );
};

export default AdminPage; 