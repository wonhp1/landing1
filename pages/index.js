import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from '../styles/index.module.css';
import { useRouter } from 'next/router';

const Home = () => {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPasswordInput, setShowPasswordInput] = useState(false);
    const [contents, setContents] = useState([]);
    const [pageSettings, setPageSettings] = useState({
        backgroundColor: '#ffffff',
        headerBackgroundColor: '#ffffff',
        headerTextColor: '#000000',
        headerFontSize: '1.2rem',
        headerFontWeight: 'normal',
        headerText: '메인 제목'
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/api/intro-content');
                const data = await response.json();
                setContents(data.contents || []);
                setPageSettings(data.pageSettings || {
                    backgroundColor: '#ffffff',
                    headerBackgroundColor: '#ffffff',
                    headerTextColor: '#000000',
                    headerFontSize: '1.2rem',
                    headerFontWeight: 'normal',
                    headerText: '메인 제목'
                });
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, []);

    const handleLogin = async () => {
        try {
            const response = await fetch('/api/auth/verify-admin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password }),
            });

            const data = await response.json();

            if (data.isValid) {
                router.push('/admin');
            } else {
                setError('비밀번호가 틀렸습니다.');
                setPassword('');
            }
        } catch (error) {
            console.error('Error verifying admin password:', error);
            setError('인증 중 오류가 발생했습니다.');
            setPassword('');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    };

    const togglePasswordInput = () => {
        setShowPasswordInput((prev) => !prev);
        setPassword('');
        setError('');
    };

    const renderSection = (section) => {
        const handleClick = (url) => {
            if (url) {
                window.location.href = url;
            }
        };

        switch (section.type) {
            case 'text':
                return (
                    <div 
                        style={{
                            backgroundColor: section.backgroundColor,
                            color: section.textColor,
                            fontSize: section.fontSize,
                            fontWeight: section.fontWeight,
                            padding: '20px',
                            borderRadius: '10px',
                            margin: '20px 0',
                            textAlign: 'center',
                            border: `1px solid ${section.borderColor || section.backgroundColor || '#ffffff'}`
                        }}
                    >
                        {section.content}
                    </div>
                );
            case 'image':
                return (
                    <div className={styles.imageSection}>
                        <div 
                            className={styles.mediaContainer}
                            onClick={() => handleClick(section.url)}
                            style={{ cursor: section.url ? 'pointer' : 'default' }}
                        >
                            <div 
                                className={styles.imageWrapper}
                                style={{ 
                                    border: `1px solid ${section.borderColor || section.backgroundColor || '#ffffff'}`
                                }}
                            >
                                <img 
                                    src={section.content}
                                    alt="소개 이미지"
                                    className={styles.media}
                                />
                            </div>
                            {section.caption && (
                                <div 
                                    className={styles.caption}
                                    style={{
                                        backgroundColor: section.captionBackgroundColor || '#000000',
                                        color: section.captionTextColor || '#ffffff',
                                        border: `1px solid ${section.captionBorderColor || section.captionBackgroundColor || '#000000'}`
                                    }}
                                >
                                    {section.caption}
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'video':
                return (
                    <div className={styles.videoSection}>
                        <div className={styles.mediaContainer}>
                            <div 
                                className={styles.videoWrapper}
                                style={{ 
                                    border: `1px solid ${section.borderColor || section.backgroundColor || '#ffffff'}`
                                }}
                            >
                                <iframe
                                    src={section.content.includes('youtube.com/watch?v=') 
                                        ? section.content.replace('youtube.com/watch?v=', 'youtube.com/embed/')
                                        : section.content.includes('youtu.be/')
                                        ? section.content.replace('youtu.be/', 'youtube.com/embed/')
                                        : section.content}
                                    title="YouTube video"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
                            {section.caption && (
                                <div 
                                    className={styles.caption}
                                    onClick={() => handleClick(section.url)}
                                    style={{
                                        backgroundColor: section.captionBackgroundColor || '#000000',
                                        color: section.captionTextColor || '#ffffff',
                                        cursor: section.url ? 'pointer' : 'default',
                                        border: `1px solid ${section.captionBorderColor || section.captionBackgroundColor || '#000000'}`
                                    }}
                                >
                                    {section.caption}
                                </div>
                            )}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const renderContent = (content) => {
        if (content.contentType === 'button') {
            return (
                <div key={content.id} className={styles.buttonContainer}>
                    <Link href={content.url}>
                        <button 
                            className={styles.button}
                            style={{
                                backgroundColor: content.backgroundColor,
                                color: content.textColor,
                                borderColor: content.borderColor
                            }}
                        >
                            {content.text}
                        </button>
                    </Link>
                </div>
            );
        } else if (content.contentType === 'section') {
            return (
                <div 
                    key={content.id}
                    className={styles.section}
                    style={{
                        backgroundColor: content.backgroundColor
                    }}
                >
                    {renderSection(content)}
                </div>
            );
        }
    };

    return (
        <div className={styles.container} style={{ backgroundColor: pageSettings.backgroundColor }}>
            <div 
                className={styles.headerContainer}
                style={{
                    backgroundColor: pageSettings.headerBackgroundColor
                }}
            >
                <h1 
                    className={styles.title}
                    style={{
                        color: pageSettings.headerTextColor,
                        fontSize: pageSettings.headerFontSize,
                        fontWeight: pageSettings.headerFontWeight
                    }}
                >
                    {pageSettings.headerText}
                </h1>
            </div>

            <div className={styles.contents}>
                {contents.map(content => renderContent(content))}
            </div>
            
            <div className={styles.adminButtonContainer}>
                <button 
                    onClick={togglePasswordInput}
                    className={`${styles.button} ${styles.adminLoginButton}`}
                    style={{ 
                        fontSize: '0.8rem',
                        padding: '8px 16px'
                    }}
                >
                    관리자 페이지
                </button>
            </div>

            {showPasswordInput && (
                <div className={styles.passwordInputContainer}>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="비밀번호"
                        className={styles.input}
                    />
                    <button 
                        onClick={handleLogin} 
                        className={`${styles.button} ${styles.loginButton}`}
                        style={{ 
                            padding: '8px 16px',
                            fontSize: '0.9rem'
                        }}
                    >
                        로그인
                    </button>
                    {error && <p style={{ color: 'red', fontSize: '0.8rem' }}>{error}</p>}
                </div>
            )}
        </div>
    );
};

export default Home;
