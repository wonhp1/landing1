import { useState } from 'react';
import styles from '../styles/section-edit-modal.module.css';

const SectionEditModal = ({ section, onSave, onClose }) => {
    const [editingSection, setEditingSection] = useState({
        ...section,
        borderColor: section.borderColor || section.backgroundColor || '#ffffff',
        captionBorderColor: section.captionBorderColor || section.captionBackgroundColor || '#000000'
    });

    const handleChange = (field, value) => {
        if (field === 'type') {
            // 타입이 변경될 때 관련 필드 초기화
            setEditingSection(prev => ({
                ...prev,
                type: value,
                content: '',
                caption: value === 'text' ? undefined : '',
                captionBackgroundColor: value === 'text' ? undefined : '#000000',
                captionTextColor: value === 'text' ? undefined : '#ffffff',
                captionBorderColor: value === 'text' ? undefined : '#000000',
                borderColor: '#ffffff',
                backgroundColor: '#ffffff',
                url: ''
            }));
        } else if (field === 'backgroundColor') {
            // 배경색이 변경될 때 테두리 색상도 함께 변경
            setEditingSection(prev => ({
                ...prev,
                backgroundColor: value,
                borderColor: value
            }));
        } else if (field === 'captionBackgroundColor') {
            // 설명 텍스트 배경색이 변경될 때 테두리 색상도 함께 변경
            setEditingSection(prev => ({
                ...prev,
                captionBackgroundColor: value,
                captionBorderColor: value
            }));
        } else {
            setEditingSection(prev => ({
                ...prev,
                [field]: value
            }));
        }
    };

    const handleSave = () => {
        onSave(editingSection);
        onClose();
    };

    const renderTextFields = () => (
        <>
            <div className={styles.formGroup}>
                <label>텍스트 내용</label>
                <textarea
                    value={editingSection.content}
                    onChange={(e) => handleChange('content', e.target.value)}
                    placeholder="텍스트 내용을 입력하세요"
                    className={styles.input}
                    rows={5}
                />
            </div>
            <div className={styles.formGroup}>
                <label>배경색</label>
                <input
                    type="color"
                    value={editingSection.backgroundColor || '#ffffff'}
                    onChange={(e) => handleChange('backgroundColor', e.target.value)}
                    className={styles.colorInput}
                />
            </div>
            <div className={styles.formGroup}>
                <label>텍스트 색상</label>
                <input
                    type="color"
                    value={editingSection.textColor || '#000000'}
                    onChange={(e) => handleChange('textColor', e.target.value)}
                    className={styles.colorInput}
                />
            </div>
            <div className={styles.formGroup}>
                <label>테두리 색상</label>
                <input
                    type="color"
                    value={editingSection.borderColor || '#ffffff'}
                    onChange={(e) => handleChange('borderColor', e.target.value)}
                    className={styles.colorInput}
                />
            </div>
        </>
    );

    const renderImageFields = () => (
        <>
            <div className={styles.formGroup}>
                <label>이미지 URL</label>
                <input
                    type="url"
                    value={editingSection.content}
                    onChange={(e) => handleChange('content', e.target.value)}
                    placeholder="이미지 URL을 입력하세요"
                    className={styles.input}
                />
            </div>
            <div className={styles.formGroup}>
                <label>테두리 색상</label>
                <input
                    type="color"
                    value={editingSection.borderColor || '#ffffff'}
                    onChange={(e) => handleChange('borderColor', e.target.value)}
                    className={styles.colorInput}
                />
            </div>
            <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                    <input
                        type="checkbox"
                        checked={!!editingSection.caption}
                        onChange={(e) => {
                            if (!e.target.checked) {
                                const newSection = { ...editingSection };
                                delete newSection.caption;
                                delete newSection.captionBackgroundColor;
                                delete newSection.captionTextColor;
                                delete newSection.captionBorderColor;
                                setEditingSection(newSection);
                            } else {
                                handleChange('caption', '');
                                handleChange('captionBackgroundColor', '#000000');
                                handleChange('captionTextColor', '#ffffff');
                                handleChange('captionBorderColor', '#000000');
                            }
                        }}
                    />
                    설명 텍스트 추가
                </label>
            </div>
            {editingSection.caption !== undefined && (
                <>
                    <div className={styles.formGroup}>
                        <label>설명 텍스트</label>
                        <textarea
                            value={editingSection.caption || ''}
                            onChange={(e) => handleChange('caption', e.target.value)}
                            placeholder="이미지 설명 텍스트를 입력하세요"
                            className={`${styles.input} ${styles.captionTextarea}`}
                            rows={3}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>설명 텍스트 배경색</label>
                        <input
                            type="color"
                            value={editingSection.captionBackgroundColor || '#000000'}
                            onChange={(e) => handleChange('captionBackgroundColor', e.target.value)}
                            className={styles.colorInput}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>설명 텍스트 색상</label>
                        <input
                            type="color"
                            value={editingSection.captionTextColor || '#ffffff'}
                            onChange={(e) => handleChange('captionTextColor', e.target.value)}
                            className={styles.colorInput}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>설명 텍스트 테두리 색상</label>
                        <input
                            type="color"
                            value={editingSection.captionBorderColor || '#000000'}
                            onChange={(e) => handleChange('captionBorderColor', e.target.value)}
                            className={styles.colorInput}
                        />
                    </div>
                </>
            )}
            <div className={styles.formGroup}>
                <label>클릭 시 이동할 URL (선택사항)</label>
                <input
                    type="url"
                    value={editingSection.url || ''}
                    onChange={(e) => handleChange('url', e.target.value)}
                    placeholder="https://"
                    className={styles.input}
                />
            </div>
            {editingSection.content && (
                <div className={styles.previewContainer}>
                    <img 
                        src={editingSection.content}
                        alt="미리보기"
                        className={styles.preview}
                    />
                </div>
            )}
        </>
    );

    const renderVideoFields = () => (
        <>
            <div className={styles.formGroup}>
                <label>YouTube 동영상 URL</label>
                <input
                    type="url"
                    value={editingSection.content}
                    onChange={(e) => handleChange('content', e.target.value)}
                    placeholder="YouTube 동영상 URL을 입력하세요"
                    className={styles.input}
                />
            </div>
            <div className={styles.formGroup}>
                <label>테두리 색상</label>
                <input
                    type="color"
                    value={editingSection.borderColor || '#ffffff'}
                    onChange={(e) => handleChange('borderColor', e.target.value)}
                    className={styles.colorInput}
                />
            </div>
            <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                    <input
                        type="checkbox"
                        checked={!!editingSection.caption}
                        onChange={(e) => {
                            if (!e.target.checked) {
                                const newSection = { ...editingSection };
                                delete newSection.caption;
                                delete newSection.captionBackgroundColor;
                                delete newSection.captionTextColor;
                                delete newSection.captionBorderColor;
                                setEditingSection(newSection);
                            } else {
                                handleChange('caption', '');
                                handleChange('captionBackgroundColor', '#000000');
                                handleChange('captionTextColor', '#ffffff');
                                handleChange('captionBorderColor', '#000000');
                            }
                        }}
                    />
                    설명 텍스트 추가
                </label>
            </div>
            {editingSection.caption !== undefined && (
                <>
                    <div className={styles.formGroup}>
                        <label>설명 텍스트</label>
                        <textarea
                            value={editingSection.caption || ''}
                            onChange={(e) => handleChange('caption', e.target.value)}
                            placeholder="동영상 설명 텍스트를 입력하세요"
                            className={`${styles.input} ${styles.captionTextarea}`}
                            rows={3}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>설명 텍스트 배경색</label>
                        <input
                            type="color"
                            value={editingSection.captionBackgroundColor || '#000000'}
                            onChange={(e) => handleChange('captionBackgroundColor', e.target.value)}
                            className={styles.colorInput}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>설명 텍스트 색상</label>
                        <input
                            type="color"
                            value={editingSection.captionTextColor || '#ffffff'}
                            onChange={(e) => handleChange('captionTextColor', e.target.value)}
                            className={styles.colorInput}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>설명 텍스트 테두리 색상</label>
                        <input
                            type="color"
                            value={editingSection.captionBorderColor || '#000000'}
                            onChange={(e) => handleChange('captionBorderColor', e.target.value)}
                            className={styles.colorInput}
                        />
                    </div>
                </>
            )}
            <div className={styles.formGroup}>
                <label>캡션 클릭 시 이동할 URL (선택사항)</label>
                <input
                    type="url"
                    value={editingSection.url || ''}
                    onChange={(e) => handleChange('url', e.target.value)}
                    placeholder="https://"
                    className={styles.input}
                />
            </div>
            {editingSection.content && (
                <div className={styles.videoPreviewContainer}>
                    <iframe
                        src={editingSection.content.replace('watch?v=', 'embed/')}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className={styles.videoPreview}
                    />
                </div>
            )}
        </>
    );

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <button className={styles.closeButton} onClick={onClose}>×</button>
                <h2 className={styles.modalTitle}>섹션 설정</h2>
                <div className={styles.modalBody}>
                    <div className={styles.formGroup}>
                        <label>섹션 타입</label>
                        <select
                            value={editingSection.type}
                            onChange={(e) => handleChange('type', e.target.value)}
                            className={styles.select}
                        >
                            <option value="text">텍스트</option>
                            <option value="image">이미지</option>
                            <option value="video">동영상</option>
                        </select>
                    </div>
                    {editingSection.type === 'text' && renderTextFields()}
                    {editingSection.type === 'image' && renderImageFields()}
                    {editingSection.type === 'video' && renderVideoFields()}
                </div>
                <div className={styles.modalFooter}>
                    <button className={styles.saveButton} onClick={handleSave}>저장</button>
                    <button className={styles.cancelButton} onClick={onClose}>취소</button>
                </div>
            </div>
        </div>
    );
};

export default SectionEditModal; 