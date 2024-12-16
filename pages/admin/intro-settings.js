import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '../../styles/intro-settings.module.css';
import SectionEditModal from '../../components/SectionEditModal';
import ButtonEditModal from '../../components/ButtonEditModal';

const IntroSettings = () => {
    const router = useRouter();
    const [contents, setContents] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [editingSection, setEditingSection] = useState(null);
    const [editingButton, setEditingButton] = useState(null);
    const [pageSettings, setPageSettings] = useState({
        backgroundColor: '#ffffff',
        headerBackgroundColor: '#ffffff',
        headerTextColor: '#000000',
        headerFontSize: '1.2rem',
        headerFontWeight: 'normal',
        headerText: '제목없음'
    });
    const [editingPageSettings, setEditingPageSettings] = useState(false);

    useEffect(() => {
        const fetchCurrentSettings = async () => {
            try {
                const response = await fetch('/api/intro-content');
                const data = await response.json();
                
                // 기본값 수정
                const defaultContents = [
                    {
                        id: 1,
                        contentType: 'section',
                        type: 'image',
                        content: '',
                        backgroundColor: '#ffffff',
                        borderColor: '#ffffff',
                        caption: '',
                        captionBackgroundColor: '#000000',
                        captionTextColor: '#ffffff',
                        captionBorderColor: '#000000',
                        url: ''
                    },
                    {
                        id: 2,
                        contentType: 'section',
                        type: 'video',
                        content: '',
                        backgroundColor: '#ffffff',
                        borderColor: '#ffffff',
                        caption: '',
                        captionBackgroundColor: '#000000',
                        captionTextColor: '#ffffff',
                        captionBorderColor: '#000000',
                        url: ''
                    },
                    {
                        id: 3,
                        contentType: 'section',
                        type: 'text',
                        content: '',
                        backgroundColor: '#ffffff',
                        borderColor: '#ffffff',
                        textColor: '#000000',
                        fontSize: '1rem',
                        fontWeight: 'normal'
                    },
                    {
                        id: 4,
                        contentType: 'button',
                        text: '새 버튼',
                        url: '/',
                        backgroundColor: '#ffffff',
                        textColor: '#000000',
                        borderColor: '#e0e0e0'
                    }
                ];

                let initialContents;
                if (data.contents) {
                    initialContents = data.contents;
                } else {
                    initialContents = defaultContents;
                }

                setContents(initialContents);
                setPageSettings(data.pageSettings || {
                    backgroundColor: '#ffffff',
                    headerBackgroundColor: '#ffffff',
                    headerTextColor: '#000000',
                    headerFontSize: '1.2rem',
                    headerFontWeight: 'normal',
                    headerText: '제목없음'
                });
            } catch (error) {
                console.error('Error fetching settings:', error);
            }
        };

        fetchCurrentSettings();
    }, []);

    const handleAddButton = () => {
        const newContent = {
            id: contents.reduce((max, content) => Math.max(max, content.id || 0), 0) + 1,
            contentType: 'button',
            text: '새 버튼',
            url: '/',
            backgroundColor: '#ffffff',
            textColor: '#000000',
            borderColor: '#e0e0e0'
        };
        setContents([...contents, newContent]);
        setEditingButton(newContent);
    };

    const handleAddSection = () => {
        const backgroundColor = '#ffffff';
        const newContent = {
            id: contents.reduce((max, content) => Math.max(max, content.id || 0), 0) + 1,
            contentType: 'section',
            type: 'text',
            content: '',
            backgroundColor: backgroundColor,
            borderColor: backgroundColor,
            textColor: '#000000'
        };
        setContents([...contents, newContent]);
        setEditingSection(newContent);
    };

    const handleSectionSave = (updatedSection) => {
        setContents(prevContents => 
            prevContents.map(content => 
                content.id === updatedSection.id ? updatedSection : content
            )
        );
        setEditingSection(null);
    };

    const handleButtonSave = (updatedButton) => {
        setContents(prevContents => 
            prevContents.map(content => 
                content.id === updatedButton.id ? updatedButton : content
            )
        );
        setEditingButton(null);
    };

    const handleRemoveContent = (index) => {
        setContents(contents.filter((_, i) => i !== index));
    };

    const handleMoveContent = (index, direction) => {
        if (direction === 'up' && index > 0) {
            const newContents = [...contents];
            [newContents[index], newContents[index - 1]] = [newContents[index - 1], newContents[index]];
            setContents(newContents);
        } else if (direction === 'down' && index < contents.length - 1) {
            const newContents = [...contents];
            [newContents[index], newContents[index + 1]] = [newContents[index + 1], newContents[index]];
            setContents(newContents);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setIsLoading(true);
            setSaveError('');
            
            const dataToSave = {
                pageSettings: pageSettings,
                contents: contents
            };

            const response = await fetch('/api/intro-content', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSave)
            });
            
            if (!response.ok) {
                throw new Error('설정 저장 실패');
            }

            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (error) {
            console.error('Error saving settings:', error);
            setSaveError('설정 저장 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePageSettingChange = (field, value) => {
        setPageSettings(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const renderPreview = () => {
        return (
            <div className={styles.previewContainer} 
                style={{ backgroundColor: pageSettings.backgroundColor }}
            >
                <div 
                    className={styles.previewItem}
                >
                    <div className={styles.previewControls}>
                        <button
                            onClick={() => setEditingPageSettings(true)}
                            className={styles.editButton}
                        >
                            수정
                        </button>
                    </div>
                    <div 
                        className={styles.previewHeader}
                        style={{
                            backgroundColor: pageSettings.headerBackgroundColor,
                            color: pageSettings.headerTextColor,
                            fontSize: pageSettings.headerFontSize,
                            fontWeight: pageSettings.headerFontWeight
                        }}
                    >
                        {pageSettings.headerText}
                    </div>
                </div>
                <div className={styles.previewContents}>
                    {contents.map((content, index) => (
                        <div key={content.id} className={styles.previewItem}>
                            <div className={styles.previewControls}>
                                <button
                                    onClick={() => handleMoveContent(index, 'up')}
                                    disabled={index === 0}
                                    className={styles.moveButton}
                                >
                                    ↑
                                </button>
                                <button
                                    onClick={() => handleMoveContent(index, 'down')}
                                    disabled={index === contents.length - 1}
                                    className={styles.moveButton}
                                >
                                    ↓
                                </button>
                                <button
                                    onClick={() => content.contentType === 'button' ? setEditingButton(content) : setEditingSection(content)}
                                    className={styles.editButton}
                                >
                                    수정
                                </button>
                                <button
                                    onClick={() => handleRemoveContent(index)}
                                    className={styles.removeButton}
                                >
                                    삭제
                                </button>
                            </div>
                            {content.contentType === 'button' ? (
                                <button
                                    className={styles.previewButton}
                                    style={{
                                        backgroundColor: content.backgroundColor,
                                        color: content.textColor,
                                        borderColor: content.borderColor
                                    }}
                                >
                                    {content.text}
                                </button>
                            ) : (
                                <div 
                                    className={styles.previewSection}
                                    style={{ backgroundColor: content.backgroundColor }}
                                >
                                    {content.type === 'text' && (
                                        <div 
                                            className={styles.previewText}
                                            style={{ 
                                                color: content.textColor,
                                                backgroundColor: content.backgroundColor,
                                                borderColor: content.borderColor,
                                                border: `1px solid ${content.borderColor || '#e0e0e0'}`
                                            }}
                                        >
                                            {content.content}
                                        </div>
                                    )}
                                    {content.type === 'image' && (
                                        <div className={styles.previewImageContainer}>
                                            <div 
                                                className={styles.imageWrapper}
                                                style={{ 
                                                    border: `1px solid ${content.borderColor || '#e0e0e0'}`
                                                }}
                                            >
                                                <img 
                                                    src={content.content} 
                                                    alt="미리보기" 
                                                    className={styles.previewImage}
                                                />
                                            </div>
                                            {content.caption && (
                                                <div 
                                                    className={styles.previewCaption}
                                                    style={{
                                                        backgroundColor: content.captionBackgroundColor,
                                                        color: content.captionTextColor,
                                                        border: `1px solid ${content.captionBorderColor || '#e0e0e0'}`
                                                    }}
                                                >
                                                    {content.caption}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {content.type === 'video' && (
                                        <div className={styles.previewVideoContainer}>
                                            <div 
                                                className={styles.videoWrapper}
                                                style={{ 
                                                    border: `1px solid ${content.borderColor || '#e0e0e0'}`
                                                }}
                                            >
                                                <iframe
                                                    src={content.content.replace('watch?v=', 'embed/')}
                                                    title="YouTube video"
                                                    frameBorder="0"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                    className={styles.previewVideo}
                                                />
                                            </div>
                                            {content.caption && (
                                                <div 
                                                    className={styles.previewCaption}
                                                    style={{
                                                        backgroundColor: content.captionBackgroundColor,
                                                        color: content.captionTextColor,
                                                        border: `1px solid ${content.captionBorderColor || '#e0e0e0'}`
                                                    }}
                                                >
                                                    {content.caption}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const PageSettingsModal = ({ settings, onSave, onClose }) => {
        const [editingSettings, setEditingSettings] = useState(settings);
    
        const handleChange = (field, value) => {
            setEditingSettings(prev => ({
                ...prev,
                [field]: value
            }));
        };
    
        const handleSave = () => {
            onSave(editingSettings);
            onClose();
        };
    
        return (
            <div className={styles.modalOverlay}>
                <div className={styles.modalContent}>
                    <button className={styles.closeButton} onClick={onClose}>×</button>
                    <h2 className={styles.modalTitle}>페이지 설정</h2>
                    <div className={styles.modalBody}>
                        <div className={styles.formGroup}>
                            <label>페이지 배경색</label>
                            <input
                                type="color"
                                value={editingSettings.backgroundColor}
                                onChange={(e) => handleChange('backgroundColor', e.target.value)}
                                className={styles.colorInput}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>헤더 배경색</label>
                            <input
                                type="color"
                                value={editingSettings.headerBackgroundColor}
                                onChange={(e) => handleChange('headerBackgroundColor', e.target.value)}
                                className={styles.colorInput}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>헤더 텍스트 색상</label>
                            <input
                                type="color"
                                value={editingSettings.headerTextColor}
                                onChange={(e) => handleChange('headerTextColor', e.target.value)}
                                className={styles.colorInput}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>헤더 텍스트 크기</label>
                            <select
                                value={editingSettings.headerFontSize}
                                onChange={(e) => handleChange('headerFontSize', e.target.value)}
                                className={styles.select}
                            >
                                <option value="1rem">작게</option>
                                <option value="1.2rem">보통</option>
                                <option value="1.5rem">크게</option>
                                <option value="2rem">매우 크게</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>헤더 텍스트 굵기</label>
                            <select
                                value={editingSettings.headerFontWeight}
                                onChange={(e) => handleChange('headerFontWeight', e.target.value)}
                                className={styles.select}
                            >
                                <option value="normal">보통</option>
                                <option value="bold">굵게</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>헤더 텍스트 내용</label>
                            <textarea
                                value={editingSettings.headerText}
                                onChange={(e) => handleChange('headerText', e.target.value)}
                                className={`${styles.input} ${styles.textarea}`}
                                placeholder="헤더 텍스트를 입력하세요"
                                rows={3}
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

    return (
        <div className={styles.container}>
            <h1>소개 페이지 설정</h1>
            
            <Link href="/admin" className={styles.backButtonLink}>
                <button className={`${styles.button} ${styles.backButton}`}>
                    관리자 페이지로 돌아가기
                </button>
            </Link>

            <div className={styles.contentControls}>
                <button 
                    onClick={handleAddButton}
                    className={styles.addButton}
                >
                    새 버튼 추가
                </button>
                <button 
                    onClick={handleAddSection}
                    className={styles.addButton}
                >
                    새 섹션 추가
                </button>
            </div>

            {renderPreview()}

            {editingSection && (
                <SectionEditModal
                    section={editingSection}
                    onSave={handleSectionSave}
                    onClose={() => setEditingSection(null)}
                />
            )}

            {editingButton && (
                <ButtonEditModal
                    button={editingButton}
                    onSave={handleButtonSave}
                    onClose={() => setEditingButton(null)}
                />
            )}

            {editingPageSettings && (
                <PageSettingsModal
                    settings={pageSettings}
                    onSave={setPageSettings}
                    onClose={() => setEditingPageSettings(false)}
                />
            )}

            {saveError && <p className={styles.error}>{saveError}</p>}
            {saveSuccess && <p className={styles.success}>설정이 저장되었습니다!</p>}

            <button 
                onClick={handleSubmit}
                className={styles.submitButton}
                disabled={isLoading}
            >
                {isLoading ? '저장 중...' : '설정 저장'}
            </button>
        </div>
    );
};

export default IntroSettings; 