export const calculateAutoExtendDates = (startDate, baseDay, weeks) => {
    if (!startDate || baseDay === undefined || !weeks) {
        throw new Error('필수 파라미터가 누락되었습니다');
    }

    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
        throw new Error('잘못된 시작 날짜 형식입니다');
    }

    start.setHours(0, 0, 0, 0);

    // 시작 날짜가 포함된 주의 기준요일까지
    const firstPeriodEnd = new Date(start);
    const daysUntilBaseDay = (baseDay - start.getDay() + 7) % 7;
    firstPeriodEnd.setDate(start.getDate() + daysUntilBaseDay);

    // 기준요일로부터 지정된 주 수만큼
    const finalEnd = new Date(firstPeriodEnd);
    finalEnd.setDate(finalEnd.getDate() + (7 * weeks));

    // 예약 가능한 날짜 범위 계산
    const availableDates = [];
    let currentDate = new Date(start);
    
    while (currentDate <= finalEnd) {
        availableDates.push(formatDate(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
        startDate: formatDate(start),
        firstPeriodEnd: formatDate(firstPeriodEnd),
        finalEnd: formatDate(finalEnd),
        availableDates,
        nextExtensionDate: formatDate(new Date(finalEnd.getTime() - (7 * 24 * 60 * 60 * 1000)))
    };
};

export const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}; 