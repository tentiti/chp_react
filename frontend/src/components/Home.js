import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import Invitation from './Invitation';  // Invitation 컴포넌트 임포트
import './Home.css';

function Home() {
  const containerRef = useRef(null);
  const [postcards, setPostcards] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [isInvitationVisible, setIsInvitationVisible] = useState(false); // Invitation 슬라이드 애니메이션 제어 상태
  const [marginTop, setMarginTop] = useState(0);

  useEffect(() => {
    const updateMargin = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // 화면의 height 절반에 58을 더한 값으로 margin-top 설정
      if (width > 390 && height > 844) {
        setMarginTop(height / 4 - 78); // height의 절반 + 58
      } else {
        setMarginTop(10); // 그 외의 경우 기본값 설정
      }
    };

    window.addEventListener('resize', updateMargin);
    updateMargin(); // 초기 실행

    return () => window.removeEventListener('resize', updateMargin);
  }, []);


  const bannerImages = [
    '/static/stockimages/mainbanner1.png',
    '/static/stockimages/mainbanner2.png',
    '/static/stockimages/mainbanner3.png'
  ];

  useEffect(() => {
    // 포스트카드 목록을 서버에서 가져오기
    axios.get('/api/postcards')
      .then(response => setPostcards(response.data))
      .catch(error => console.error("There was an error fetching the postcards!", error));

    // 배너 이미지 전환
    const imageInterval = setInterval(() => {
      setFade(false); // 페이드아웃 적용
      setTimeout(() => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % bannerImages.length);
        setFade(true);  // 페이드인 적용
      }, 500);  // 페이드아웃 후 0.5초 뒤에 이미지 전환

    }, 3000); // 3초마다 이미지 전환

    return () => clearInterval(imageInterval); // 컴포넌트 언마운트 시 인터벌 정리
  }, [bannerImages.length]);

  // 이미지 로드 실패 시 처리
  const handleImageError = (e, num) => {
    e.target.src = `https://placehold.co/200x200?text=error! ${num}`;
  };

  // 메뉴 버튼 클릭 시 Invitation 슬라이드 인
  const handleMenuClick = () => {
    setIsInvitationVisible(true);
  };

  // Invitation에서 back 버튼 클릭 시 슬라이드 아웃
  const handleBackClick = () => {
    setIsInvitationVisible(false);
  };

  useEffect(() => {
    const floatingButton = document.querySelector('.floating');
    if (floatingButton) {
      const buttonWidth = 70;
      const buttonHeight = 70;
      const collisionMargin = 5; // 끝에서 충돌이 발생할 여유 범위
      const collisionCooldown = 1000; // 충돌 후 1초 동안 재충돌 방지
  
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
  
      let hasXCollision = false;  // X축 충돌 플래그
      let hasYCollision = false;  // Y축 충돌 플래그
  
      function getRandomButtonImage() {
        const randomIndex = Math.floor(Math.random() * buttonImages.length);
        return buttonImages[randomIndex];
      }
  
      function moveFloatingButton() {
        const now = Date.now(); // 현재 시간을 가져옴
  
        angle += (Math.random() - 0.5) * 0.1;
        posX += Math.cos(angle) * speed;
        posY += Math.sin(angle) * speed;
  
        // X 축 경계 충돌 처리 (충돌 마진 추가 및 시간 제한)
        if (!hasXCollision && (posX <= collisionMargin || posX >= maxX - collisionMargin)) {
          if (now - lastXCollisionTime > collisionCooldown) {
            angle = Math.PI - angle;  // X축 반전
            floatingButton.style.backgroundImage = `url(${getRandomButtonImage()})`;
            lastXCollisionTime = now; // 충돌 시간 업데이트
            hasXCollision = true; // X 충돌 발생
          }
        } else if (posX > collisionMargin && posX < maxX - collisionMargin) {
          hasXCollision = false; // 경계를 벗어나면 충돌 해제
        }
  
        posX = Math.max(0, Math.min(posX, maxX)); // X축 위치 보정
  
        // Y 축 경계 충돌 처리 (충돌 마진 추가 및 시간 제한)
        if (!hasYCollision && (posY <= collisionMargin || posY >= maxY - collisionMargin)) {
          if (now - lastYCollisionTime > collisionCooldown) {
            angle = -angle;  // Y축 반전
            floatingButton.style.backgroundImage = `url(${getRandomButtonImage()})`;
            lastYCollisionTime = now; // 충돌 시간 업데이트
            hasYCollision = true; // Y 충돌 발생
          }
        } else if (posY > collisionMargin && posY < maxY - collisionMargin) {
          hasYCollision = false; // 경계를 벗어나면 충돌 해제
        }
  
        posY = Math.max(0, Math.min(posY, maxY)); // Y축 위치 보정
  
        floatingButton.style.left = `${posX}px`;
        floatingButton.style.top = `${posY}px`;
  
        requestAnimationFrame(moveFloatingButton);
      }
  
      // floatingButton.style.backgroundImage = `url(${getRandomButtonImage()})`;
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
  }, []);

  return (
    <div className="App">
    {/* Home의 헤더: Invitation이 활성화되면 숨겨짐 */} 
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
        <div className="floating"></div> 
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

      {/* 슬라이드로 등장하는 Invitation 컴포넌트 */}
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
