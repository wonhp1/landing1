import fs from 'fs';
import path from 'path';

const settingsPath = path.join(process.cwd(), 'data', 'settings.json');
const lockFile = path.join(process.cwd(), 'data', 'settings.lock');

// Lock 파일 정리 추가 (파일 최상단)
if (fs.existsSync(lockFile)) {
    fs.unlinkSync(lockFile);
}

// 텔레그램 알림 전송 함수
const sendTelegramNotification = async (message) => {
    try {
        if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
            console.error('텔레그램 설정이 없습니다.');
            return;
        }

        const response = await fetch(
            `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: process.env.TELEGRAM_CHAT_ID,
                    text: message,
                    parse_mode: 'HTML'
                }),
            }
        );

        if (!response.ok) {
            throw new Error('텔레그램 알림 전송 실패');
        }
    } catch (error) {
        console.error('텔레그램 알림 전송 중 오류:', error);
    }
};

// formatDate 유틸리티 함수 추가
const formatDate = (dateStr) => {
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

// 디렉토리와 파일 생성 함수 분리
const initializeSettings = () => {
    try {
        // data 디렉토리가 없으면 생성
        const dataDir = path.join(process.cwd(), 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        // settings.json 파일이 없으면 생성
        if (!fs.existsSync(settingsPath)) {
            const initialSettings = {
                disabledDates: [],
                holidays: [],
                availableHours: {
                    weekday: { start: "14", end: "22" },
                    weekend: { start: "10", end: "17" },
                    holiday: { start: "10", end: "17" },
                    notice: "* 예약 가능 시간\n평일 - 오후 2시 ~ 오후 10시\n주말 - 오전 10시 ~ 오후 5시",
                    sameDay: {
                        enabled: true,
                        minHoursAfter: 2
                    }
                },
                reservationPeriod: {
                    startDate: null,
                    endDate: null
                }
            };
            fs.writeFileSync(settingsPath, JSON.stringify(initialSettings, null, 2));
        }
        return true;
    } catch (error) {
        console.error('설정 파일 초기화 중 오류:', error);
        return false;
    }
};

const acquireLock = () => {
    try {
        if (fs.existsSync(lockFile)) {
            return false;
        }
        fs.writeFileSync(lockFile, '1');
        return true;
    } catch (error) {
        return false;
    }
};

const releaseLock = () => {
    try {
        if (fs.existsSync(lockFile)) {
            fs.unlinkSync(lockFile);
        }
    } catch (error) {
        console.error('Lock 파일 제거 실패:', error);
    }
};

// checkManualPeriodExpiration 함수 수정
const checkManualPeriodExpiration = (settings) => {
    if (settings.reservationPeriod?.endDate) {
        const endDate = new Date(settings.reservationPeriod.endDate);
        endDate.setHours(9, 0, 0, 0);
        const now = new Date();
        now.setHours(9, 0, 0, 0);
        const daysUntilExpiration = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
        
        // 7일(1주일) 전 알림
        if (daysUntilExpiration === 7) {
            sendTelegramNotification(
                '⚠️ 예약 기간 만료 1주일 전 알림\n\n' +
                `만료일: ${formatDate(settings.reservationPeriod.endDate)}\n` +
                `남은 기간: 7일`
            );
        }
        
        // 3일 전 알림
        if (daysUntilExpiration <= 3 && daysUntilExpiration > 0) {
            sendTelegramNotification(
                '⚠️ 예약 기간 만료 임박\n\n' +
                `만료일: ${formatDate(settings.reservationPeriod.endDate)}\n` +
                `남은 기간: ${daysUntilExpiration}일`
            );
        }
        
        // 만료일 당일 알림
        if (daysUntilExpiration === 0) {
            sendTelegramNotification(
                '🚨 예약 기간이 오늘 만료됩니다\n\n' +
                `만료일: ${formatDate(settings.reservationPeriod.endDate)}`
            );
        }
    }
};

export default async function handler(req, res) {
    const isInitialized = initializeSettings();
    if (!isInitialized) {
        return res.status(500).json({ error: '설정 초기화에 실패했습니다.' });
    }

    if (req.method === 'GET') {
        try {
            const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
            
            // 수동 설정 만료 체크 추가
            await checkManualPeriodExpiration(settings);
            
            res.status(200).json(settings);
        } catch (error) {
            console.error('설정 로드 중 오류:', error);
            // settings.json 복구 시도
            initializeSettings();
            res.status(500).json({ error: '설정을 불러오는데 실패했습니다.' });
        }
    } else if (req.method === 'POST') {
        if (!acquireLock()) {
            return res.status(423).json({ error: '다른 요청이 처리 중입니다.' });
        }
        
        try {
            const newSettings = req.body;
            
            // 1. 기본 데이터 구조 검증
            if (!newSettings.availableHours || 
                !Array.isArray(newSettings.disabledDates) || 
                !Array.isArray(newSettings.holidays)) {
                throw new Error('잘못된 설정 데이터 형식');
            }

            // 2. availableHours 상세 검증
            const { weekday, weekend, holiday, sameDay, notice } = newSettings.availableHours;
            if (!weekday?.start || !weekday?.end || 
                !weekend?.start || !weekend?.end || 
                !holiday?.start || !holiday?.end ||
                !sameDay || !notice) {
                throw new Error('예약 시간 설정이 올바르지 않습니다');
            }

            // 3. 시간 값 범위 검증
            const validateHour = (hour) => {
                const h = parseInt(hour);
                return !isNaN(h) && h >= 0 && h <= 23;
            };

            if (!validateHour(weekday.start) || !validateHour(weekday.end) ||
                !validateHour(weekend.start) || !validateHour(weekend.end) ||
                !validateHour(holiday.start) || !validateHour(holiday.end)) {
                throw new Error('잘못된 시간 값이 포함되어 있습니다');
            }

            // 4. disabledDates 검증
            for (const date of newSettings.disabledDates) {
                if (isNaN(new Date(date).getTime())) {
                    throw new Error('잘못된 예약 불가 날짜가 포함되어 있습니다');
                }
            }

            // 5. holidays 검증
            for (const date of newSettings.holidays) {
                if (isNaN(new Date(date).getTime())) {
                    throw new Error('잘못된 공휴일 날짜가 포함되어 있습니다');
                }
            }

            // 6. reservationPeriod 검증
            if (newSettings.reservationPeriod) {
                const { type, manual, auto } = newSettings.reservationPeriod;
                
                if (type === 'manual') {
                    if (!manual?.startDate || !manual?.endDate || 
                        isNaN(new Date(manual.startDate).getTime()) || 
                        isNaN(new Date(manual.endDate).getTime())) {
                        throw new Error('잘못된 수동 설정 데이터');
                    }
                } else if (type === 'auto') {
                    if (!auto?.startDate || auto?.baseDay === undefined || 
                        !auto?.weekExtension || isNaN(new Date(auto.startDate).getTime()) ||
                        auto.baseDay < 0 || auto.baseDay > 6 ||
                        auto.weekExtension < 1 || auto.weekExtension > 5) {
                        throw new Error('잘못된 자동 연장 설정 데이터');
                    }
                }
            }

            // 백업 생성
            const backupPath = path.join(process.cwd(), 'data', 'settings.backup.json');
            if (fs.existsSync(settingsPath)) {
                fs.copyFileSync(settingsPath, backupPath);
            }

            fs.writeFileSync(settingsPath, JSON.stringify(newSettings, null, 2));
            res.status(200).json({ message: '설정이 저장되었습니다.' });
        } catch (error) {
            console.error('설정 저장 중 오류:', error);
            res.status(500).json({ error: error.message || '설정 저장에 실패했습니다.' });
        } finally {
            releaseLock();
        }
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
} 