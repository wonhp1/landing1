import { serialize } from 'cookie';

export default function handler(req, res) {
    // 쿠키 삭제
    const cookie = serialize('auth_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: -1,
        path: '/',
    });

    res.setHeader('Set-Cookie', cookie);
    res.redirect('/');
}
