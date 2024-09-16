import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import Invitation from './Invitation';
import './Home.css';
import { isTablet, isDesktop } from 'react-device-detect';

function Home() {
  const containerRef = useRef(null);
  const [postcards, setPostcards] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [isInvitationVisible, setIsInvitationVisible] = useState(false);
  const [marginTop, setMarginTop] = useState(0);
  const [isFloatingVisible, setIsFloatingVisible] = useState(true);

  useEffect(() => {
    const updateMargin = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      if (isTablet || isDesktop) {
        setMarginTop(78);
      } else {
        setMarginTop(10);
      }
    };

    window.addEventListener('resize', updateMargin);
    updateMargin();

    return () => window.removeEventListener('resize', updateMargin);
  }, []);

  const bannerImages = [
    '/static/stockimages/mainbanner1.png',
    '/static/stockimages/mainbanner2.png',
    '/static/stockimages/mainbanner3.png'
  ];

  useEffect(() => {
    axios.get('/api/postcards')
      .then(response => setPostcards(response.data))
      .catch(error => console.error("There was an error fetching the postcards!", error));

    const imageInterval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % bannerImages.length);
        setFade(true);
      }, 500);
    }, 3000);

    return () => clearInterval(imageInterval);
  }, [bannerImages.length]);

  const handleImageError = (e, num) => {
    e.target.src = `https://placehold.co/200x200?text=error! ${num}`;
  };

  const handleMenuClick = () => {
    setIsInvitationVisible(true);
    setIsFloatingVisible(false);
  };

  const handleBackClick = () => {
    setIsInvitationVisible(false);
    setIsFloatingVisible(true);
  };

  useEffect(() => {
    const floatingButton = document.querySelector('.floating');
    if (floatingButton && isFloatingVisible) {
      const buttonWidth = 70;
      const buttonHeight = 70;
      const collisionMargin = 5;
      const collisionCooldown = 1000;

      let posX = Math.random() * (window.innerWidth - buttonWidth);
      let posY = Math.random() * (window.innerHeight - buttonHeight);
      let speed = 2;
      let angle = Math.random() * 2 * Math.PI;

      const maxX = window.innerWidth - buttonWidth;
      const maxY = window.innerHeight - buttonHeight - 30;

      const buttonImages = [
        '/static/images/buttonImages/button1.png',
        '/static/images/buttonImages/button2.png',
        '/static/images/buttonImages/button3.png',
        '/static/images/buttonImages/button4.png',
        '/static/images/buttonImages/button5.png',
        '/static/images/buttonImages/button6.png',
        '/static/images/buttonImages/button7.png',
        '/static/images/buttonImages/button8.png'
      ];

      let lastXCollisionTime = 0;
      let lastYCollisionTime = 0;

      let hasXCollision = false;
      let hasYCollision = false;

      function getRandomButtonImage() {
        const randomIndex = Math.floor(Math.random() * buttonImages.length);
        return buttonImages[randomIndex];
      }

      function moveFloatingButton() {
        if (!isFloatingVisible) return;

        const now = Date.now();

        angle += (Math.random() - 0.5) * 0.1;
        posX += Math.cos(angle) * speed;
        posY += Math.sin(angle) * speed;

        if (!hasXCollision && (posX <= collisionMargin || posX >= maxX - collisionMargin)) {
          if (now - lastXCollisionTime > collisionCooldown) {
            angle = Math.PI - angle;
            floatingButton.style.backgroundImage = `url(${getRandomButtonImage()})`;
            lastXCollisionTime = now;
            hasXCollision = true;
          }
        } else if (posX > collisionMargin && posX < maxX - collisionMargin) {
          hasXCollision = false;
        }

        posX = Math.max(0, Math.min(posX, maxX));

        if (!hasYCollision && (posY <= collisionMargin || posY >= maxY - collisionMargin)) {
          if (now - lastYCollisionTime > collisionCooldown) {
            angle = -angle;
            floatingButton.style.backgroundImage = `url(${getRandomButtonImage()})`;
            lastYCollisionTime = now;
            hasYCollision = true;
          }
        } else if (posY > collisionMargin && posY < maxY - collisionMargin) {
          hasYCollision = false;
        }

        posY = Math.max(0, Math.min(posY, maxY));

        floatingButton.style.left = `${posX}px`;
        floatingButton.style.top = `${posY}px`;

        requestAnimationFrame(moveFloatingButton);
      }

      floatingButton.style.backgroundSize = 'cover';
      floatingButton.style.width = `${buttonWidth}px`;
      floatingButton.style.height = `${buttonHeight}px`;

      requestAnimationFrame(moveFloatingButton);

      floatingButton.addEventListener('click', () => {
        window.location.href = '/CreateCharacter';
      });
    }

    function initializeAjaxLinks() {
      document.body.addEventListener('click', function (event) {
        const ajaxLink = event.target.closest('.ajax-link');
        if (ajaxLink) {
          event.preventDefault();
          const url = ajaxLink.href;
          const content = document.getElementById('content');
          content.classList.add('fade-out');
          setTimeout(() => {
            window.location.href = url;
          }, 500);
        }
      });
    }

    initializeAjaxLinks();

    function adjustContainerHeight() {
      const header = document.querySelector('header');
      const footer = document.querySelector('footer');
      const container = containerRef.current;

      if (header && footer && container) {
        const windowHeight = window.innerHeight;
        const headerHeight = header.offsetHeight;
        const footerHeight = footer.offsetHeight;
        const containerHeight = windowHeight - headerHeight - footerHeight;

        container.style.height = `${containerHeight}px`;
      }
    }

    function handleScroll(e) {
      console.log('Scroll event:', e.target.scrollTop);
    }

    adjustContainerHeight();
    window.addEventListener('resize', adjustContainerHeight);

    const container = containerRef.current;
    container.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('resize', adjustContainerHeight);
      container.removeEventListener('scroll', handleScroll);
    };
  }, [isFloatingVisible]);

  return (
    <div className="App">
      {!isInvitationVisible && (
        <div id="headerLoader" style={{ backgroundColor: isInvitationVisible ? 'transparent' : '#f8f6f1', left: '50%', transform: 'translateX(-50%)', width: '390px' }}>
          <header style={{ backgroundColor: 'transparent', width: '390px' }}>
            <div className="titleArea" style={{ width: '100%' }}>
              <div style={{ fontFamily: 'ClimateCrisisKR-1979', flexGrow: 0, textAlign: 'left' }}>
                <span style={{ fontWeight: 200, fontSize: '15px', color: '#412823', lineHeight: '0.9', display: 'block' }}>이제</span>
                <span style={{ fontWeight: 400, fontSize: '24px', color: '#412823', lineHeight: '0.9', display: 'block' }}>댄스타임</span>
              </div>
        
              <div onClick={handleMenuClick} style={{ 
                cursor: 'pointer', 
                display:'flex', 
                justifyContent:'center', 
                alignItems:"center",
                marginLeft: 'auto'
              }}>
                <img src="/static/icons/hamburger.png" alt="menu" id="menu-button" />
              </div>
            </div>
          </header>
          {isFloatingVisible && <div className="floating"></div>}
        </div>
      )}

      <div className="container" id="content" ref={containerRef}>
        <div id="ajax-content">
          <div className="mainImage" style={{ marginTop: `${marginTop}px`}}>
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
                  src={`/api/uploads/${postcard.png_name}?t=${new Date().getTime()}`} 
                  alt={`grid ${postcard.id}`}
                  onError={(e) => handleImageError(e, postcard.id)} 
                  onClick={() => window.location.href = `/postcardshareview/${postcard.id}`} 
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {isInvitationVisible && (
        <div className={`invitation-container ${isInvitationVisible ? 'visible' : ''}`}>
          <Invitation onBack={handleBackClick} />
        </div>
      )}

      <footer style={{letterSpacing:'-0.025em'}}>
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