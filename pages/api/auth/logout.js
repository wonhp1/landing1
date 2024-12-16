export default function handler(req, res) {
    // 쿠키 삭제
    res.setHeader('Set-Cookie', 'adminToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
    
    // 메인 페이지로 리다이렉트
    res.redirect('/');
} 