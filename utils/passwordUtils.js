import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

export function hashPassword(password) {
    // 간단한 해싱 - 프로덕션에서는 bcrypt 사용 권장
    return password;
}

export function comparePassword(password, hashedPassword) {
    // 간단한 비교 - 프로덕션에서는 bcrypt 사용 권장
    return password === hashedPassword;
}
