import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';
import './CreateCharacter.css';
import Invitation from './Invitation';

const modelPositions = [
  { x: 20.85, y: 28.20, width: 45.79, height: 35.71 },
  { x: 52.33, y: 19.17, width: 45.79, height: 35.71 },
  { x: 61.06, y: 12.22, width: 45.79, height: 35.71 },
];

//동적인 글자크기


const PostcardCreation = () => {

  const postcardRef = useRef(null); // Ref for postcard container
  const [fontSize, setFontSize] = useState('12px'); // State for font size


  useEffect(() => {
    const updateFontSize = () => {
      if (postcardRef.current) {
        const parentWidth = postcardRef.current.offsetHeight; // Get parent width
        const newFontSize = `${((parentWidth / 532) * (12)).toFixed(2)}px`; // Calculate font size
        setFontSize(newFontSize); // Update font size state
        // alert(newFontSize);
      }
    };

    updateFontSize(); // Initial calculation
    window.addEventListener('resize', updateFontSize); // Update on resize

    return () => {
      window.removeEventListener('resize', updateFontSize); // Clean up on unmount
    };
  }, []);

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
    setIsCommentEmpty(false); 
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

  const [isInvitationVisible, setIsInvitationVisible] = useState(false); // Invitation의 가시성을 관리하는 상태

  const handleMenuClick = () => {
    // alert('메뉴 클릭');
    setIsInvitationVisible(true);
    // setIsFloatingVisible(false); // Invitation을 보이면 플로팅 버튼을 숨김
  };

  // Invitation을 숨기고 원래 화면으로 돌아가는 함수 (뒤로가기 클릭 시 호출됨)
  const handleBackClick = () => {
    setIsInvitationVisible(false);
    // setIsFloatingVisible(true); // Invitation을 숨기고 플로팅 버튼을 다시 보이게 함
  };

  return (
    <div className="postcard-page">

        {/* Invitation이 보일 때 */}
  {isInvitationVisible && (
    <div
      className={`invitation-container ${
        isInvitationVisible ? "visible" : ""
      }`}
      style={{ zIndex: "1000" }}
    >
      <Invitation onBack={handleBackClick} /> {/* Invitation 컴포넌트 및 뒤로가기 핸들러 */}
    </div>
  )}
  
      <div className="header-container">
        <Header title="답신 보내기" onMenuClick={handleMenuClick} />
      </div>

      <div className="postcard-container">
        <div className="postcard-content" ref={postcardRef} style={{
          fontWeight: 'bold',
          fontSize: fontSize,
          lineHeight: '2.3',
          letterSpacing: '-0.5px', /* 자간 -0.5px */
          fontFamily: 'Cafe24Simplehae',
          color:'#412823',
          backgroundImage: isCommentEmpty? "url('/static/stockimages/postcard_underlined.png')" : "url('/static/stockimages/postcard.png')" ,
          
          // color:'pink',
        }}>
          
          {/* <div className="guide-text">
            춤을 추실 준비가 되셨나요?<br />
            마지막으로 이름과 한마디를 적어주세요.
          </div> */}
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

          <div className="input-section">
              <div id="input-name">
                {/* <label htmlFor="name">이름 :</label> */}
                <label htmlFor="name"> </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={handleNameChange}
                  className={isNameEmpty ? 'empty' : ''}
                />
              </div>
              <div id="input-comment">
                {/* <label htmlFor="comment">한마디 :</label> */}
                <label htmlFor="comment"> </label>
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

          {/* <div id="finalwords">
            이제 춤을 추러 가봅시다.<br />
            우리의 춤판엔 어떤 사람들이 모였을까요?<br />
            우리는 어떤 춤을 추게 될까요?
          </div> */}
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

          background-size: contain; /* 이미지가 비율을 유지하며 축소/확대됨 */
          background-repeat: no-repeat;
          background-position: center;

          filter: drop-shadow(0 4px 4px rgba(0, 0, 0, 0.5));

          aspect-ratio: 1292 / 2132 !important; /* 비율 유지 */
          
          width: 100%; /* 부모 요소 너비에 맞춤 */
          max-width: 390px; /* 최대 너비 390px로 제한 */
          max-height: calc(100% - 180px); /* 최대 높이 640px로 제한 */
          
          
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          
          // box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          // background-color: yellow; /* 이미지가 채워지지 않은 부분에 노란 배경 */
        }

        @media (min-width: 768px) {
          .postcard-content {
            width: 331px; /* Adjust for pc screens to fit better */
          }
        }

        .guide-text {
          position: absolute;
          top: 13%;
          left:0;
          width:100%;

          text-align: center;
          vertical-align: top;
          
        }

        #finalwords {
          position: absolute;
          top: 70%;
          width : 100%;
          text-align : center;
        }

        
        .background-container {
          position: absolute;
          top: 29%;
          left: 50%;
          width: 45%;
          height: 36%;
          // background-color: purple;
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
          top:28.7%;
          left: 10%;
          width: 36%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: start;

          margin-right: 20px;
        }

        #input-name {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          width: 100%;
        }
        #input-name label {
          font-size: 1em;
          width: 100%;
        }
       #input-name input {
          position: absolute;
          top: 1.5%;
          right: 10%;
          width: 65%;
        
          font-family: "Cafe24Simplehae";
          font-size: 1em;
          font-weight: bold;
          line-height: 1;
          color: #412823;
          background: transparent; /* 배경을 투명하게 설정 */
          border: none; /* 기본 border 제거 */
          outline: none; /* 클릭 시 나타나는 기본 outline 제거 */
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
          margin-top: 5.8%;
          font-size: 1em;
          line-height: 2;
          color: #333;
          margin-bottom: 45.6%;
        }

       #input-comment textarea {
          position: absolute;
          width: 100%;
          left: -2%;
          border: none;
          height: 26%;
          background: transparent;
          overflow: hidden;
          margin-top:-5%;

          vertical-align: bottom;
          
          outline: none;
          font-family: 'Cafe24Simplehae', sans-serif;
          font-size: calc(1rem * 0.9);
          line-height: calc(1rem * 1.7);
          font-weight: bold;
          color: #412823;
          resize: none;


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
          position: absolute;
          top: 5.7%;
          align-self: flex-end;
          font-size: 12px;
          color: #777;
          margin-top: 1%;
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
          .hidden {
        opacity: 0;
        visibility: hidden;
      }

      `}</style>
    </div>
  );
};

export default PostcardCreation;