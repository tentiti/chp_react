import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';
import './CreateCharacter.css';

const PostcardCreation = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { selectedBackground, gifUrl } = location.state || {};

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

            const response = await axios.post('https://localhost:8000/submit-postcard', postData);
            console.log('sent:', postData);
            const postcardId = response.data.id; // 서버에서 반환된 ID
            console.log('Backend response:', response.data);

            navigate(`/postcardview/${postcardId}`);

        } catch (error) {
            console.error('Error submitting postcard:', error);
            alert('포스트카드 제출 중 오류가 발생했습니다. 다시 시도해주세요.');
        }
    };

    return (
        <div>
            <Header title="포스트카드 만들기" />
            <div id="container" style={{ 
                position: 'relative', 
                width: '100%', 
                height: '100vh', 
                fontFamily: 'Cafe24SimplehaeOTF-Regular, sans-serif',
                backgroundColor: '#f0f0f0'
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
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                    }}
                />

                {/* Title and Number */}
                <div style={{
                    position: 'absolute',
                    left: '50%',
                    top: 'calc(50% - 240px)',
                    transform: 'translateX(-50%)',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#333',
                }}>
                    '나'의 춤 추러 가기
                </div>
                <div style={{
                    position: 'absolute',
                    left: '50%',
                    top: 'calc(50% - 210px)',
                    transform: 'translateX(-50%)',
                    fontSize: '14px',
                    color: '#555',
                }}>
                    NO. 
                    <input
                        type="text"
                        value={number}
                        onChange={(e) => setNumber(e.target.value)}
                        style={{
                            width: '50px',
                            border: 'none',
                            borderBottom: '1px solid #555',
                            background: 'transparent',
                            fontSize: '14px',
                            outline: 'none',
                            textAlign: 'center'
                        }}
                    />
                </div>

                {/* Main text */}
                <div style={{
                    position: 'absolute',
                    width: '280px',
                    left: '50%',
                    top: 'calc(50% - 170px)',
                    transform: 'translateX(-50%)',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    color: '#333',
                    textAlign: 'center',
                }}>
                    이제 춤을 추러 가봅시다.<br /><br />
                    우리의 춤판엔 어떤 사람들이 모였을까요?<br /><br />
                    우리는 어떤 춤을 추게 될까요?
                </div>

                {/* Selected background */}
                {selectedBackground && (
                    <div
                        style={{
                            position: 'absolute',
                            width: '127px',
                            height: '158px',
                            left: 'calc(50% + 50px)',
                            top: 'calc(50% - 50px)',
                            backgroundImage: `url(https://placehold.co/127x158?text=${selectedBackground})`,
                            backgroundSize: 'cover',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
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
                            left: 'calc(50% + 85px)',
                            top: 'calc(50% - 15px)',
                            objectFit: 'cover',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                    />
                )}

                {/* Instruction text */}
                <div style={{
                    position: 'absolute',
                    width: '280px',
                    left: '50%',
                    top: 'calc(50% + 130px)',
                    transform: 'translateX(-50%)',
                    fontSize: '14px',
                    textAlign: 'center',
                    lineHeight: '1.6',
                    color: '#333',
                }}>
                    춤을 추실 준비가 되셨나요?<br />
                    마지막으로 이름과 한마디를 적어주세요.
                </div>

                {/* Name and comment inputs */}
                <div style={{
                    position: 'absolute',
                    left: '50%',
                    top: 'calc(50% + 190px)',
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
                            width: '200px',
                            marginLeft: '10px',
                            border: 'none',
                            borderBottom: '1px solid #555',
                            background: 'transparent',
                            fontSize: '14px',
                            outline: 'none',
                        }}
                    />
                </div>
                <div style={{
                    position: 'absolute',
                    left: '50%',
                    top: 'calc(50% + 220px)',
                    transform: 'translateX(-50%)',
                    fontSize: '14px',
                    color: '#333',
                    width: '280px'
                }}>
                    한마디 : 
                    <input
                        type="text"
                        value={comment}
                        onChange={handleCommentChange}
                        maxLength={90}
                        style={{
                            width: '200px',
                            marginLeft: '10px',
                            border: 'none',
                            borderBottom: '1px solid #555',
                            background: 'transparent',
                            fontSize: '14px',
                            outline: 'none',
                        }}
                    />
                    <div style={{ fontSize: '12px', color: '#777', marginTop: '5px', textAlign: 'right' }}>
                        {comment.length}/90
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    onClick={handleSubmit}
                    style={{
                        position: 'absolute',
                        left: '50%',
                        bottom: '20px',
                        transform: 'translateX(-50%)',
                        width: '200px',
                        height: '40px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        fontSize: '16px',
                        cursor: 'pointer',
                        transition: 'background-color 0.3s',
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
                >
                    포스트카드 제출
                </button>
            </div>
        </div>
    );
};

export default PostcardCreation;