import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';
import './CreateCharacter.css';

const PostcardCreation = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { selectedBackground, gifUrl, videoFiles } = location.state || {};

    const [number, setNumber] = useState('');
    const [name, setName] = useState('');
    const [comment, setComment] = useState('');

    const handleCommentChange = (e) => {
        if (e.target.value.length <= 90) {
            setComment(e.target.value);
        }
    };

    const handleSubmit = async () => {
        try {
            const currentTime = new Date().toISOString();
            const postData = {
                gifName: gifUrl,
                name,
                comment,
                timestamp: currentTime,
                selectedBackground
            };
// 개발용 검증 무시
            const response = await axios.post('/submit-postcard', postData);
            // const response = await axios.post('/submit-postcard', postData, { httpsAgent: new https.Agent({ rejectUnauthorized: false }) });

            console.log('sent:', postData);
            const postcardId = response.data.id; // 서버에서 반환된 ID
            console.log('Backend response:', response.data);

            navigate(`/postcardview/${postcardId}`, { state: {  videoFiles: videoFiles} });

        } catch (error) {
            console.error('Error submitting postcard:', error);
            alert('포스트카드 제출 중 오류가 발생했습니다. 다시 시도해주세요.');
        }
    };

    return (
        <div>
            <Header title="답신 보내기" />
            <div id="container" style={{ 
                position: 'sticky', 
                width: '100%', 
                height: '100vh', 
                fontFamily: 'Cafe24Simplehae, sans-serif',
                backgroundColor: '#F8F6F1'
            }}>
                {/* Postcard background */}
                <img
                    src="../static/stockimages/postcard.png"
                    alt="Postcard Background"
                    style={{
                        position: 'absolute',
                        width: '323px',
                        height: '532px',
                        left: '50%',
                        top: '40%',
                        transform: 'translate(-50%, -50%)',
                    }}
                />

                {/* Main text */}
                <div style={{
                    position: 'absolute',
                    width: '280px',
                    left: '50%',
                    top: 'calc(40% - 195px)',
                    transform: 'translateX(-50%)',
                    fontSize: '14px',
                    lineHeight: '1.9',
                    color: '#333',
                    textAlign: 'center',
                }}>
                    춤을 추실 준비가 되셨나요?<br />
                    마지막으로 이름과 한마디를 적어주세요.
                    
                </div>

                {/* Selected background */}
                {selectedBackground && (
                    <div
                        style={{
                            position: 'absolute',
                            width: '127px',
                            height: '158px',
                            left: '200px',
                            top: 'calc(320px - 10%)',
                            backgroundImage: `url('/static/stockimages/bg${selectedBackground}.png')`, // url()로 감싸줍니다
                            backgroundSize: 'cover',
                        }}
                    />
                )}

                {/* GIF */}
                {gifUrl && (
                    <img
                        src={gifUrl}
                        alt="Selected GIF"
                        style={{
                            position: 'absolute',
                            width: '54px',
                            height: '70px',
                            left: '210px',
                            top: 'calc(370px - 10%)',
                            objectFit: 'cover',
                        }}
                    />
                )}

                {/* Instruction text */}
                <div style={{
                    position: 'absolute',
                    width: '280px',
                    left: '50%',
                    top: 'calc(40% + 107px',
                    transform: 'translateX(-50%)',
                    fontSize: '14px',
                    textAlign: 'center',
                    lineHeight: '1.95',
                    color: '#333',
                }}>
                    이제 춤을 추러 가봅시다.<br />
                    우리의 춤판엔 어떤 사람들이 모였을까요?<br />
                    우리는 어떤 춤을 추게 될까요?
                </div>

                {/* Name and comment inputs */}
                <div style={{
                    position: 'absolute',
                    left: '50%',
                    top: 'calc(340px  - 10%)',
                    transform: 'translateX(-50%)',
                    fontSize: '14px',
                    color: '#333',
                    width: '280px'
                }}>
                    이름 : 
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        style={{
                            width: '90px',
                            marginLeft: '10px',
                            border: 'none',
                            borderBottom: '1px solid #555',
                            background: 'transparent',
                            fontSize: '14px',
                            outline: 'none',
                            fontFamily: "Cafe24Simplehae"
                        }}
                    />
                    <br />
                    한마디 : 
                    <input
                        type="text"
                        value={comment}
                        onChange={handleCommentChange}
                        maxLength={90}
                        style={{
                            width: '76px',
                            marginLeft: '10px',
                            marginTop: '10px',
                            border: 'none',
                            borderBottom: '1px solid #555',
                            background: 'transparent',
                            fontSize: '14px',
                            outline: 'none',
                            fontFamily: "Cafe24Simplehae"
                        }}
                    />
                    <div style={{ fontSize: '12px', color: '#777', marginTop: '10px', textAlign: 'left' }}>
                        {comment.length}/90
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    onClick={handleSubmit}
                    style={{
                        position: 'fixed',
                        left: '50%',
                        bottom: '10%',
                        transform: 'translateX(-50%)',
                        width: '170px',
                        height: '35px',
                        backgroundColor: '#F8F6F1',
                        border: '1px solid E6E1DC',
                        color: '#412823',
                        boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.25)',
                        fontSize: '16px',
                        cursor: 'pointer',
                }}
                >
                    포스트카드 제출
                </button>
            </div>
        </div>
    );
};

export default PostcardCreation;