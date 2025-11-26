import { getPassword } from '../../../utils/googleSheets';
import { generateToken, comparePassword } from '../../../utils/passwordUtils';
import { serialize } from 'cookie';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        let { password } = req.body;
        if (typeof password === 'string') {
            password = password.trim();
        }

        if (!password) {
            return res.status(400).json({ error: '비밀번호를 입력해주세요.' });
        }

        // Google Sheets에서 저장된 비밀번호 가져오기
        const storedPassword = await getPassword();

        if (!storedPassword) {
            return res.status(500).json({ error: '비밀번호를 불러올 수 없습니다.' });
        }

        // 비밀번호 검증
        const isValid = comparePassword(password, storedPassword);

        if (!isValid) {
            return res.status(401).json({ isValid: false, error: '비밀번호가 틀렸습니다.' });
        }

        // JWT 토큰 생성
        const token = generateToken({ role: 'admin' });

        // 쿠키에 토큰 저장
        const cookie = serialize('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24, // 24시간
            path: '/',
        });

        res.setHeader('Set-Cookie', cookie);
        res.status(200).json({ isValid: true });
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ error: '인증 중 오류가 발생했습니다.' });
    }
}
