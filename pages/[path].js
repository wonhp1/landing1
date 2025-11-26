import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function DynamicPage() {
    const router = useRouter();
    const { path } = router.query;
    const [pageData, setPageData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (path) {
            fetchPage();
        }
    }, [path]);

    const fetchPage = async () => {
        try {
            const response = await fetch(`/api/pages/${path}`);
            if (response.ok) {
                const data = await response.json();
                setPageData(data);
            } else {
                setPageData(null);
            }
        } catch (error) {
            console.error('페이지 로딩 실패:', error);
            setPageData(null);
        } finally {
            setLoading(false);
        }
    };

    const renderSection = (section, index) => {
        switch (section.type) {
            case 'text':
                return (
                    <div key={index} style={{
                        padding: '20px',
                        marginBottom: '20px',
                        backgroundColor: section.backgroundColor || 'white',
                        borderRadius: '8px'
                    }}>
                        <div style={{
                            color: section.textColor || '#333',
                            fontSize: section.fontSize || '16px',
                            whiteSpace: 'pre-wrap'
                        }}>
                            {section.content}
                        </div>
                    </div>
                );
            case 'image':
                return (
                    <div key={index} style={{ marginBottom: '20px', textAlign: 'center' }}>
                        <img
                            src={section.content}
                            alt={section.caption || ''}
                            style={{ maxWidth: '100%', borderRadius: '8px' }}
                        />
                        {section.caption && (
                            <p style={{ marginTop: '10px', color: '#666' }}>{section.caption}</p>
                        )}
                    </div>
                );
            case 'video':
                return (
                    <div key={index} style={{ marginBottom: '20px' }}>
                        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                            <iframe
                                src={section.content}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: '8px'
                                }}
                            />
                        </div>
                        {section.caption && (
                            <p style={{ marginTop: '10px', color: '#666', textAlign: 'center' }}>{section.caption}</p>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    if (loading) {
        return <div className="container"><p>로딩 중...</p></div>;
    }

    if (!pageData) {
        return (
            <div className="container">
                <div className="card" style={{ marginTop: '100px', textAlign: 'center' }}>
                    <h1>페이지를 찾을 수 없습니다</h1>
                    <p style={{ color: '#666', marginTop: '10px' }}>
                        요청하신 페이지가 존재하지 않습니다.
                    </p>
                    <button
                        className="button"
                        style={{ marginTop: '20px' }}
                        onClick={() => router.push('/')}
                    >
                        홈으로 돌아가기
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <h1>{pageData.title}</h1>
            <div style={{ marginTop: '40px' }}>
                {pageData.sections && pageData.sections.length > 0 ? (
                    pageData.sections.map((section, index) => renderSection(section, index))
                ) : (
                    <p>이 페이지에는 아직 컨텐츠가 없습니다.</p>
                )}
            </div>
            <div style={{ marginTop: '40px' }}>
                <button
                    className="button"
                    style={{ backgroundColor: '#666', borderColor: '#666' }}
                    onClick={() => router.push('/')}
                >
                    홈으로 돌아가기
                </button>
            </div>
        </div>
    );
}
