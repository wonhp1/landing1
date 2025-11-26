import { google } from 'googleapis';

const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        project_id: process.env.GOOGLE_PROJECT_ID
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = 'password';

export async function getPassword() {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!A2`
        });

        const rawValue = response.data.values?.[0]?.[0];
        if (rawValue === undefined || rawValue === null) {
            return null;
        }
        return String(rawValue).trim();
    } catch (error) {
        console.error('구글 시트에서 비밀번호를 가져오는 중 오류 발생:', error);
        throw error;
    }
}

export async function updatePassword(newPassword) {
    try {
        const sanitized =
            newPassword === undefined || newPassword === null
                ? ''
                : String(newPassword).trim();

        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!A2`,
            valueInputOption: 'RAW',
            requestBody: {
                values: [[sanitized]]
            }
        });
        return true;
    } catch (error) {
        console.error('구글 시트 비밀번호 업데이트 중 오류 발생:', error);
        throw error;
    }
}
