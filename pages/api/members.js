import { google } from 'googleapis';

const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        project_id: process.env.GOOGLE_PROJECT_ID
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            const { name, memberId } = req.body;

            // 입력값 검증
            if (!name || !memberId) {
                return res.status(400).json({ 
                    success: false, 
                    message: '이름과 회원번호를 모두 입력해주세요.' 
                });
            }

            // 회원번호 형식 검증 (4자리 숫자)
            if (!/^\d{4}$/.test(memberId)) {
                return res.status(400).json({ 
                    success: false, 
                    message: '회원번호는 4자리 숫자여야 합니다.' 
                });
            }

            const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });

            // 기존 회원 목록 조회
            const response = await sheets.spreadsheets.values.get({
                spreadsheetId: process.env.GOOGLE_SHEET_ID,
                range: 'member_list!A:B',
            });

            const rows = response.data.values || [];

            // 중복 회원번호 체크
            const isDuplicate = rows.some(row => row[1] === memberId);
            if (isDuplicate) {
                return res.status(400).json({ 
                    success: false, 
                    message: '이미 존재하는 회원번호입니다.' 
                });
            }

            // 새 회원 추가
            await sheets.spreadsheets.values.append({
                spreadsheetId: process.env.GOOGLE_SHEET_ID,
                range: 'member_list!A:B',
                valueInputOption: 'RAW',
                resource: {
                    values: [[name, memberId]]
                },
            });

            return res.status(200).json({ 
                success: true, 
                message: '회원이 성공적으로 추가되었습니다.' 
            });

        } catch (error) {
            console.error('회원 추가 중 오류 발생:', error);
            return res.status(500).json({ 
                success: false, 
                message: '회원 추가 중 오류가 발생했습니다.' 
            });
        }
    }

    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
} 