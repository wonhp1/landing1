import fs from 'fs';
import path from 'path';
import { updateBusinessInfo, getBusinessInfo } from '../../utils/googleSheets';

export default async function handler(req, res) {
    const filePath = path.join(process.cwd(), 'data', 'business-info.json');

    if (req.method === 'GET') {
        try {
            if (!fs.existsSync(filePath)) {
                return res.status(200).json({});
            }
            const fileData = fs.readFileSync(filePath, 'utf8');
            const data = JSON.parse(fileData);
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ message: 'Failed to load business info' });
        }
    } else if (req.method === 'POST') {
        const { action } = req.query;

        // 구글 시트에서 불러오기
        if (action === 'sync-from-sheet') {
            try {
                const sheetData = await getBusinessInfo();
                if (!sheetData) {
                    return res.status(404).json({ message: '구글 시트에 데이터가 없습니다' });
                }

                fs.writeFileSync(filePath, JSON.stringify(sheetData, null, 2));
                res.status(200).json({ message: '구글 시트에서 불러오기 완료', data: sheetData });
            } catch (error) {
                console.error('구글 시트 불러오기 실패:', error);
                res.status(500).json({ message: '구글 시트에서 불러오기 실패' });
            }
        } else {
            // 일반 저장 (로컬 + 구글 시트 백업)
            try {
                const info = req.body;
                fs.writeFileSync(filePath, JSON.stringify(info, null, 2));

                // Backup to Google Sheets
                await updateBusinessInfo(info);

                res.status(200).json({ message: 'Business info updated successfully' });
            } catch (error) {
                res.status(500).json({ message: 'Failed to save business info' });
            }
        }
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
