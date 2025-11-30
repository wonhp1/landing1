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

export async function updateBusinessInfo(info) {
    try {
        const values = [
            [
                info.businessName || '',
                info.representative || '',
                info.businessLicense || '',
                info.address || '',
                info.phone || '',
                info.email || '',
                info.ecommerceLicense || ''
            ]
        ];

        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: 'business_info!A2:G2',
            valueInputOption: 'RAW',
            requestBody: { values }
        });
        return true;
    } catch (error) {
        console.error('구글 시트 사업자 정보 업데이트 중 오류 발생:', error);
        // Don't throw error here to allow local update even if sheet fails
        return false;
    }
}

export async function getBusinessInfo() {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'business_info!A2:G2'
        });

        const values = response.data.values?.[0];
        if (!values || values.length === 0) {
            return null;
        }

        return {
            businessName: values[0] || '',
            representative: values[1] || '',
            businessLicense: values[2] || '',
            address: values[3] || '',
            phone: values[4] || '',
            email: values[5] || '',
            ecommerceLicense: values[6] || ''
        };
    } catch (error) {
        console.error('구글 시트에서 사업자 정보를 가져오는 중 오류 발생:', error);
        throw error;
    }
}

export async function getAllProducts() {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'products!A2:J'
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            return [];
        }

        return rows.map((row, index) => ({
            id: row[0] || `product_${Date.now()}_${index}`,
            name: row[1] || '',
            description: row[2] || '',
            price: parseInt(row[3]) || 0,
            imageUrl: row[4] || '',
            category: row[5] || '기타',
            weight: parseInt(row[6]) || 0,
            available: row[7] === 'TRUE' || row[7] === true,
            displayOrder: index + 1,
            detailPageUrl: row[9] || ''
        }));
    } catch (error) {
        console.error('구글 시트에서 상품을 가져오는 중 오류 발생:', error);
        throw error;
    }
}

export async function updateAllProducts(products) {
    try {
        // displayOrder로 정렬
        const sortedProducts = [...products].sort((a, b) =>
            (a.displayOrder || 0) - (b.displayOrder || 0)
        );

        const values = sortedProducts.map(product => [
            product.id,
            product.name,
            product.description || '',
            product.price,
            product.imageUrl || '',
            product.category || '기타',
            product.weight || 0,
            product.available ? 'TRUE' : 'FALSE',
            product.displayOrder || 0,
            product.detailPageUrl || ''
        ]);

        // 기존 데이터 삭제 후 새로 쓰기
        await sheets.spreadsheets.values.clear({
            spreadsheetId: SPREADSHEET_ID,
            range: 'products!A2:J'
        });

        if (values.length > 0) {
            await sheets.spreadsheets.values.update({
                spreadsheetId: SPREADSHEET_ID,
                range: 'products!A2:J',
                valueInputOption: 'RAW',
                requestBody: { values }
            });
        }

        return true;
    } catch (error) {
        console.error('구글 시트 상품 업데이트 중 오류 발생:', error);
        return false;
    }
}

// 주문 내역을 구글 시트의 "order" 시트에 추가
export async function appendOrder(orderData) {
    try {
        const { timestamp, products, customerName, customerPhone, address, request, totalAmount } = orderData;

        // 주문상품을 문자열로 변환 (예: "사과 x 2, 배 x 1")
        const productStr = products.map(p => `${p.name} x ${p.quantity}`).join(', ');

        // 시간, 주문상품, 이름, 전화번호, 주소, 요청사항, 매출
        const row = [
            timestamp || new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
            productStr,
            customerName,
            customerPhone,
            address,
            request || '',
            totalAmount || 0
        ];

        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: 'order!A:G', // A부터 G열까지 (매출 컬럼 추가)
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            requestBody: {
                values: [row]
            }
        });

        return true;
    } catch (error) {
        console.error('구글 시트에 주문 추가 중 오류 발생:', error);
        return false;
    }
}
