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
            caption: '이미지를 추가하여 소개를 시작해보세요\n(권장 크기: 가로 500px)',
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
            caption: '유튜브 영상 주소를 입력하여 동영상을 추가해보세요\n(예: https://youtube.com/watch?v=...)',
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
            // 1. 파일이 없는 경우
            if (!fs.existsSync(filePath)) {
                return res.status(200).json(DEFAULT_CONTENT);
            }

            // 2. 파일 읽기
            const fileData = fs.readFileSync(filePath, 'utf8');
            let introContent;
            
            // 3. JSON 파싱
            try {
                introContent = JSON.parse(fileData);
            } catch (e) {
                return res.status(200).json(DEFAULT_CONTENT);
            }

            // 4. 데이터 구조 검증 및 변환
            if (!introContent.contents || !introContent.pageSettings) {
                // 기존 형식을 새 형식으로 변환
                const newContent = {
                    pageSettings: introContent.pageSettings || DEFAULT_CONTENT.pageSettings,
                    contents: []
                };

                // 기존 sections이 있으면 변환
                if (introContent.sections) {
                    newContent.contents.push(...introContent.sections.map(section => ({
                        ...section,
                        contentType: 'section'
                    })));
                }

                // 기존 buttons이 있으면 변환
                if (introContent.buttons) {
                    newContent.contents.push(...introContent.buttons.map(button => ({
                        ...button,
                        contentType: 'button'
                    })));
                }

                // 변환된 데이터가 없으면 기본값 사용
                if (newContent.contents.length === 0) {
                    return res.status(200).json(DEFAULT_CONTENT);
                }

                // 변환된 데이터 저장
                fs.writeFileSync(filePath, JSON.stringify(newContent, null, 2));
                return res.status(200).json(newContent);
            }

            // 5. 정상적인 데이터 반환
            res.status(200).json(introContent);
        } catch (error) {
            console.error('Error reading intro content:', error);
            res.status(200).json(DEFAULT_CONTENT);
        }
    } else if (req.method === 'POST') {
        try {
            const content = req.body;
            
            // 데이터 유효성 검사
            if (!content.contents || !Array.isArray(content.contents)) {
                return res.status(400).json({ error: '잘못된 데이터 형식입니다.' });
            }

            // contents 배열의 각 항목 검증
            for (const item of content.contents) {
                if (!item.contentType || !item.id) {
                    return res.status(400).json({ error: '잘못된 컨텐츠 형식입니다.' });
                }
            }

            // data 디렉토리 생성
            const dataDir = path.join(process.cwd(), 'data');
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir);
            }

            // 저장할 데이터 구성
            const dataToSave = {
                pageSettings: {
                    ...DEFAULT_CONTENT.pageSettings,
                    ...content.pageSettings
                },
                contents: content.contents
            };

            // 파일 저장
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