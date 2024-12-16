import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'intro-content.json');

// 기본값을 상수로 분리하고 더 엄격하게 정의
const DEFAULT_CONTENT = {
    pageSettings: {
        backgroundColor: '#ffffff',
        headerBackgroundColor: '#ffffff',
        headerTextColor: '#000000',
        headerFontSize: '1.2rem',
        headerFontWeight: 'normal',
        headerText: '제목없음'
    },
    contents: [
        {
            id: 1,
            contentType: 'section',
            type: 'image',
            content: '',
            backgroundColor: '#ffffff',
            borderColor: '#ffffff',
            caption: '',
            captionBackgroundColor: '#000000',
            captionTextColor: '#ffffff',
            captionBorderColor: '#000000',
            url: ''
        },
        {
            id: 2,
            contentType: 'section',
            type: 'video',
            content: '',
            backgroundColor: '#ffffff',
            borderColor: '#ffffff',
            caption: '',
            captionBackgroundColor: '#000000',
            captionTextColor: '#ffffff',
            captionBorderColor: '#000000',
            url: ''
        },
        {
            id: 3,
            contentType: 'section',
            type: 'text',
            content: '',
            backgroundColor: '#ffffff',
            borderColor: '#ffffff',
            textColor: '#000000',
            fontSize: '1rem',
            fontWeight: 'normal'
        },
        {
            id: 4,
            contentType: 'button',
            text: '새 버튼',
            url: '/',
            backgroundColor: '#ffffff',
            textColor: '#000000',
            borderColor: '#e0e0e0'
        }
    ]
};

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            // 파일이 없거나 빈 경우 기본값 반환
            if (!fs.existsSync(filePath)) {
                return res.status(200).json(DEFAULT_CONTENT);
            }

            const fileData = fs.readFileSync(filePath, 'utf8');
            let introContent;
            
            try {
                introContent = JSON.parse(fileData);
            } catch (e) {
                // JSON 파싱 실패시 기본값 반환
                return res.status(200).json(DEFAULT_CONTENT);
            }

            // 데이터가 없거나 불완전한 경우 기본값 반환
            if (!introContent || !introContent.contents || !introContent.pageSettings) {
                return res.status(200).json(DEFAULT_CONTENT);
            }

            res.status(200).json(introContent);
        } catch (error) {
            console.error('Error reading intro content:', error);
            // 에러 발생시 기본값 반환
            res.status(200).json(DEFAULT_CONTENT);
        }
    } else if (req.method === 'POST') {
        try {
            const content = req.body;
            
            // 데이터 유효성 검사 추가
            if (!content.contents || !Array.isArray(content.contents)) {
                return res.status(400).json({ error: '잘못된 데이터 형식입니다.' });
            }

            // contents 배열의 각 항목 검증
            for (const item of content.contents) {
                if (!item.contentType || !item.id) {
                    return res.status(400).json({ error: '잘못된 컨텐츠 형식입니다.' });
                }
            }

            // data 디렉토리가 없으면 생성
            const dataDir = path.join(process.cwd(), 'data');
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir);
            }

            // contents 배열로 저장
            const dataToSave = {
                pageSettings: content.pageSettings,
                contents: content.contents
            };

            fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2));
            res.status(200).json({ message: '성공적으로 저장되었습니다.' });
        } catch (error) {
            console.error('Error saving intro content:', error);
            res.status(500).json({ error: '서버 오류가 발생했습니다.' });
        }
    } else {
        res.status(405).json({ error: '허용되지 않는 메소드입니다.' });
    }
} 