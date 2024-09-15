import React, { useEffect, useState } from 'react';
import './Invitation.css';

function Invitation({ onBack }) {
  const [isSlideIn, setIsSlideIn] = useState(false);
  

  useEffect(() => {
    setTimeout(() => setIsSlideIn(true), 50);
  }, []);

  const handleBack = () => {
    setIsSlideIn(false);
    setTimeout(() => onBack(), 700); // 애니메이션이 완료된 후 Back 호출
  };

  return (
    <div className={`invitation-content ${isSlideIn ? 'slide-in' : ''}`}>
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
              onClick={handleBack}
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </div>
          <div style={{ fontSize: '20px' }}>춤 이야기</div>
          <div></div>
        </div>
      </header>

      <img
        src="/static/stockimages/moon.png"
        alt="moon"
        style={{
          position: 'sticky',
          left: '46.06%',
          right: '6.62%',
          top: '14.91%',
          bottom: '64.08%',
          width:'47.33%',
          filter: 'blur(5px)',
          zIndex: 1
        }}
      />

      <div id="inv_text">
        <img 
          src="/static/stockimages/invitext.png" 
          alt="invitation text" 
        />
      </div>

      <div id="letsmakedance">
        <a href="/CreateCharacter" className="ajax-link" id="letsmakedancebutton">
          캐릭터 생성하기
        </a>
      </div>
    </div>
  );
}

export default Invitation;
