import { checkAuth } from '../../../middleware/adminAuth';

export default function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { isAuthenticated } = checkAuth(req);

    if (!isAuthenticated) {
        return res.status(401).json({ authenticated: false });
    }

    res.status(200).json({ authenticated: true });
}
