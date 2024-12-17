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
            const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });

            // 회원 검증 설정 확인
            const settingsResponse = await sheets.spreadsheets.values.get({
                spreadsheetId: process.env.GOOGLE_SHEET_ID,
                range: 'member_list!D1:E1',
            });

            const settings = settingsResponse.data.values?.[0] || ['memberValidation', 'true'];
            const validationEnabled = settings[1] === 'true';

            // 검증이 비활성화되어 있으면 항상 true 반환
            if (!validationEnabled) {
                return res.status(200).json({ 
                    isValid: true 
                });
            }

            // 기존 검증 로직...
            const { name, memberId } = req.body;

            if (!name || !memberId) {
                return res.status(400).json({ 
                    isValid: false, 
                    message: '이름과 회원번호를 모두 입력해주세요.' 
                });
            }

            // 회원 정보 조회
            const response = await sheets.spreadsheets.values.get({
                spreadsheetId: process.env.GOOGLE_SHEET_ID,
                range: 'member_list!A:B',
            });

            const rows = response.data.values || [];

            // 이름과 회원번호가 일치하는지 확인
            const isValid = rows.some(row => 
                row[0] === name && row[1] === memberId
            );

            if (!isValid) {
                return res.status(200).json({ 
                    isValid: false, 
                    message: '유효하지 않은 회원정보입니다.' 
                });
            }

            return res.status(200).json({ 
                isValid: true 
            });

        } catch (error) {
            console.error('회원 검증 중 오류 발생:', error);
            return res.status(500).json({ 
                isValid: false, 
                message: '회원 검증 중 오류가 발생했습니다.' 
            });
        }
    }

    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
} 