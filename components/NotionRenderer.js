// Simple Notion block renderer without external dependencies
export default function NotionRenderer({ blocks, page }) {
    console.log('NotionRenderer received:', { blocks, page });

    if (!blocks || blocks.length === 0) {
        console.log('No blocks to render');
        return (
            <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                <p>콘텐츠가 없습니다.</p>
            </div>
        );
    }

    const renderBlock = (block) => {
        if (!block) return null;

        const { type, id } = block;
        const value = block[type] || {};

        switch (type) {
            case 'paragraph':
                const paragraphText = value.rich_text?.map(t => t.plain_text).join('') || '';
                return paragraphText ? (
                    <p key={id} style={{ marginBottom: '1em', lineHeight: '1.6' }}>
                        {paragraphText}
                    </p>
                ) : <br key={id} />;

            case 'heading_1':
                return (
                    <h1 key={id} style={{ fontSize: '2em', fontWeight: 'bold', marginTop: '1.5em', marginBottom: '0.5em' }}>
                        {value.rich_text?.map(t => t.plain_text).join('') || ''}
                    </h1>
                );

            case 'heading_2':
                return (
                    <h2 key={id} style={{ fontSize: '1.5em', fontWeight: 'bold', marginTop: '1.5em', marginBottom: '0.5em' }}>
                        {value.rich_text?.map(t => t.plain_text).join('') || ''}
                    </h2>
                );

            case 'heading_3':
                return (
                    <h3 key={id} style={{ fontSize: '1.25em', fontWeight: 'bold', marginTop: '1.5em', marginBottom: '0.5em' }}>
                        {value.rich_text?.map(t => t.plain_text).join('') || ''}
                    </h3>
                );

            case 'bulleted_list_item':
                return (
                    <li key={id} style={{ marginLeft: '1.5em', marginBottom: '0.5em' }}>
                        {value.rich_text?.map(t => t.plain_text).join('') || ''}
                    </li>
                );

            case 'numbered_list_item':
                return (
                    <li key={id} style={{ marginLeft: '1.5em', marginBottom: '0.5em' }}>
                        {value.rich_text?.map(t => t.plain_text).join('') || ''}
                    </li>
                );

            case 'image':
                const imageUrl = value.file?.url || value.external?.url;
                const caption = value.caption?.map(t => t.plain_text).join('') || '';
                return (
                    <div key={id} style={{ margin: '1.5em 0', textAlign: 'center' }}>
                        {imageUrl && (
                            <img
                                src={imageUrl}
                                alt={caption || '이미지'}
                                style={{
                                    maxWidth: '100%',
                                    height: 'auto',
                                    borderRadius: '8px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                }}
                            />
                        )}
                        {caption && (
                            <p style={{ marginTop: '0.5em', fontSize: '0.9em', color: '#666' }}>
                                {caption}
                            </p>
                        )}
                    </div>
                );

            case 'code':
                return (
                    <pre key={id} style={{
                        backgroundColor: '#f5f5f5',
                        padding: '1em',
                        borderRadius: '4px',
                        overflow: 'auto',
                        marginBottom: '1em'
                    }}>
                        <code>{value.rich_text?.map(t => t.plain_text).join('') || ''}</code>
                    </pre>
                );

            case 'quote':
                return (
                    <blockquote key={id} style={{
                        borderLeft: '4px solid #007AFF',
                        paddingLeft: '1em',
                        marginLeft: 0,
                        color: '#666',
                        fontStyle: 'italic',
                        marginBottom: '1em'
                    }}>
                        {value.rich_text?.map(t => t.plain_text).join('') || ''}
                    </blockquote>
                );

            case 'divider':
                return <hr key={id} style={{ margin: '2em 0', border: 'none', borderTop: '1px solid #ddd' }} />;

            default:
                console.log('Unsupported block type:', type, block);
                return null;
        }
    };

    return (
        <div style={{
            fontSize: '16px',
            lineHeight: '1.6',
            color: '#333',
            wordBreak: 'break-word'
        }}>
            {blocks.map(renderBlock)}
        </div>
    );
}
