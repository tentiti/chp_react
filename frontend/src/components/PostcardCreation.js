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
    <div className="postcard-page" style={{
      overflow: 'hidden',
    }}>
      <div style={{
          fontFamily: 'Pretendard, sans-serif',
        }}>
      <Header title="답신 보내기" 
        />
        </div>

      <div className="postcard-container">
        <div className="postcard-content" style={{
            fontWeight: 'bold',
          }}>
          <img
            src="../static/stockimages/postcard.png"
            alt="Postcard Background"
            className="postcard-background"
          />
          <div className="guide-text" >
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
          <div className="forms" style={{
            width: '48%'
          }}>
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
        <div id="submitcontainer">
          <button className="submit-button" onClick={handleSubmit}>
            포스트카드 제출
          </button>
        </div>
      </div>
      <style jsx>{`
        .postcard-page {
          font-family: 'Cafe24Simplehae', sans-serif;
          background-color: #F8F6F1;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .postcard-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px;
          box-sizing: border-box;
        }
        .postcard-content {
          width: 322px;
          height: 532px;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
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
          top: 13%;
          left: 5%;
          right: 5%;
          font-size: 0.7em;
          color: #333;
          text-align: center;
          line-height: 2.4;
        }
        .background-container {
          position: absolute;
          top: 30.5%;
          left: 52%;
          width: 42%;
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
        .input-section {
          position: absolute;
          top: 30%;
          left: 10%;
          right: 10%;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .input-group {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        .input-group label {
          font-size: 0.7em;
          color: #333;
          margin-bottom: 4.4%;
        }
        .input-group input,
        .input-group textarea {
          width: 50%;
          border: none;
          background: transparent;
          font-size: 0.7em;
          outline: none;
          font-family: 'Cafe24Simplehae', sans-serif;
        }
        .input-group input {
          margin-left: 2%;
          width: 48%;
          margin-top: 1%;
          margin-bottom: 2%;
          padding: 2px 0;
          border-bottom: 1px solid #555;
          transition: border-bottom 0.3s ease;
        }
        .input-group input:not(.empty) {
          border-bottom: none;
        }
        .textarea-container {
          position: absolute;
          width: 50%;
          top: 99%;
          height: 170px;
        }

        .textarea-background {
          position: absolute;
          top: -5%;
          left: 5%;
          right: 0;
          bottom: 0;
          pointer-events: none;
          height: calc(1.7rem * 4);
          background-image: 
            linear-gradient(transparent 95%, #555 96%);
          background-size: 100% 1.7rem;
          z-index: 0;
          transition: opacity 0.3s ease;
        }
        .textarea-background.hidden {
          opacity: 0;
        }

        .input-group textarea.lined-textarea {
          position: relative;
          width: 100%;
          height: 100%;
          resize: none;
          background: transparent;
          border: none;
          line-height: 1.7rem;
          padding: 0 3px;
          z-index: 1;
          font-family: 'Cafe24Simplehae', sans-serif;
          color: #333;
        }

        .char-count {
          position: absolute;
          top: 68%;
          left: 40%;
          font-size: 0.7em;
          color: #777;
          text-align: right;
        } 

        #finalwords {
          position: absolute;
          width: 281px;
          height: 80px;
          font-size: 0.7rem;
          color: #333;
          text-align: center;
          line-height: 2.45;
          letter-spacing: -0.5px;
          top: 70%;
          left: 50%;
          transform: translateX(-50%);
        }

        #submitcontainer {
          position: fixed;
          bottom: 0;
          height: 60px;
          display: flex;
          justify-content: center !important;
          align-items: center !important;
          border-top: 1px solid #E6E1DC;
          width: 100%;
        }
        .submit-button {
          width: 170px;
          height: 35px;
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