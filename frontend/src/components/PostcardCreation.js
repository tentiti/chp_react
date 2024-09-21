import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';
import './CreateCharacter.css';

const modelPositions = [
  { x: 20.85, y: 28.20, width: 45.79, height: 35.71 },
  { x: 52.33, y: 19.17, width: 45.79, height: 35.71 },
  { x: 61.06, y: 12.22, width: 45.79, height: 35.71 },
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
      <div className="header-container">
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
                    left: `${currentModelPosition.x}%`,
                    top: `${currentModelPosition.y}%`,
                    width: `${currentModelPosition.width}%`,
                    height: `${currentModelPosition.height}%`,
                  }}
                />
              )}
            </div>
          )}
          <div className="forms">
            <div className="input-section">
              <div id="input-name">
                <label htmlFor="name">이름 :</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={handleNameChange}
                  className={isNameEmpty ? 'empty' : ''}
                />
              </div>
              <div id="input-comment">
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
        .postcard-page {
          font-family: 'Cafe24Simplehae', sans-serif;
          
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: fixed;
          top: 0;
          left: 0;

          // background-color: yellowgreen;
        }
        .header-container {
          position: absolute;
          top:0;
          width: 100%;
          height: 58px;
          font-family: 'Pretendard', sans-serif;
        }
        .postcard-container {
          width: 100%;
          
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;

          // background: salmon;
        }

        .postcard-content {
          margin-top: 68px;
          margin-bottom: 90px;
          margin-left: 20px;
          margin-right: 20px;

          background-image: url('/static/stockimages/postcard.png');
          background-size: contain; /* 이미지가 비율을 유지하며 축소/확대됨 */
          background-repeat: no-repeat;
          background-position: center;
          
          width: 100%; /* 부모 요소 너비에 맞춤 */
          max-width: 390px; /* 최대 너비 390px로 제한 */
          aspect-ratio: 331 / 540; /* 비율 유지 */
          
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          
          // box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          // background-color: yellow; /* 이미지가 채워지지 않은 부분에 노란 배경 */
        }

        .guide-text {
          position: absolute;
          top: 13.6%;
          left: 5%;
          right: 5%;
          font-size: 12px;
          color: #333;
          text-align: center;
          line-height: 2;
        }

        .background-container {
          position: absolute;
          top: 30%;
          left: 49%;
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
          position: absolute;
          top: 30%;
          left: 15%;
          width: 35%;
          height: 40%;
          // background: blue;
          font-family: "Cafe24Simplehae";
          font-size: 12px;
          line-height: 2;
        }
        .input-section {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: start;
          width: 100%;
        }
        #input-name {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          width: 100%;
        }
        #input-name label {
          font-size: 12px;
          line-height: 2;
          color: #333;
          margin-bottom: 1%;
          width: 100%;
        }
       #input-name input {
          font-family: "Cafe24Simplehae";
          font-size: 12px;
          line-height: 2;
          width: 100%;
          border-bottom: 1px solid #555;
          transition: border-bottom 0.3s ease;
        }
      #input-name input:not(.empty) {
        border-bottom: none;
      }

      #input-comment {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
      }

      #input-comment label {
          font-size: 12px;
          line-height: 2;
          color: #333;
        }
       #input-comment textarea {
          width: 100%;
          border: none;
          height: 90px;
          background: transparent;

          margin-top:-5px;
          
          line-height: 2;
          outline: none;
          font-family: 'Cafe24Simplehae', sans-serif;
          font-size: 12px;
          // background: orange;

          background-image: linear-gradient(transparent 95%, #555 96%);
          background-size: 100% 25%;
        }

        .textarea-container {
          width: 100%;
          height: 90px;
          // background: red;
        }

        .textarea-background.hidden {
          opacity: 0;
        }
        .input-group textarea.lined-textarea {
          width: 100%;
          height: 150px;
          resize: none;
          background: transparent;
          border: none;
          line-height: 2;
          padding: 0;
          z-index: 1;
        }
        .char-count {
          align-self: flex-end;
          font-size: 12px;
          color: #777;
          margin-top: 1%;
        }
        #finalwords {
          position: absolute;
          width: 90%;
          font-size: 12px;
          color: #333;
          text-align: center;
          line-height: 2;
          bottom: 14.5%;
          left: 50%;
          transform: translateX(-50%);
        }
        #submitcontainer {
          position: absolute;
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
          height: 35px;
          background-color: #F8F6F1;
          border: 1px solid #E6E1DC;
          color: #412823;
          font-size: 12px;
          cursor: pointer;
          box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.25);
        }
      `}</style>
    </div>
  );
};

export default PostcardCreation;