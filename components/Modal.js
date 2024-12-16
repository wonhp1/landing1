import React from 'react';

const Modal = ({ isOpen, onClose, imageUrl }) => {
    if (!isOpen) return null;

    // 이미지 저장 함수
    const handleDownload = (e) => {
        e.stopPropagation(); // 이벤트 전파 중단
        try {
            const link = document.createElement('a');
            link.href = imageUrl;
            link.download = `운동일지_${new Date().getTime()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('이미지 다운로드 중 오류 발생:', error);
            alert('이미지 다운로드에 실패했습니다.');
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content">
                <img 
                    src={imageUrl} 
                    alt="운동일지 상세" 
                    className="modal-image"
                    onClick={onClose}
                />
                <div className="button-container">
                    <button 
                        className="modal-button save-button" 
                        onClick={handleDownload}
                    >
                        이미지 저장
                    </button>
                    <button 
                        className="modal-button close-button" 
                        onClick={onClose}
                    >
                        닫기
                    </button>
                </div>
            </div>

            <style jsx>{`
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(0, 0, 0, 0.7);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                }

                .modal-content {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 15px;
                    padding: 20px;
                }

                .modal-image {
                    max-width: 90vw;
                    max-height: 80vh;
                    object-fit: contain;
                    cursor: pointer;
                }

                .button-container {
                    display: flex;
                    gap: 10px;
                    z-index: 1001;
                }

                .modal-button {
                    padding: 8px 20px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 1rem;
                    transition: all 0.2s;
                }

                .save-button {
                    background-color: #4CAF50;
                    color: white;
                }

                .save-button:hover {
                    background-color: #45a049;
                }

                .close-button {
                    background-color: #ffffff;
                }

                .close-button:hover {
                    background-color: #f0f0f0;
                }
            `}</style>
        </div>
    );
};

export default Modal;