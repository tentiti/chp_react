import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';
import './CreateCharacter.css';

const modelPositions = [
  { x: 67, y: 150, width: 147, height: 190 },
  { x: 168, y: 102, width: 147, height: 190 },
  { x: 196, y: 65, width: 147, height: 190 },
];

const PostcardCreation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedBackground, gifUrl, realgifUrl, videoFiles } = location.state || {};

  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [isNameEmpty, setIsNameEmpty] = useState(true);
  const [isCommentEmpty, setIsCommentEmpty] = useState(true);

  const handleNameChange = (e) => {
    const value = e.target.value;
    setName(value);
    setIsNameEmpty(value.length === 0);
  };

  const handleCommentChange = (e) => {
    const value = e.target.value;
    if (value.length <= 75) {
      setComment(value);
      setIsCommentEmpty(value.length === 0);
    }
  };

  const handleSubmit = async () => {
    try {
      const currentTime = new Date().toISOString();
      const postData = {
        gifName: realgifUrl,
        name,
        comment,
        timestamp: currentTime,
        selectedBackground,
      };
      const response = await axios.post(`/api/submit-postcard`, postData);
      const postcardId = response.data.id;
      navigate(`/postcardview/${postcardId}`, { state: { videoFiles: videoFiles } });
    } catch (error) {
      console.error('Error submitting postcard:', error);
      alert('포스트카드 제출 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  const currentModelPosition = modelPositions[selectedBackground - 1];

  return (
    <div className="postcard-page">
      <div style={{
          fontFamily: 'Pretendard, sans-serif',
        }}>
        <Header title="답신 보내기" />
      </div>

      <div className="postcard-container">
        <div className="postcard-content">
          <div className="guide-text">
            춤을 추실 준비가 되셨나요?<br />
            마지막으로 이름과 한마디를 적어주세요.
          </div>
          {selectedBackground && (
            <div className="background-container">
              <div 
                className="background-image"
                style={{
                  backgroundImage: `url('/static/stockimages/trans_bg${selectedBackground}.png')`
                }}
              />
              {gifUrl && currentModelPosition && (
                <img
                  src={`/api/uploads/${gifUrl}`}
                  alt="Selected GIF"
                  className="gif-overlay"
                  style={{
                    left: `${(currentModelPosition.x / 322) * 100}%`,
                    top: `${(currentModelPosition.y / 532) * 100}%`,
                    width: `${(currentModelPosition.width / 322) * 100}%`,
                  }}
                />
              )}
            </div>
          )}
          <div className="forms">
            <div className="input-section">
              <div className="input-group">
                <label htmlFor="name">이름 :</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={handleNameChange}
                  className={isNameEmpty ? 'empty' : ''}
                />
              </div>
              <div className="input-group">
                <label htmlFor="comment">한마디 :</label>
                <div className="textarea-container">
                  <div className={`textarea-background ${isCommentEmpty ? '' : 'hidden'}`}></div>
                  <textarea
                    id="comment"
                    maxLength={75}
                    value={comment}
                    onChange={handleCommentChange}
                    className={`lined-textarea ${isCommentEmpty ? 'empty' : ''}`}
                  />
                </div>
                <div className="char-count">{comment.length}/75</div>
              </div>
            </div>
          </div>

          <div id="finalwords">
            이제 춤을 추러 가봅시다.<br />
            우리의 춤판엔 어떤 사람들이 모였을까요?<br />
            우리는 어떤 춤을 추게 될까요?
          </div>
        </div>

      </div>

      <div id="submitcontainer">
          <button className="submit-button" onClick={handleSubmit}>
            포스트카드 제출
          </button>
      </div>
      
      <style jsx>{`
        body{
          overflow: hidden;
        }
        .postcard-page {
          font-family: 'Cafe24Simplehae', sans-serif;
          background-color: #F8F6F1;
          width: 100%;
          min-width: 350px;
          height: auto;
          display: flex;
          flex-direction: column;
          align-items: start;
          aspect-ratio: 331 / 540;

          position: fixed;
          top:0;
          left:0;
          
        }
        .postcard-container {
          position: relative;

          width: 100%;
          aspect-ratio: 331 / 540;

          box-sizing: border-box;
          left: 0;
          margin-bottom: 100px;
        
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          overflow: hidden;
        }
        .postcard-content {
          background-image: url('/static/stockimages/postcard.png');
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center top;
          
          width: 100%;
          height: 100%;

          max-width: 100vw; /* 화면의 가로 크기를 넘지 않도록 설정 */
          max-height: 100vh; /* 화면의 세로 크기를 넘지 않도록 설정 */

          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          margin: 10px;
        }
        .postcard-background {
          width: 100%;
          height: 100%;
          position: absolute;
          top: 0;
          left: 0;
          object-fit: cover;
        }
        .guide-text {
          position: absolute;
          top: 13.5%;
          left: 5%;
          right: 5%;
          font-size: 0.9em;
          color: #333;
          text-align: center;
          line-height: 2;
        }
        .background-container {
          position: absolute;
          top: 30%;
          left: 53%;
          width: 41%;
          height: 32%;
        }
        .background-image {
          width: 100%;
          height: 100%;
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center;
        }
        .gif-overlay {
          position: absolute;
          object-fit: contain;
        }
        .forms {
          width: 55%;
          position: absolute;
          top: 30.5%;
        }
        .input-section {
          position: absolute;
          top: 30%;
          left: 10%;
          right: 10%;
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        .input-group {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        .input-group label {
          font-size: 0.8em;
          color: #333;
          margin-bottom: 5px;
        }
        .input-group input,
        .input-group textarea {
          width: 100%;
          border: none;
          background: transparent;
          font-size: 0.9em;
          outline: none;
          font-family: 'Cafe24Simplehae', sans-serif;
        }
        .input-group input {
          padding: 5px 0;
          border-bottom: 1px solid #555;
          transition: border-bottom 0.3s ease;
        }
        .input-group input:not(.empty) {
          border-bottom: none;
        }
        .textarea-container {
          width: 100%;
          height: 110px;
          position: relative;
        }
        .textarea-background {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          background-image: linear-gradient(transparent 95%, #555 96%);
          background-size: 100% 1.89em;
          z-index: 0;
          transition: opacity 0.3s ease;
        }
        .textarea-background.hidden {
          opacity: 0;
        }
        .input-group textarea.lined-textarea {
          width: 100%;
          height: 100%;
          resize: none;
          background: transparent;
          border: none;
          line-height: 1.8em;
          padding: 0;
          z-index: 1;
        }
        .char-count {
          align-self: flex-end;
          font-size: 0.7em;
          color: #777;
          margin-top: 5px;
        }
        #finalwords {
          position: absolute;
          width: 90%;
          font-size: 0.8em;
          color: #333;
          text-align: center;
          line-height: 2.3;
          bottom: 14.5%;
          left: 50%;
          transform: translateX(-50%);
        }
        #submitcontainer {
          position: fixed;
          bottom: 0;
          width: 100%;
          height: 80px;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: #F8F6F1;
          border-top: 1px solid #E6E1DC;
        }
        .submit-button {
          width: 170px;
          height: 40px;
          background-color: #F8F6F1;
          border: 1px solid #E6E1DC;
          color: #412823;
          font-size: 0.9em;
          cursor: pointer;
          box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.25);
        }
      `}</style>
    </div>
  );
};

export default PostcardCreation;