import React from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const ReservationCalendar = ({ onDateSelect, selectedDate, disabledDates, availableHours, reservationPeriod, holidays }) => {
    const isDateAvailable = (date) => {
        const localDate = new Date(date);
        localDate.setHours(9, 0, 0, 0);  // UTC+9

        if (reservationPeriod?.startDate && reservationPeriod?.endDate) {
            const start = new Date(reservationPeriod.startDate);
            const end = new Date(reservationPeriod.endDate);
            start.setHours(9, 0, 0, 0);
            end.setHours(9, 0, 0, 0);
            return localDate >= start && localDate <= end;
        }
        return false;  // 예약 기간이 설정되지 않은 경우 예약 불가
    };

    // 공휴일 체크 함수 추가
    const isHoliday = (date) => {
        const localDate = new Date(date);
        localDate.setHours(9, 0, 0, 0);
        
        return holidays?.some(holiday => {
            const h = new Date(holiday);
            h.setHours(9, 0, 0, 0);
            return h.getTime() === localDate.getTime();
        }) || false;
    };

    // 오늘 날짜 기준으로 예약 가능 날짜 설정
    const today = new Date();
    today.setHours(9, 0, 0, 0);
    
    const minDate = availableHours?.sameDay?.enabled ? today : (() => {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow;
    })();

    return (
        <div>
            <Calendar
                onChange={onDateSelect}
                value={selectedDate}
                minDate={minDate}
                tileDisabled={({ date }) => {
                    const localDate = new Date(date);
                    localDate.setHours(9, 0, 0, 0);
                    
                    // 예약 불가능 날짜 체크
                    const isDisabled = disabledDates.some(disabledDate => {
                        const disabled = new Date(disabledDate);
                        disabled.setHours(9, 0, 0, 0);
                        return disabled.getTime() === localDate.getTime();
                    });

                    // 예약 가능 기간 체크
                    const isNotAvailable = !isDateAvailable(date);

                    return isDisabled || isNotAvailable;
                }}
                tileClassName={({ date }) => {
                    const localDate = new Date(date);
                    localDate.setHours(9, 0, 0, 0);
                    
                    const isDisabled = disabledDates.some(disabledDate => {
                        const disabled = new Date(disabledDate);
                        disabled.setHours(9, 0, 0, 0);
                        return disabled.getTime() === localDate.getTime();
                    });

                    const isAvailable = isDateAvailable(date);
                    const dateIsHoliday = isHoliday(date);

                    return `${isDisabled ? 'disabled-date' : ''} ${isAvailable ? 'available-date' : ''} ${dateIsHoliday ? 'holiday-date' : ''}`.trim();
                }}
            />
            <style jsx global>{`
                /* 모든 날짜를 검정색으로 설정 */
                .react-calendar__tile {
                    color: #000 !important;
                }

                /* 선택 불가능한 날짜 스타일 */
                .react-calendar__tile:disabled {
                    color: #ccc !important;
                    background-color: #f0f0f0;
                    cursor: not-allowed;
                }

                /* 이웃한 달의 날짜 스타일 */
                .react-calendar__month-view__days__day--neighboringMonth {
                    color: #ccc !important;
                }

                /* 예약 가능한 날짜 스타일 */
                .available-date:not(:disabled) {
                    color: #000 !important;
                    font-weight: normal;
                }

                /* 토요일 스타일 (6번째 열) */
                .available-date:not(:disabled).react-calendar__month-view__days__day:nth-child(7n+6) {
                    color: #1a73e8 !important;
                }

                /* 일요일 스타일 (7번째 열) */
                .available-date:not(:disabled).react-calendar__month-view__days__day:nth-child(7n) {
                    color: #d32f2f !important;
                }

                /* 예약 불가능한 날짜 스타일 */
                .disabled-date {
                    background-color: #ffebee !important;
                    color: #d32f2f !important;
                }

                /* 공휴일 스타일 추가 */
                .holiday-date:not(:disabled) {
                    color: #d32f2f !important;
                }

                /* 선택 불가능한 날짜는 모두 회색으로 */
                .react-calendar__tile:disabled,
                .react-calendar__month-view__days__day--neighboringMonth:disabled {
                    color: #ccc !important;
                    background-color: #f0f0f0 !important;
                }
            `}</style>
        </div>
    );
};

export default ReservationCalendar;
