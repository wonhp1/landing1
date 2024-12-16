export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (password === adminPassword) {
        // 간단한 토큰 생성 (실제 프로덕션에서는 더 복잡한 토큰 생성 로직 사용 권장)
        const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
        
        // Set-Cookie 헤더 설정
        res.setHeader('Set-Cookie', `adminToken=${token}; Path=/; HttpOnly; SameSite=Strict`);
        res.status(200).json({ isValid: true });
    } else {
        res.status(401).json({ isValid: false });
    }
} 