import fs from 'fs';
import path from 'path';
import { getAllProducts, updateAllProducts } from '../../../utils/googleSheets';
import { requireAuth } from '../../../middleware/adminAuth';

async function handler(req, res) {
    const filePath = path.join(process.cwd(), 'data', 'products.json');

    if (req.method === 'GET') {
        try {
            if (!fs.existsSync(filePath)) {
                return res.status(200).json([]);
            }
            const fileData = fs.readFileSync(filePath, 'utf8');
            const products = JSON.parse(fileData);
            res.status(200).json(products);
        } catch (error) {
            console.error('상품 로딩 실패:', error);
            res.status(500).json({ message: 'Failed to load products' });
        }
    } else if (req.method === 'POST') {
        const { action } = req.query;

        // 구글 시트에 백업
        if (action === 'backup-to-sheet') {
            try {
                const fileData = fs.readFileSync(filePath, 'utf8');
                const products = JSON.parse(fileData);

                const success = await updateAllProducts(products);
                if (success) {
                    res.status(200).json({ message: '구글 시트에 백업 완료' });
                } else {
                    res.status(500).json({ message: '구글 시트 백업 실패' });
                }
            } catch (error) {
                console.error('구글 시트 백업 실패:', error);
                res.status(500).json({ message: '구글 시트 백업 실패' });
            }
        }
        // 구글 시트에서 불러오기
        else if (action === 'sync-from-sheet') {
            try {
                const sheetProducts = await getAllProducts();
                fs.writeFileSync(filePath, JSON.stringify(sheetProducts, null, 2));
                res.status(200).json({ message: '구글 시트에서 불러오기 완료', data: sheetProducts });
            } catch (error) {
                console.error('구글 시트 불러오기 실패:', error);
                res.status(500).json({ message: '구글 시트에서 불러오기 실패' });
            }
        }
        // 일반 상품 추가
        else {
            try {
                const newProduct = req.body;
                const products = fs.existsSync(filePath)
                    ? JSON.parse(fs.readFileSync(filePath, 'utf8'))
                    : [];

                newProduct.id = `product_${Date.now()}`;
                newProduct.displayOrder = products.length + 1;
                products.push(newProduct);

                fs.writeFileSync(filePath, JSON.stringify(products, null, 2));
                res.status(201).json(newProduct);
            } catch (error) {
                console.error('상품 추가 실패:', error);
                res.status(500).json({ message: 'Failed to add product' });
            }
        }
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

export default async function (req, res) {
    if (req.method === 'GET') {
        return handler(req, res);
    }
    // POST는 인증 필요
    return requireAuth(handler)(req, res);
};
