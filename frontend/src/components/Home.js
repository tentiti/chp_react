import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
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
  const floatingButtonRef = useRef(null);

  const bannerImages = useMemo(() => [
    '/static/stockimages/mainbanner1.webp',
    '/static/stockimages/mainbanner2.webp',
    '/static/stockimages/mainbanner3.webp'
  ], []);

  const buttonImages = useMemo(() => [
    '/static/images/buttonImages/button1.webp',
    '/static/images/buttonImages/button2.webp',
    '/static/images/buttonImages/button3.webp',
    '/static/images/buttonImages/button4.webp',
    '/static/images/buttonImages/button5.webp',
    '/static/images/buttonImages/button6.webp',
    '/static/images/buttonImages/button7.webp',
    '/static/images/buttonImages/button8.webp'
  ], []);

  const preloadedRef = useRef(false);

  const preloadImages = useCallback((imageArray) => {
    if (preloadedRef.current) return;

    const preloadPromises = imageArray.map((imageSrc) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageSrc;
      });
    });

    Promise.all(preloadPromises)
      .then(() => {
        console.log('All images preloaded successfully');
        preloadedRef.current = true;
      })
      .catch((error) => {
        console.error('Error preloading images:', error);
      });
  }, []);
  
  useEffect(() => {
    preloadImages([...bannerImages, ...buttonImages]);

    // ... rest of the useEffect logic ...

    const fetchPostcards = async () => {
      try {
        const response = await axios.get('/api/postcards');
        setPostcards(response.data);
      } catch (error) {
        console.error("There was an error fetching the postcards!", error);
      }
    };

    fetchPostcards();

    const imageInterval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % bannerImages.length);
        setFade(true);
      }, 500);
    }, 3000);

    return () => clearInterval(imageInterval);
  },[bannerImages, buttonImages, preloadImages]);

  const handleImageError = (e, num) => {
    const fallbackSrc = `https://placehold.co/200x200?text=Image+${num}+Error`;
    
    // 이미지 로드 재시도 횟수 관리
    if (!e.target.attemptedRetries) {
      e.target.attemptedRetries = 0;
    }
    
    // 최대 1회까지 재시도
    if (e.target.attemptedRetries < 2) {
      e.target.attemptedRetries += 1;
      e.target.src = e.target.src + `?retry=${e.target.attemptedRetries}`; // 캐시 무효화
    } else {
      e.target.src = fallbackSrc; // 실패 시 대체 이미지로 설정
    }
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
    const floatingButton = floatingButtonRef.current;
    const container = containerRef.current;
    
    if (floatingButton && container && isFloatingVisible) {


      const buttonWidth = 70;
      const buttonHeight = 70;
      const collisionMargin = 5;
      const collisionCooldown = 2000; // Reduced cooldown time
  
      let lastCollisionTime = 0;

      const updateContainerDimensions = () => {
        const containerRect = container.getBoundingClientRect();
        const maxX = Math.min(containerRect.width - buttonWidth/2, 390 - buttonWidth /2);
        const maxY = Math.min(containerRect.height - buttonHeight/2, 780 - buttonHeight/2);
        return { maxX, maxY };
      };
  
      let { maxX, maxY } = updateContainerDimensions();
  
      let posX = Math.random() * maxX;
      let posY = Math.random() * maxY;
      let angle = Math.random() * 2 * Math.PI;
  
  
      function getRandomButtonImage() {
        const currentImage = floatingButton.style.backgroundImage;
        let newImage;
        do {
          newImage = buttonImages[Math.floor(Math.random() * buttonImages.length)];
        } while (newImage === currentImage);
        return newImage;
      }
  
      function moveFloatingButton() {
        if (!isFloatingVisible) {
         return;
        }
        const now = Date.now();
        ({ maxX, maxY } = updateContainerDimensions());

        const angleVariation = (Math.random() - 0.5) * 0.03; // Reduced from 0.1 to 0.03
        angle += angleVariation;

         // Reduce speed to make the movement slower
        posX += Math.cos(angle) * (3 * 0.2);  // Speed reduced
        posY += Math.sin(angle) * (3 * 0.2);  // Speed reduced

    
        let collision = false;
      
        // Boundary handling
        if (posX <= collisionMargin || posX >= maxX - collisionMargin) {
          angle = Math.PI - angle; // Reflect horizontally
          collision = true;
        }

        if (posY <= collisionMargin + 29 || posY >= maxY - collisionMargin) {
          angle = -angle; // Reflect vertically
          collision = true;
        }
          
        floatingButton.style.left = `${posX}px`;
        floatingButton.style.top = `${posY}px`;

         // Smooth change in direction instead of random large changes
          if (collision && now - lastCollisionTime > collisionCooldown) {
            console.log("Collision detected, changing image", now, lastCollisionTime);
            lastCollisionTime = now;
            floatingButton.style.backgroundImage = `url(${getRandomButtonImage()})`;
            collision = false;
          }
        
        requestAnimationFrame(moveFloatingButton);
      }
      
      // 초기 설정
      floatingButton.style.position = 'absolute';
      floatingButton.style.width = `${buttonWidth}px`;
      floatingButton.style.height = `${buttonHeight}px`;
      floatingButton.style.backgroundSize = 'cover';
      // floatingButton.style.backgroundImage = `url(${getRandomButtonImage()})`;
      floatingButton.style.display = 'block';
      floatingButton.style.zIndex='99999999';
      
      // 초기 위치 설정
      posX = Math.random() * (maxX - buttonWidth - 2 * collisionMargin) + collisionMargin;
      posY = Math.random() * (maxY - buttonHeight - 2 * collisionMargin) + collisionMargin + 58;
      
      requestAnimationFrame(moveFloatingButton);
      
      floatingButton.addEventListener('click', () => {
        window.location.href = '/CreateCharacter';
      });

      window.addEventListener('resize', updateContainerDimensions);

    } else {
      // console.log("Floating button or container not found, or isFloatingVisible is false:", 
        // { floatingButton: !!floatingButton, container: !!container, isFloatingVisible });
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
      const header = document.querySelector('#header');
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
      // console.log('Scroll event:', e.target.scrollTop);
    }

    adjustContainerHeight();
    window.addEventListener('resize', adjustContainerHeight);

    // const container = containerRef.current;
    container.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('resize', adjustContainerHeight);
      container.removeEventListener('scroll', handleScroll);
    };
  }, [isFloatingVisible, buttonImages]);


  return (
    <div className="App" style={{height: '100%', width: '100%'}}>
      {isFloatingVisible && <div ref={floatingButtonRef} className="floating" style={{
        left: '50px', // 초기 위치 설정
        top: '100px', // 초기 위치 설정
      }}></div>}
      
      <div id="headerLoader" style={{ 
        backgroundColor: isInvitationVisible ? 'transparent' : '#f8f6f1', 
        left: '50%', 
        transform: 'translateX(-50%)',
         width: '100%', 
         zIndex: '100', 
         border: 'none !important',
         display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
         }}>
          <div id="header" style={{ 
            backgroundColor: 'transparent', 
            position:'absolute', 
            width:"100%", 
            height:"100%",
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <div className="titleArea" style={{ width: '100%' }}>
              <div style={{  flexGrow: 0, textAlign: 'left' }}  onClick={() => window.location.reload()}>
                <span style={{ fontFamily: "ClimateCrisisKR-1979", fontWeight: 200, fontSize: '15px', color: '#412823', lineHeight: '0.9', display: 'block' }}>이제</span>
                <span style={{ fontFamily: "ClimateCrisisKR-1979", fontWeight: 400, fontSize: '24px', color: '#412823', lineHeight: '0.9', display: 'block' }}>댄스타임</span>
              </div>
        
              <div onClick={handleMenuClick} style={{ 
                cursor: 'pointer', 
                display:'flex', 
                justifyContent:'center', 
                alignItems:"center",
                // marginLeft: 'auto'
              }}>
                <img src="/static/icons/hamburger.webp" alt="menu" id="menu-button" style={{width: '30px'}}/>
              </div>
            </div>
          </div>
          
        </div>
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
              <div className="image-item" key={postcard.id} style={{
                aspectRatio: '1/1',
              }}>
                <img
                  style={{width:'100%', height:'100%'}}
                  // src={`/api/uploads/${postcard.png_name}?t=${new Date().getTime()}`} 
                  src={`/api/uploads/${postcard.png_name}`} 
                  alt={`grid ${postcard.id}`}
                  onError={(e) => handleImageError(e, postcard.id)} 
                  onClick={() => window.location.href = `/postcardshareview/${postcard.id}`} 
                  loading="lazy"  // lazy loading 적용
                />
              </div>
            ))}

            
          </div>

          
        </div>
        <div style={{
            fontFamily: 'Pretendard-Regular',
            fontSize: '9px',
            textAlign: 'center',
            color: '#412823',
            boxSizing: 'border-box',
            paddingTop: '20px',
            paddingBottom: '100px',
            bacjgroundColor: 'blue',

          }}>이제 댄스타임 : 평화의 나무에 달빛이 닿은 날, 반짝이는 춤결<br />
          춤판 이끔이 | 유채영 김휴초</div>
      </div>

      {isInvitationVisible && (
        <div className={`invitation-container ${isInvitationVisible ? 'visible' : ''}`}style={{
          zIndex: '1000',
        }}>
          <Invitation onBack={handleBackClick} showbutton={true} />
        </div>
      )}

      <footer style={{letterSpacing:'-0.025em', zIndex:'9999999'}}>
        <div>2024. 10. 12 - 11. 3.</div>
        <div className="footerBorder">|</div>
        <a href="https://www.instagram.com/kkot.pida.gallery/">김화순 개인전</a>
        <div className="footerBorder">|</div>
        <a href="https://www.zahamuseum.org">자하미술관</a>
      </footer>
    </div>
  );
}

export default Home;