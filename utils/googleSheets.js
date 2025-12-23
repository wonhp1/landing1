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
                info.ecommerceLicense || '',
                info.kakaoUrl || ''
            ]
        ];

        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: 'business_info!A2:H2',
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
            range: 'business_info!A2:H2'
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
            ecommerceLicense: values[6] || '',
            kakaoUrl: values[7] || ''
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
            range: 'products!A2:I'
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
            category: row[4] || '기타',
            weight: parseInt(row[5]) || 0,
            available: row[6] === 'TRUE' || row[6] === true,
            displayOrder: index + 1,
            detailPageUrl: row[8] || ''
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
            product.category || '기타',
            product.weight || 0,
            product.available ? 'TRUE' : 'FALSE',
            product.displayOrder || 0,
            product.detailPageUrl || ''
        ]);

        // 기존 데이터 삭제 후 새로 쓰기
        await sheets.spreadsheets.values.clear({
            spreadsheetId: SPREADSHEET_ID,
            range: 'products!A2:I'
        });

        if (values.length > 0) {
            await sheets.spreadsheets.values.update({
                spreadsheetId: SPREADSHEET_ID,
                range: 'products!A2:I',
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
// 컬럼: A:timestamp, B:products, C:customerName, D:customerPhone, E:address, F:request, G:totalAmount, H:orderId, I:status, J:paymentKey, K:cancelReason
export async function appendOrder(orderData) {
    try {
        const { timestamp, products, customerName, customerPhone, address, request, totalAmount, orderId, status, paymentKey } = orderData;

        // 주문상품을 문자열로 변환 (예: "사과 x 2, 배 x 1")
        const productStr = products.map(p => `${p.name} x ${p.quantity}`).join(', ');

        // A~K 컬럼
        const row = [
            timestamp || new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
            productStr,
            customerName,
            customerPhone,
            address,
            request || '',
            totalAmount || 0,
            orderId || '',
            status || 'pending',
            paymentKey || '',
            '' // cancelReason (초기값 빈 문자열)
        ];

        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: 'order!A:K',
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

// 모든 주문 조회 (관리자용)
export async function getAllOrders() {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'order!A2:K'
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            return [];
        }

        const orders = rows.map((row, index) => ({
            rowIndex: index + 2, // 실제 시트 행 번호 (헤더 제외)
            createdAt: row[0] || '',
            products: row[1] || '',
            customerName: row[2] || '',
            customerPhone: row[3] || '',
            address: row[4] || '',
            request: row[5] || '',
            totalAmount: parseInt(row[6]) || 0,
            id: row[7] || '',
            status: row[8] || 'pending',
            paymentKey: row[9] || '',
            cancelReason: row[10] || ''
        }));

        // 최신순 정렬
        return orders.reverse();
    } catch (error) {
        console.error('구글 시트에서 주문 조회 중 오류 발생:', error);
        throw error;
    }
}

// 전화번호로 주문 조회 (고객용 - paymentKey 제외)
export async function getOrdersByPhone(phone) {
    try {
        const allOrders = await getAllOrders();

        // 전화번호 정규화 (하이픈 제거)
        const normalizedPhone = phone.replace(/[^0-9]/g, '');

        const matchedOrders = allOrders.filter(order => {
            const orderPhone = order.customerPhone.replace(/[^0-9]/g, '');
            return orderPhone === normalizedPhone;
        });

        // paymentKey 제외하고 반환 (보안)
        return matchedOrders.map(order => ({
            id: order.id,
            createdAt: order.createdAt,
            products: order.products,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            address: order.address,
            request: order.request,
            totalAmount: order.totalAmount,
            status: order.status,
            cancelReason: order.cancelReason,
            hasPaymentKey: !!order.paymentKey
        }));
    } catch (error) {
        console.error('전화번호로 주문 조회 중 오류 발생:', error);
        throw error;
    }
}

// 주문 ID로 조회 (내부용 - paymentKey 포함)
export async function getOrderById(orderId) {
    try {
        const allOrders = await getAllOrders();
        return allOrders.find(order => order.id === orderId) || null;
    } catch (error) {
        console.error('주문 ID로 조회 중 오류 발생:', error);
        throw error;
    }
}

// 주문 상태 업데이트
export async function updateOrderStatus(orderId, status, cancelReason = '') {
    try {
        // 먼저 해당 주문의 행 번호 찾기
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'order!H2:H'
        });

        const rows = response.data.values;
        if (!rows) {
            return false;
        }

        // orderId가 있는 행 찾기
        const rowIndex = rows.findIndex(row => row[0] === orderId);
        if (rowIndex === -1) {
            console.error('주문을 찾을 수 없습니다:', orderId);
            return false;
        }

        const actualRow = rowIndex + 2; // 헤더 제외한 실제 행 번호

        // I열(status) 업데이트
        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `order!I${actualRow}`,
            valueInputOption: 'RAW',
            requestBody: {
                values: [[status]]
            }
        });

        // K열(cancelReason) 업데이트 (취소 사유가 있는 경우만)
        if (cancelReason) {
            await sheets.spreadsheets.values.update({
                spreadsheetId: SPREADSHEET_ID,
                range: `order!K${actualRow}`,
                valueInputOption: 'RAW',
                requestBody: {
                    values: [[cancelReason]]
                }
            });
        }

        return true;
    } catch (error) {
        console.error('주문 상태 업데이트 중 오류 발생:', error);
        return false;
    }
}
