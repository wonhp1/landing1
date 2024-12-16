import { useState } from 'react';
import styles from '../styles/button-edit-modal.module.css';

const ButtonEditModal = ({ button, onSave, onClose }) => {
    const [editingButton, setEditingButton] = useState(button);

    const handleChange = (field, value) => {
        setEditingButton(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSave = () => {
        onSave(editingButton);
        onClose();
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <button className={styles.closeButton} onClick={onClose}>×</button>
                <h2 className={styles.modalTitle}>버튼 설정</h2>
                <div className={styles.modalBody}>
                    <div className={styles.formGroup}>
                        <label>버튼 텍스트</label>
                        <input
                            type="text"
                            value={editingButton.text}
                            onChange={(e) => handleChange('text', e.target.value)}
                            className={styles.input}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>이동할 URL</label>
                        <input
                            type="url"
                            value={editingButton.url}
                            onChange={(e) => handleChange('url', e.target.value)}
                            className={styles.input}
                            placeholder="https://"
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>배경색</label>
                        <input
                            type="color"
                            value={editingButton.backgroundColor}
                            onChange={(e) => handleChange('backgroundColor', e.target.value)}
                            className={styles.colorInput}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>텍스트 색상</label>
                        <input
                            type="color"
                            value={editingButton.textColor}
                            onChange={(e) => handleChange('textColor', e.target.value)}
                            className={styles.colorInput}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>테두리 색상</label>
                        <input
                            type="color"
                            value={editingButton.borderColor}
                            onChange={(e) => handleChange('borderColor', e.target.value)}
                            className={styles.colorInput}
                        />
                    </div>
                </div>
                <div className={styles.modalFooter}>
                    <button className={styles.saveButton} onClick={handleSave}>저장</button>
                    <button className={styles.cancelButton} onClick={onClose}>취소</button>
                </div>
            </div>
        </div>
    );
};

export default ButtonEditModal; 