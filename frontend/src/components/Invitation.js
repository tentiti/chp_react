import React, { useEffect, useState } from 'react';
import { useNavigate,  } from 'react-router-dom';
import './Invitation.css';

function Invitation() {
  const navigate = useNavigate();
  const [isSlideIn, setIsSlideIn] = useState(false);

  useEffect(() => {
    // 컴포넌트가 마운트된 직후에 슬라이드 인 애니메이션을 트리거합니다
    setTimeout(() => setIsSlideIn(true), 50);
  }, []);

  const handleBack = () => {
    setIsSlideIn(false);
    setTimeout(() => navigate(-1), 700); // 애니메이션이 완료된 후 이동
  };

  return (
    <div className={`invitation-content ${isSlideIn ? 'slide-in' : ''}`}>
    {/* 기존 내용은 그대로 유지 */}
    <div
      className="background"
      style={{
        backgroundImage: 'url("/static/stockimages/invitation_background.png")'
      }}
    ></div>

      <header>
        <div className="titleArea">
          <div>
            <img
              src="/static/icons/back_double.png"
              alt="back"
              id="back-button"
              onClick={() => navigate(-1)}
              style={{ filter: 'brightness(0) invert(1)' }} // Applies a white color effect
            />
          </div>
          <div style={{ fontSize: '20px' }}>춤 이야기</div>
          <div></div>
        </div>
      </header>

      <div id="inv_text">
      <img 
        src="/static/stockimages/invitext.png" 
        alt="invitation text" 
        style={{ 
          width: '100%', 
          height: 'auto' ,
          overflow: 'hidden',
        }} 
      />
    </div>


      <div id="letsmakedance">
        <a href="/GlbTest" className="ajax-link" id="letsmakedancebutton">
          캐릭터 생성하기
        </a>
      </div>
    </div>
  );
}

export default Invitation;