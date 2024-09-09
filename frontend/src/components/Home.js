import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import './main_styles.css';

function Home() {
  const containerRef = useRef(null);
  const [postcards, setPostcards] = useState([]);

  useEffect(() => {
    // 포스트카드 목록을 서버에서 가져오기
    axios.get('/api/postcards')
      .then(response => {
        setPostcards(response.data);
      })
      .catch(error => {
        console.error("There was an error fetching the postcards!", error);
      });

    // 페이지 로드 시 페이드 인 애니메이션 적용
    const content = document.getElementById('content');
    setTimeout(() => {
      content.classList.add('fade-in');
    }, 10);

    // 플로팅 버튼 및 기타 초기화 로직
    const floatingButton = document.querySelector('.floating');
    if (floatingButton) {
      let posX = Math.random() * window.innerWidth;
      let posY = Math.random() * window.innerHeight;
      let speed = 2;
      let angle = Math.random() * 2 * Math.PI;  // 초기 방향 무작위 설정

      const maxX = window.innerWidth - floatingButton.offsetWidth;
      const maxY = window.innerHeight - floatingButton.offsetHeight - 30;

      // 이미지 변경을 위한 변수
      let lastImageChangeTime = 0;
      const imageChangeInterval = 2000;  // 2초(2000ms)마다 이미지 변경

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

      function getRandomButtonImage() {
        const randomIndex = Math.floor(Math.random() * buttonImages.length);
        return buttonImages[randomIndex];
      }

      function moveFloatingButton() {
        const currentTime = Date.now();  // 현재 시간 가져오기

        // 무작위로 방향 변경
        angle += (Math.random() - 0.5) * 0.1;

        // 좌표 업데이트
        posX += Math.cos(angle) * speed;
        posY += Math.sin(angle) * speed;

        // 경계 충돌 처리 및 이미지 변경 조건
        if ((posX <= 30 || posX >= maxX) && currentTime - lastImageChangeTime > imageChangeInterval) {
          angle = Math.PI - angle;  // X축 경계에서 튕기기
          lastImageChangeTime = currentTime;  // 마지막 이미지 변경 시간 갱신
          floatingButton.style.backgroundImage = `url(${getRandomButtonImage()})`;
          console.log('Image changed X!');
        }

        if ((posY <= 60 || posY >= maxY) && currentTime - lastImageChangeTime > imageChangeInterval) {
          angle = -angle;  // Y축 경계에서 튕기기
          lastImageChangeTime = currentTime;  // 마지막 이미지 변경 시간 갱신
          floatingButton.style.backgroundImage = `url(${getRandomButtonImage()})`;
          console.log('Image changed Y!');
        }

        // 새로운 위치로 이동
        floatingButton.style.left = `${posX}px`;
        floatingButton.style.top = `${posY}px`;

        requestAnimationFrame(moveFloatingButton);
      }

      // 초기 이미지 설정
      floatingButton.style.backgroundImage = `url(${getRandomButtonImage()})`;
      floatingButton.style.backgroundSize = 'cover';
      floatingButton.style.width = '50px';
      floatingButton.style.height = '50px';

      // 무작위 움직임 시작
      requestAnimationFrame(moveFloatingButton);

      floatingButton.addEventListener('click', () => {
        window.location.href = '/GlbTest';
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

    // 새로 추가된 부분: 스크롤 관련 로직
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

    function logHeights() {
      const container = containerRef.current;
      const content = container.querySelector('#ajax-content');
      console.log('Container height:', container.clientHeight);
      console.log('Content height:', content.scrollHeight);
    }

    adjustContainerHeight();
    window.addEventListener('resize', adjustContainerHeight);

    const container = containerRef.current;
    container.addEventListener('scroll', handleScroll);

    logHeights();

    return () => {
      window.removeEventListener('resize', adjustContainerHeight);
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // 이미지 로드 실패 시 처리
  const handleImageError = (e, num) => {
    e.target.src = `https://placehold.co/200x200?text=Error${num}`;
  };

  return (
    <div className="App">
      <div id="headerLoader">
        <header>
          <div className="titleArea" style={{ backgroundColor: '#f8f6f1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div style={{ fontFamily: 'ClimateCrisisKR-1979', flexGrow: 0 }}>
              <span style={{ fontWeight: 200, fontSize: '12px', color: '#412823' }}>이제</span><br />
              <span style={{ fontWeight: 400, fontSize: '16px', color: '#412823' }}>댄스타임</span>
            </div>
            <a href="/invitation" className="ajax-link" style={{ marginLeft: 'auto' }}>
              <img src="/static/icons/hamburger.png" alt="menu" id="menu-button" />
            </a>
          </div>
        </header>
      </div>

      <div className="floating"></div>

      <div className="container" id="content" ref={containerRef}>
        <div id="ajax-content">
          <div className="mainImage">
            <img id="mainBanner" src="/static/stockimages/mainbanner1.png" alt="main" />
          </div>

          {/* Postcard Image Grid */}
          <div className="image-grid">
            {postcards.map((postcard) => (
              <div className="image-item" key={postcard.id}>
                <img
                  src={`/uploads/${postcard.png_name}`}  // .png 파일 로드
                  alt={`grid ${postcard.id}`}
                  onError={(e) => handleImageError(e, postcard.id)}  // 이미지 에러 처리
                  onClick={() => window.location.href = `/postcardshareview/${postcard.id}`}  // 클릭 시 페이지 이동
                />
              </div>
            ))}
          </div>
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
