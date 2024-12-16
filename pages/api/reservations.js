import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';

const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        project_id: process.env.GOOGLE_PROJECT_ID
    },
    scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/calendar'
    ],
});

// KST 변환 함수 수정
function convertToKST(date) {
    const kstOffset = 9 * 60;
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    return new Date(utc + (kstOffset * 60000));
}

// isSameKSTDate 함수 추가
function isSameKSTDate(date1, date2) {
    const kstDate1 = convertToKST(date1);
    const kstDate2 = convertToKST(date2);
    return kstDate1.toDateString() === kstDate2.toDateString();
}

async function checkExistingEvents(calendar, date, calendarId) {
    const targetDate = new Date(date);
    const kstDate = convertToKST(targetDate);
    const startOfDay = new Date(kstDate.getFullYear(), kstDate.getMonth(), kstDate.getDate(), 0, 0, 0);
    const endOfDay = new Date(kstDate.getFullYear(), kstDate.getMonth(), kstDate.getDate(), 23, 59, 59);

    try {
        const settingsPath = path.join(process.cwd(), 'data', 'settings.json');
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        
        const isHoliday = settings.holidays.some(holiday => {
            const h = convertToKST(new Date(holiday));
            const d = convertToKST(kstDate);
            return isSameKSTDate(h, d);
        });

        let timeRange;
        if (isHoliday) {
            timeRange = settings.availableHours.holiday;
        } else {
            const isWeekend = kstDate.getDay() === 0 || kstDate.getDay() === 6;
            timeRange = isWeekend ? settings.availableHours.weekend : settings.availableHours.weekday;
        }

        const hour = kstDate.getHours();
        if (hour < parseInt(timeRange.start) || hour > parseInt(timeRange.end)) {
            throw new Error('예약 가능한 시간이 아닙니다.');
        }

        const response = await calendar.events.list({
            calendarId: calendarId,
            timeMin: startOfDay.toISOString(),
            timeMax: endOfDay.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
        });

        return response.data.items || [];
    } catch (error) {
        console.error('Error checking events:', error);
        throw error;
    }
}

// 텔레그램 메시지 전송 함수 추가
async function sendTelegramMessage(message) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    try {
        const response = await fetch(
            `https://api.telegram.org/bot${botToken}/sendMessage`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: message,
                    parse_mode: 'HTML'
                }),
            }
        );

        if (!response.ok) {
            throw new Error('텔레그램 메시지 전송 실패');
        }
    } catch (error) {
        console.error('텔레그램 알림 전송 중 오류:', error);
    }
}

