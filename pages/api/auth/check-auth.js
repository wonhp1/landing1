export default function handler(req, res) {
    const token = req.cookies.adminToken;

    if (!token) {
        return res.status(401).json({ isAuthenticated: false });
    }

    res.status(200).json({ isAuthenticated: true });
} 