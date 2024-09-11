import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';
import './CreateCharacter.css';

// modelPositions 배열 정의
const modelPositions = [
  { x: 67, y: 150, width: 147, height: 190 }, // 첫 번째 배경에 대한 모델 위치
  { x: 168, y: 102, width: 147, height: 190 }, // 두 번째 배경에 대한 모델 위치
  { x: 196, y: 65, width: 147, height: 190 }, // 세 번째 배경에 대한 모델 위치
];

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
        selectedBackground,
      };
      const response = await axios.post('/submit-postcard', postData);
      const postcardId = response.data.id;
      navigate(`/postcardview/${postcardId}`, { state: { videoFiles: videoFiles } });
    } catch (error) {
      console.error('Error submitting postcard:', error);
      alert('포스트카드 제출 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  // 선택된 배경에 맞는 modelPosition 가져오기
  const currentModelPosition = modelPositions[selectedBackground - 1]; // 선택된 배경 인덱스에 맞는 위치 정보

  // 배경 이미지 너비 기준으로 비율 계산 함수
  const calculateProportionalPosition = (value, originalSize, currentSize) => {
    return (value / originalSize) * currentSize;
  };

  // 배경 이미지의 실제 너비와 높이
  const backgroundWidth = 127;
  const backgroundHeight = 158;

  return (
    <div>
      <Header title="답신 보내기" />
      <div
        id="container"
        style={{
          position: 'sticky',
          width: '100%',
          height: '100vh',
          fontFamily: 'Cafe24Simplehae, sans-serif',
          backgroundColor: '#F8F6F1',
        }}
      >
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
        <div
          style={{
            position: 'absolute',
            width: '280px',
            left: '50%',
            top: 'calc(40% - 195px)',
            transform: 'translateX(-50%)',
            fontSize: '14px',
            lineHeight: '1.9',
            color: '#333',
            textAlign: 'center',
          }}
        >
          춤을 추실 준비가 되셨나요?<br />
          마지막으로 이름과 한마디를 적어주세요.
        </div>

        {/* Selected background and GIF in a container */}
        {selectedBackground && (
          <div
            style={{
              position: 'relative',
              width: `${backgroundWidth}px`, // 배경의 너비
              height: `${backgroundHeight}px`, // 배경의 높이
              left: '200px',
              top: 'calc(320px - 10%)',
              backgroundImage: `url('/static/stockimages/bg${selectedBackground}.png')`,
              backgroundSize: 'cover',
            }}
          >
            {/* GIF */}
            {gifUrl && currentModelPosition && (
              <img
                src={gifUrl}
                alt="Selected GIF"
                style={{
                  position: 'absolute',
                  // GIF 위치를 배경 너비에 맞게 비례적으로 계산
                  left: `${calculateProportionalPosition(
                    currentModelPosition.x,
                    375,
                    `${backgroundWidth}`
                  )}px`, 
                  top: `${calculateProportionalPosition(
                    currentModelPosition.y,
                    375,
                    `${backgroundWidth}`
                  )}px`, 
                  // GIF 크기도 배경 너비에 맞게 비례적으로 계산
                  width: `${calculateProportionalPosition(54, currentModelPosition.width, backgroundWidth)}px`, 
                  height: `${calculateProportionalPosition(70, currentModelPosition.height, backgroundHeight)}px`, 
                  objectFit: 'cover',
                }}
              />
            )}
          </div>
        )}

        {/* Instruction text */}
        <div
          style={{
            position: 'absolute',
            width: '280px',
            left: '50%',
            top: 'calc(40% + 107px',
            transform: 'translateX(-50%)',
            fontSize: '14px',
            textAlign: 'center',
            lineHeight: '1.95',
            color: '#333',
          }}
        >
          이제 춤을 추러 가봅시다.<br />
          우리의 춤판엔 어떤 사람들이 모였을까요?<br />
          우리는 어떤 춤을 추게 될까요?
        </div>

        {/* Name and comment inputs */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 'calc(340px  - 10%)',
            transform: 'translateX(-50%)',
            fontSize: '14px',
            color: '#333',
            width: '280px',
          }}
        >
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
              fontFamily: 'Cafe24Simplehae',
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
              fontFamily: 'Cafe24Simplehae',
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
