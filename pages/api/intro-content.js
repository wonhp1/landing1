import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'intro-content.json');

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            // 파일이 없는 경우 기본값 반환
            if (!fs.existsSync(filePath)) {
                return res.status(200).json({
                    pageSettings: {
                        backgroundColor: '#ffffff',
                        headerBackgroundColor: '#ffffff',
                        headerTextColor: '#000000',
                        headerFontSize: '1.2rem',
                        headerFontWeight: 'normal',
                        headerText: '메인 제목'
                    },
                    contents: [
                        {
                            id: 1,
                            contentType: 'button',
                            text: '⏰ 스케줄 예약 및 변경 ⏰',
                            url: '/reservations'
                        },
                        {
                            id: 2,
                            contentType: 'button',
                            text: '📝 운동일지 조회 💪',
                            url: '/exercise-log'
                        },
                        {
                            id: 3,
                            contentType: 'button',
                            text: '🥄 식사일지 조회 🥢',
                            url: '/meal-log'
                        },
                        {
                            id: 4,
                            contentType: 'button',
                            text: '📋 인바디 조회 📋',
                            url: '/my-inbody'
                        }
                    ]
                });
            }

            const fileData = fs.readFileSync(filePath, 'utf8');
            const introContent = JSON.parse(fileData);
            
            // 기존 데이터를 새로운 형식으로 변환
            if (!introContent.contents) {
                introContent.contents = [
                    ...(introContent.sections || []).map(section => ({
                        ...section,
                        contentType: 'section'
                    })),
                    ...(introContent.buttons || []).map(button => ({
                        ...button,
                        contentType: 'button'
                    }))
                ];
                delete introContent.sections;
                delete introContent.buttons;
            }

            res.status(200).json(introContent);
        } catch (error) {
            console.error('Error reading intro content:', error);
            res.status(500).json({ error: '서버 오류가 발생했습니다.' });
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