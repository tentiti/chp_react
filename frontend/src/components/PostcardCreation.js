import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';
import { UseVideo } from './VideoContext';
import './CreateCharacter.css';

const modelPositions = [
  { x: 67, y: 150, width: 147, height: 190 },
  { x: 168, y: 102, width: 147, height: 190 },
  { x: 196, y: 65, width: 147, height: 190 },
];

const PostcardCreation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedBackground, gifUrl, videoFiles } = location.state || {};
  const [backgroundStyle, setBackgroundStyle] = useState(`linear-gradient(#555, #555) 0 24px, 
    linear-gradient(#555, #555) 0 52px, 
    linear-gradient(#555, #555) 0 80px, 
    linear-gradient(#555, #555) 0 108px`);

  const [name, setName] = useState('');
  const [comment, setComment] = useState('');

  const handleCommentChange = (e) => {
    setComment(e.target.value);
    if (e.target.value.length >= 1) {
        setBackgroundStyle('none'); // 배경 제거
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
      // const response = await axios.post(`${process.env.REACT_APP_API_URL}/submit-postcard`, postData);

      const response = await axios.post(`/api/submit-postcard`, postData);
      const postcardId = response.data.id;
      navigate(`/postcardview/${postcardId}`, { state: { videoFiles: videoFiles } });
    } catch (error) {
      console.error('Error submitting postcard:', error);
      alert('포스트카드 제출 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  const currentModelPosition = modelPositions[selectedBackground - 1];

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
              width: `${backgroundWidth}px`,
              height: `${backgroundHeight}px`,
              left: '200px',
              top: 'calc(320px - 10%)',
              backgroundImage: `url('/static/stockimages/bg${selectedBackground}.png')`,
              backgroundSize: 'cover',
            }}
          >
            {/* GIF */}
            {gifUrl && currentModelPosition && (
              <img
              src={`/api/uploads/${gifUrl}`}
                alt="Selected GIF"
                style={{
                  position: 'absolute',
                  left: `${(currentModelPosition.x / 375) * backgroundWidth}px`,
                  top: `${(currentModelPosition.y / 375) * backgroundHeight}px`,
                  width: `${(54 / currentModelPosition.width) * backgroundWidth}px`,
                  height: `${(70 / currentModelPosition.height) * backgroundHeight}px`,
                  objectFit: 'cover',
                }}
              />
            )}
          </div>
        )}

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

          <div style={{ display: 'flex', flexDirection: 'row', marginTop: '12px' }}>
            한마디 :
            <textarea
              maxLength={85}
              rows={4}
              value={comment}
              onChange={handleCommentChange}
              style={{
                marginTop: '-7px',
                marginLeft: '5px',
                width: '90px',
                height: '110px', // 대략 4줄의 높이
                padding: '0',
                border: 'none',
                background:backgroundStyle,
                backgroundSize: '90px 1px',
                backgroundRepeat: 'no-repeat',
                lineHeight: '29px', // 줄 간격 설정
                fontSize: '14px',
                fontFamily: 'Cafe24Simplehae, sans-serif',
                resize: 'none',
                outline: 'none',
                overflowY: 'hidden',
              }}
            />
          </div>

          <div style={{ fontSize: '12px', color: '#777', marginTop: '10px', textAlign: 'left' }}>
            {comment.length}/85
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
