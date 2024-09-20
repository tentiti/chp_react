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


      if (isTablet || isDesktop) {
        setMarginTop(0);
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
    // alert(postcards.data);
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

  const floatingButtonRef = useRef(null);

  useEffect(() => {
    
    const floatingButton = floatingButtonRef.current;
    const container = containerRef.current;
    
    if (floatingButton && container && isFloatingVisible) {
      // console.log("Floating button and container found, isFloatingVisible:", isFloatingVisible);
  
      const buttonWidth = 70;
      const buttonHeight = 70;
      const collisionMargin = 10;
      const collisionCooldown = 3000; // Reduced cooldown time
  
      const updateContainerDimensions = () => {
        const containerRect = container.getBoundingClientRect();
        const maxX = Math.min(containerRect.width - buttonWidth, 390 - buttonWidth);
        const maxY = Math.min(containerRect.height - buttonHeight, 780 - buttonHeight);
        console.log("Container dimensions:", { width: containerRect.width, height: containerRect.height, maxX, maxY });
        return { maxX, maxY };
      };
  
      let { maxX, maxY } = updateContainerDimensions();
  
      let posX = Math.random() * maxX;
      let posY = Math.random() * maxY;
      let speed = 0.8; // Reduced speed
      let angle = Math.random() * 2 * Math.PI;
  
      // console.log("Initial position:", { posX, posY });
  
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
  
      let lastCollisionTime = 0;
  
      function getRandomButtonImage() {
        return buttonImages[Math.floor(Math.random() * buttonImages.length)];
      }
  
      function moveFloatingButton() {
        if (!isFloatingVisible) {
         return;
        }

        const maxSpeed = 5; // 최대 속도 제한
        let vx = Math.cos(angle) * speed;
        let vy = Math.sin(angle) * speed;

        const now = Date.now();
        ({ maxX, maxY } = updateContainerDimensions());
      
        angle += (Math.random() - 0.5) * 0.1;
        posX += Math.cos(angle) * speed;
        posY += Math.sin(angle) * speed;
      
        let collision = false;
      
        // Boundary handling
        if (posX <= collisionMargin || posX >= maxX - collisionMargin - buttonWidth ||
            posY <= collisionMargin + 29 || posY >= maxY - collisionMargin - buttonHeight) {
          collision = true;
          
          // Adjust position
          if (posX <= collisionMargin) posX = collisionMargin;
          if (posX >= maxX - collisionMargin - buttonWidth) posX = maxX - collisionMargin - buttonWidth;
          if (posY <= collisionMargin + 58) posY = collisionMargin + 58;
          if (posY >= maxY - collisionMargin - buttonHeight) posY = maxY - collisionMargin - buttonHeight;
      
          if (now - lastCollisionTime > collisionCooldown) {
            angle = Math.random() * 2 * Math.PI; // New random angle on collision
            lastCollisionTime = now;
            floatingButton.style.backgroundImage = `url(${getRandomButtonImage()})`;
          }
        }
      
        floatingButton.style.position = 'absolute';
        floatingButton.style.left = `${posX}px`;
        floatingButton.style.top = `${posY}px`;
      
        console.log("Button position updated:", { posX, posY, collision });
      
        requestAnimationFrame(moveFloatingButton);
      }
      
      // 초기 설정
      floatingButton.style.position = 'absolute';
      floatingButton.style.width = `${buttonWidth}px`;
      floatingButton.style.height = `${buttonHeight}px`;
      floatingButton.style.backgroundSize = 'cover';
      floatingButton.style.backgroundImage = `url(${getRandomButtonImage()})`;
      floatingButton.style.display = 'block';
      
      // 초기 위치 설정
      posX = Math.random() * (maxX - buttonWidth - 2 * collisionMargin) + collisionMargin;
      posY = Math.random() * (maxY - buttonHeight - 2 * collisionMargin) + collisionMargin + 58;
      
      requestAnimationFrame(moveFloatingButton);
      
      floatingButton.addEventListener('click', () => {
        window.location.href = '/CreateCharacter';
      });

      window.addEventListener('resize', updateContainerDimensions);

    } else {
      console.log("Floating button or container not found, or isFloatingVisible is false:", 
        { floatingButton: !!floatingButton, container: !!container, isFloatingVisible });
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

    // const container = containerRef.current;
    container.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('resize', adjustContainerHeight);
      container.removeEventListener('scroll', handleScroll);
    };
  }, [isFloatingVisible]);

  return (
    <div className="App" style={{height: '100%', overflow: 'hidden'}}>
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
          
        </div>
      )}

      <div className="container" id="content" ref={containerRef}>
      {isFloatingVisible && <div ref={floatingButtonRef} className="floating"></div>}
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
                  // src={`/api/uploads/${postcard.png_name}?t=${new Date().getTime()}`} 
                  src={`/api/uploads/${postcard.png_name}`} 
                  alt={`grid ${postcard.id}`}
                  onError={(e) => handleImageError(e, postcard.id)} 
                  onClick={() => window.location.href = `/postcardshareview/${postcard.id}`} 
                />
              </div>
            ))}

            
          </div>

          <span style={{
            fontFamily: 'pretendard',
            fontSize: '9px',
            textAlign: 'center',
            color: '#412823',
            marginTop: '20px',
            marginBottom: '70px'

          }}>이제 댄스타임 : 평화의 나무에 달빛이 닿은 날, 반짝이는 춤결<br />
          기획 및 제작 | 유채영 김휴초</span>
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