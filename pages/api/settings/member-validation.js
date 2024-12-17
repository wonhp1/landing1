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
    if (!['GET', 'PUT'].includes(req.method)) {
        res.setHeader('Allow', ['GET', 'PUT']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });
        const settingsRange = 'member_list!D1:E1';

        if (req.method === 'GET') {
            const response = await sheets.spreadsheets.values.get({
                spreadsheetId: process.env.GOOGLE_SHEET_ID,
                range: settingsRange,
            });

            const settings = response.data.values?.[0] || ['memberValidation', 'true'];
            return res.status(200).json({
                enabled: settings[1] === 'true'
            });
        }

        if (req.method === 'PUT') {
            const { enabled } = req.body;

            await sheets.spreadsheets.values.update({
                spreadsheetId: process.env.GOOGLE_SHEET_ID,
                range: settingsRange,
                valueInputOption: 'RAW',
                resource: {
                    values: [['memberValidation', enabled.toString()]]
                }
            });

            return res.status(200).json({ 
                success: true, 
                enabled 
            });
        }
    } catch (error) {
        console.error('설정 처리 중 오류 발생:', error);
        return res.status(500).json({ 
            success: false, 
            error: '설정 처리 중 오류가 발생했습니다.' 
        });
    }
} 