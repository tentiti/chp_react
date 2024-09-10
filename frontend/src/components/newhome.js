import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import './Home.css';

function Home() {
  const containerRef = useRef(null);
  const [postcards, setPostcards] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [showInvitation, setShowInvitation] = useState(false);

  const bannerImages = [
    '/static/stockimages/mainbanner1.png',
    '/static/stockimages/mainbanner2.png',
    '/static/stockimages/mainbanner3.png'
  ];

  useEffect(() => {
    axios.get('/api/postcards')
      .then(response => {
        setPostcards(response.data);
      })
      .catch(error => {
        console.error("There was an error fetching the postcards!", error);
      });

    const imageInterval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % bannerImages.length);
        setFade(true);
      }, 800);
    }, 3000);

    if (showInvitation) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      clearInterval(imageInterval);
      document.body.style.overflow = 'auto';
    };
  }, [showInvitation, bannerImages.length]);

  const handleImageError = (e, num) => {
    e.target.src = `https://placehold.co/200x200?text=error! ${num}`;
  };

  const handleInvitationToggle = () => {
    setShowInvitation(prev => !prev);
  };

  return (
    <div className="App">
      <div id="headerLoader">
        <header>
          <div className="titleArea">
            <div>
              <span>이제</span><br />
              <span>댄스타임</span>
            </div>
            <div onClick={handleInvitationToggle}>
              <img src="/static/icons/hamburger.png" alt="menu" id="menu-button" />
            </div>
          </div>
        </header>
      </div>

      <div className="floating" onClick={handleInvitationToggle}></div>

      <div className={`container ${showInvitation ? 'slide-out' : ''}`} id="content" ref={containerRef}>
        <div id="ajax-content">
          <div className="mainImage">
            <img 
              id="mainBanner" 
              src={bannerImages[currentImageIndex]} 
              alt="main" 
              className={`slider-image ${fade ? 'fade-in' : 'fade-out'}`}
            />
          </div>

          <div className="image-grid">
            {postcards.map((postcard) => (
              <div className="image-item" key={postcard.id}>
                <img
                  src={`/uploads/${postcard.png_name}`}
                  alt={`grid ${postcard.id}`}
                  onError={(e) => handleImageError(e, postcard.id)}
                  onClick={() => window.location.href = `/postcardshareview/${postcard.id}`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={`invitation-content ${showInvitation ? 'slide-in' : ''}`}>
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
                onClick={handleInvitationToggle}
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            </div>
            <div style={{ fontSize: '20px' }}>춤 이야기</div>
            <div></div>
          </div>
        </header>

        <div id="inv_text">
          사회는 눈에 보이는, 보이지 않는<br />
          권력 관계와 규칙들로 이루어져 있다.<br /><br />
          국가들 사이 뿐만 아니라 그 너머까지<br />
          우리의 삶과 세계에 영향을 미친다.<br /><br />
          {/* ... 나머지 텍스트 ... */}
        </div>

        <img
          src="/static/icons/down.png"
          onClick={handleInvitationToggle}
          style={{
            filter: 'brightness(0) invert(1)',
            position: 'fixed',
            bottom: '15%',
            right: '50%',
            zIndex: '99999'
          }}
        />

        <div id="letsmakedance">
          <a href="/GlbTest" className="ajax-link" id="letsmakedancebutton">
            캐릭터 생성하기
          </a>
        </div>
      </div>

      <footer>
        <div>2024. 10. 12 - 10.29.</div>
        <div className="footerBorder">|</div>
        <a href="https://google.com">김화순 개인전</a>
        <div className="footerBorder">|</div>
        <a href="https://google.com">자하미술관</a>
      </footer>
    </div>
  );
}

export default Home;