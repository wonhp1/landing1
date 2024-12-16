import { google } from 'googleapis';

const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        project_id: process.env.GOOGLE_PROJECT_ID
    },
    scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/calendar'
    ]
});

// KST 변환 함수 추가
function convertToKST(date) {
    const kstOffset = 9 * 60;
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    return new Date(utc + (kstOffset * 60000));
}

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const { startDate, endDate, searchKeyword } = req.query;

    try {
        const authClient = await auth.getClient();
        const sheets = google.sheets({ version: 'v4', auth: authClient });
        const calendar = google.calendar({ version: 'v3', auth: authClient });

        // 1. 유효회원 목록 가져오기
        const memberResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: 'member_list!A:B',
        });
        const members = memberResponse.data.values || [];

        // 검색어가 있는 경우 회원 필터링
        let filteredMembers = members;
        if (searchKeyword) {
            filteredMembers = members.filter(([name, memberId]) => {
                const keyword = searchKeyword.toLowerCase();
                return name.toLowerCase().includes(keyword) || 
                       memberId.includes(keyword);
            });
        }

        // 2. 해당 기간의 예약 데이터 가져오기
        const startDateTime = new Date(startDate);
        const endDateTime = new Date(endDate);
        
        // UTC 기준으로 시작과 끝 시간 설정
        const timeMin = new Date(Date.UTC(
            startDateTime.getFullYear(),
            startDateTime.getMonth(),
            startDateTime.getDate(),
            -9, 0, 0  // KST 00:00
        )).toISOString();

        const timeMax = new Date(Date.UTC(
            endDateTime.getFullYear(),
            endDateTime.getMonth(),
            endDateTime.getDate(),
            14, 59, 59  // KST 23:59
        )).toISOString();

        const calendarResponse = await calendar.events.list({
            calendarId: process.env.GOOGLE_CALENDAR_ID,
            timeMin: timeMin,
            timeMax: timeMax,
            singleEvents: true,
            orderBy: 'startTime',
            timeZone: 'Asia/Seoul'
        });

        // 3. 회원별 예약 횟수 계산
        const reservationCounts = {};
        filteredMembers.forEach(([name, memberId]) => {
            reservationCounts[memberId] = {
                name,
                memberId,
                count: 0,
                reservations: []
            };
        });

        calendarResponse.data.items.forEach(event => {
            const match = event.summary.match(/\(([\d]+)\)/);
            if (match) {
                const memberId = match[1];
                if (reservationCounts[memberId]) {
                    reservationCounts[memberId].count++;
                    
                    // 예약 상세 정보 추가
                    const eventDate = new Date(event.start.dateTime || event.start.date);
                    const kstDate = convertToKST(eventDate);
                    
                    // 요일 추가
                    const weekDay = kstDate.toLocaleDateString('ko-KR', { weekday: 'short' });
                    
                    reservationCounts[memberId].reservations.push({
                        date: `${kstDate.getMonth() + 1}월 ${kstDate.getDate()}일(${weekDay})`,
                        time: kstDate.toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false
                        })
                    });
                }
            }
        });

        // 전체 예약 횟수 합계 계산
        const totalReservations = Object.values(reservationCounts).reduce((sum, member) => sum + member.count, 0);

        // 4. 결과 정렬 (예약 횟수 내림차순, 같으면 이름 오름차순)
        const sortedResults = Object.values(reservationCounts).sort((a, b) => {
            if (b.count !== a.count) {
                return b.count - a.count;
            }
            return a.name.localeCompare(b.name);
        });

        // 각 회원의 예약 정보를 날짜순으로 정렬
        sortedResults.forEach(result => {
            result.reservations.sort((a, b) => {
                const dateA = new Date(a.date.replace('월 ', '/').replace('일', ''));
                const dateB = new Date(b.date.replace('월 ', '/').replace('일', ''));
                return dateA - dateB;
            });
        });

        // 정렬된 결과와 함께 총합 반환
        return res.status(200).json({
            total: totalReservations,
            members: sortedResults
        });

    } catch (error) {
        console.error('통계 조회 중 오류 발생:', error);
        return res.status(500).json({ 
            error: '통계 조회 중 오류가 발생했습니다.',
            details: error.message 
        });
    }
} 