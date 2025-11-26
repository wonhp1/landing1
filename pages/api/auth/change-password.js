import { getPassword, updatePassword } from '../../../utils/googleSheets';
import { comparePassword } from '../../../utils/passwordUtils';
import { requireAuth } from '../../../middleware/adminAuth';

async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: '모든 필드를 입력해주세요.' });
        }

        // 현재 비밀번호 확인
        const storedPassword = await getPassword();

        if (!comparePassword(currentPassword, storedPassword)) {
            return res.status(401).json({ error: '현재 비밀번호가 일치하지 않습니다.' });
        }

        // 새 비밀번호로 업데이트
        await updatePassword(newPassword);

        res.status(200).json({ success: true, message: '비밀번호가 변경되었습니다.' });
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ error: '비밀번호 변경 중 오류가 발생했습니다.' });
    }
}

export default requireAuth(handler);