export default async function handler(req, res) {
    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    if (!calendarId || !spreadsheetId) {
        return res.status(500).json({ 
            error: 'Google Calendar ID or Sheet ID is not configured' 
        });
    }

    if (req.method === 'POST') {
        const { dateTime, memberName, memberId } = req.body;
        
        try {
            const authClient = await auth.getClient();
            const calendar = google.calendar({ version: 'v3', auth: authClient });

            const reservationDate = new Date(dateTime);
            
            await checkExistingEvents(calendar, reservationDate, calendarId);

            const event = {
                summary: `${memberName}(${memberId})`,
                description: '운동 예약',
                start: {
                    dateTime: reservationDate.toISOString(),
                    timeZone: 'Asia/Seoul',
                },
                end: {
                    dateTime: new Date(reservationDate.getTime() + 50 * 60 * 1000).toISOString(),
                    timeZone: 'Asia/Seoul',
                },
                reminders: {
                    useDefault: false,
                    overrides: [
                        { method: 'email', minutes: 60 },
                        { method: 'popup', minutes: 30 },
                    ],
                },
            };

            // 캘린더에 이벤트 추가
            const createdEvent = await calendar.events.insert({
                calendarId: calendarId,
                resource: event,
            });

            // 생성된 이벤트의 시간을 사용하여 시트에 저장할 데이터 생성
            let eventDateTime = createdEvent.data.start.dateTime;
            let eventDatePart = eventDateTime.split('T')[0];
            let eventTimePart = eventDateTime.split('T')[1];
            let eventHours = eventTimePart.split(':')[0];

            // 구글 시트에 저장
            await google.sheets('v4').spreadsheets.values.append({
                auth: authClient,
                spreadsheetId: spreadsheetId,
                range: 'reservations!A:D',
                valueInputOption: 'RAW',
                resource: {
                    values: [[
                        eventDatePart,
                        `${eventHours}:00`,
                        memberId,
                        memberName,
                    ]],
                },
            });

            const formattedDate = new Date(eventDateTime).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
            });
            const formattedTime = `${eventHours}:00`;

            await sendTelegramMessage(
                `🆕 <b>새로운 예약이 등록되었습니다!</b>\n\n` +
                `📅 날짜: ${formattedDate}\n` +
                `⏰ 시간: ${formattedTime}\n` +
                `👤 회원명: ${memberName}\n` +
                `🆔 회원번호: ${memberId}`
            );

            res.status(201).json({ 
                message: '예약이 완료되었습니다.',
                reservation: { 
                    date: eventDatePart,
                    time: `${eventHours}:00`,
                    memberName, 
                    memberId 
                }
            });
        } catch (error) {
            console.error('Error adding reservation:', error);
            res.status(500).json({ 
                error: error.message || '예약 추가 실패',
                details: error.message 
            });
        }
    } else if (req.method === 'GET') {
        const { date, memberId } = req.query;

        try {
            const authClient = await auth.getClient();
            const calendar = google.calendar({ version: 'v3', auth: authClient });

            if (memberId) {
                const now = new Date();

                const response = await calendar.events.list({
                    calendarId: calendarId,
                    timeMin: now.toISOString(),
                    singleEvents: true,
                    orderBy: 'startTime',
                    timeZone: 'Asia/Seoul'
                });

                const events = response.data.items || [];
                console.log('Raw events data:', events);
                
                const memberEvents = events.filter(event => {
                    const match = event.summary.match(/\((\d+)\)/);
                    const eventTime = new Date(event.start.dateTime);
                    return match && 
                           match[1] === memberId && 
                           eventTime >= now;
                });

                const formattedReservations = await Promise.all(memberEvents.map(async event => {
                    const [datePart, timePart] = event.start.dateTime.split('T');
                    const hours = timePart.split(':')[0];
                    const memberInfo = event.summary.match(/(.*?)\((\d+)\)/);
                    
                    // 시트에서 해당 예약 정보 찾기
                    const sheets = google.sheets({ version: 'v4', auth: authClient });
                    const sheetResponse = await sheets.spreadsheets.values.get({
                        spreadsheetId: spreadsheetId,
                        range: 'reservations!A:E',
                    });

                    const rows = sheetResponse.data.values || [];
                    const matchingRow = rows.find(row => 
                        row[2] === memberInfo[2] && 
                        row[0] === datePart && 
                        row[1] === `${hours}:00`
                    );
                    
                    return [
                        datePart,          // date
                        `${hours}:00`,     // time
                        memberInfo[2],     // memberId
                        memberInfo[1].trim(), // name
                        event.id,          // eventId
                        matchingRow?.[4] || null  // changeHistory
                    ];
                }));

                console.log('Formatted reservations:', formattedReservations);
                return res.status(200).json(formattedReservations);
            } else if (date) {
                try {
                    const [year, month, day] = date.split('-').map(Number);
                    
                    // UTC+9 (한국 시간)을 고려한 시작/종료 시간 설정
                    const startOfDay = new Date(Date.UTC(year, month - 1, day, -9, 0, 0));  // 한국 시간 00:00
                    const endOfDay = new Date(Date.UTC(year, month - 1, day, 14, 59, 59));  // 한국 시간 23:59

                    console.log('Checking range:', {
                        date,
                        start: startOfDay.toISOString(),
                        end: endOfDay.toISOString()
                    });

                    const response = await calendar.events.list({
                        calendarId: calendarId,
                        timeMin: startOfDay.toISOString(),
                        timeMax: endOfDay.toISOString(),
                        singleEvents: true,
                        orderBy: 'startTime',
                        timeZone: 'Asia/Seoul'
                    });

                    const events = response.data.items || [];
                    console.log('Found events:', events.length);

                    // 예약된 시간 계산 로직 수정
                    const bookedTimes = new Set();
                    events.forEach(event => {
                        // 하루종일 이벤트 체크
                        if (event.start.date) {  // date 속성이 있으면 하 이벤트
                            // 하루종일 이벤트가 있으면 모든 시간대를 예약 불가로 설정
                            for (let hour = 0; hour < 24; hour++) {
                                bookedTimes.add(hour);
                            }
                        } else {  // 일반 시간 예약 이벤트
                            const startTime = new Date(event.start.dateTime);
                            const endTime = new Date(event.end.dateTime);
                            
                            // UTC+9 고려하여 시간 변환
                            const startHour = (startTime.getUTCHours() + 9) % 24;
                            const endHour = (endTime.getUTCHours() + 9) % 24;
                            const endMinute = endTime.getUTCMinutes();
                            
                            // 시작 시간부터 종료 시간까지의 모든 시간을 추가
                            // 종료 시간에 분이 있다면 해당 시간도 예약 불가로 처리
                            for (let hour = startHour; hour <= (endMinute > 0 ? endHour : endHour - 1); hour++) {
                                bookedTimes.add(hour);
                            }
                        }
                    });

                    console.log('Booked times:', Array.from(bookedTimes));
                    return res.status(200).json({ bookedTimes: Array.from(bookedTimes) });
                } catch (error) {
                    console.error('Error fetching calendar events:', error);
                    return res.status(500).json({ 
                        error: 'Failed to fetch calendar data',
                        details: error.message 
                    });
                }
            }

            return res.status(400).json({ error: '필수 개변수가 누락되었니다.' });

        } catch (error) {
            console.error('Error:', error);
            return res.status(500).json({ error: 'Failed to fetch data' });
        }
    } else if (req.method === 'PUT') {
        const { eventId, dateTime, memberName, memberId } = req.body;
        
        try {
            const authClient = await auth.getClient();
            const calendar = google.calendar({ version: 'v3', auth: authClient });

            // 당일 예약 체크
            const today = new Date();
            const reservationDate = new Date(dateTime);
            const kstToday = convertToKST(today);
            const kstReservationDate = convertToKST(reservationDate);

            if (isSameKSTDate(kstReservationDate, kstToday)) {
                return res.status(400).json({ error: '당일 예약은 변경할 수 없습니다.' });
            }

            // 기존 이벤트 져오기
            const event = await calendar.events.get({
                calendarId: calendarId,
                eventId: eventId
            });

            // POST와 완전히 동일한 방식으로 이벤트 업데이트
            const updatedEvent = {
                summary: `${memberName}(${memberId})`,
                description: '운동 예약',
                start: {
                    dateTime: reservationDate.toISOString(),
                    timeZone: 'Asia/Seoul',
                },
                end: {
                    dateTime: new Date(reservationDate.getTime() + 50 * 60 * 1000).toISOString(),
                    timeZone: 'Asia/Seoul',
                },
                reminders: {
                    useDefault: false,
                    overrides: [
                        { method: 'email', minutes: 60 },
                        { method: 'popup', minutes: 30 },
                    ],
                },
            };

            const response = await calendar.events.update({
                calendarId: calendarId,
                eventId: eventId,
                resource: updatedEvent,
            });

            // POST와 완전히 동일한 방식으로 시간 처리
            let eventDateTime = response.data.start.dateTime;
            let eventDatePart = eventDateTime.split('T')[0];
            let eventTimePart = eventDateTime.split('T')[1];
            let eventHours = eventTimePart.split(':')[0];

            // 기존 예약 찾기 (변경 전 시간)
            let oldDateTime = event.data.start.dateTime;
            let oldDatePart = oldDateTime.split('T')[0];
            let oldTimePart = oldDateTime.split('T')[1].split(':')[0] + ':00';

            const sheets = google.sheets({ version: 'v4', auth: authClient });
            const sheetResponse = await sheets.spreadsheets.values.get({
                spreadsheetId: spreadsheetId,
                range: 'reservations!A:E',
            });

            const rows = sheetResponse.data.values || [];
            const rowIndex = rows.findIndex(row => {
                // 회원번호가 같고
                const isSameMember = row[2] === memberId;
                
                // 현재 예약된 날짜와 시간이 일치하는지 확인
                // (이미 변된 예약도 찾을 수 있도록 현재 값으로 비교)
                const isSameDateTime = row[0] === oldDatePart && row[1] === oldTimePart;
                
                console.log('Checking row:', {
                    row,
                    isSameMember,
                    isSameDateTime,
                    currentDate: row[0],
                    currentTime: row[1],
                    oldDatePart,
                    oldTimePart
                });

                // isNotChanged 조건 제거
                return isSameMember && isSameDateTime;
            });

            if (rowIndex !== -1) {
                console.log('Found matching reservation at row:', rowIndex + 1);
                await sheets.spreadsheets.values.update({
                    spreadsheetId: spreadsheetId,
                    range: `reservations!A${rowIndex + 1}:E${rowIndex + 1}`,
                    valueInputOption: 'RAW',
                    resource: {
                        values: [[
                            eventDatePart,
                            `${eventHours}:00`,
                            memberId,
                            memberName,
                            `${oldDatePart} ${oldTimePart} → ${eventDatePart} ${eventHours}:00`
                        ]],
                    },
                });
            } else {
                console.log('No matching reservation found. Searched for:', {
                    memberId,
                    oldDatePart,
                    oldTimePart,
                    availableRows: rows
                });
                throw new Error('존 예약을 찾을 수 없습니다.');
            }

            const oldFormattedDate = new Date(oldDateTime).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
            });
            const newFormattedDate = new Date(eventDateTime).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
            });

            await sendTelegramMessage(
                `🔄 <b>예약이 변경되었습니다!</b>\n\n` +
                `👤 회원명: ${memberName}\n` +
                `🆔 회원번호: ${memberId}\n\n` +
                `<b>변경 전</b>\n` +
                `📅 날짜: ${oldFormattedDate}\n` +
                `⏰ 시간: ${oldTimePart}\n\n` +
                `<b>변경 후</b>\n` +
                `📅 날짜: ${newFormattedDate}\n` +
                `⏰ 시간: ${eventHours}:00`
            );

            res.status(200).json({ 
                message: '예약이 변경되었습니다.',
                updatedReservation: { 
                    date: eventDatePart,
                    time: `${eventHours}:00`,
                    memberName, 
                    memberId,
                    eventId: response.data.id
                }
            });
        } catch (error) {
            console.error('Error updating reservation:', error);
            res.status(500).json({ 
                error: '예약 변경 실패',
                details: error.message 
            });
        }
    } else {
        res.setHeader('Allow', ['POST', 'GET', 'PUT']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
