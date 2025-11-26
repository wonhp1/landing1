import { verifyToken } from '../utils/passwordUtils';

export function checkAuth(req) {
    const token = req.cookies?.auth_token;

    if (!token) {
        return { isAuthenticated: false };
    }

    const decoded = verifyToken(token);

    if (!decoded) {
        return { isAuthenticated: false };
    }

    return { isAuthenticated: true, user: decoded };
}

export function requireAuth(handler) {
    return async (req, res) => {
        const { isAuthenticated } = checkAuth(req);

        if (!isAuthenticated) {
            return res.status(401).json({ error: '인증이 필요합니다.' });
        }

        return handler(req, res);
    };
}
