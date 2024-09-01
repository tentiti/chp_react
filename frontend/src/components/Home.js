import React, { useEffect, useRef } from 'react';
import './main_styles.css';

function Home() {
  const containerRef = useRef(null);

  useEffect(() => {
    // 페이지 로드 시 페이드 인 애니메이션 적용
    const content = document.getElementById('content');
    setTimeout(() => {
      content.classList.add('fade-in');
    }, 10);

    // 플로팅 버튼 및 기타 초기화 로직
    const floatingButton = document.querySelector('.floating');
    if (floatingButton) {
      let xDirection = 1;
      let yDirection = 1;
      let speed = 2;

      const maxX = window.innerWidth - floatingButton.offsetWidth;
      const maxY = window.innerHeight - floatingButton.offsetHeight - 30;

      let posX = Math.random() * maxX;
      let posY = 80 + Math.random() * (maxY - 80);

      floatingButton.style.position = 'fixed';
      floatingButton.style.left = `${posX}px`;
      floatingButton.style.top = `${posY}px`;

      const colors = ['#FF5733', '#33FF57', '#3357FF', '#F3FF33', '#FF33F6', '#33FFF6', '#FF8333', '#8333FF'];

      function getRandomColor() {
        return colors[Math.floor(Math.random() * colors.length)];
      }

      function moveFloatingButton() {
        posX += xDirection * speed;
        posY += yDirection * speed;

        if (posX <= 0 || posX >= maxX) {
          xDirection *= -1;
          floatingButton.style.backgroundColor = getRandomColor();
        }

        if (posY <= 60 || posY >= maxY) {
          yDirection *= -1;
          floatingButton.style.backgroundColor = getRandomColor();
        }

        floatingButton.style.left = `${posX}px`;
        floatingButton.style.top = `${posY}px`;

        requestAnimationFrame(moveFloatingButton);
      }

      requestAnimationFrame(moveFloatingButton);

      floatingButton.addEventListener('click', () => {
        window.location.href = '/createCharacter';
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
          console.log('Container height set to:', containerHeight);
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

  return ( 
    <div className="App">
      <div id="headerLoader">
      <header>
        <div className="titleArea" style={{ backgroundColor: '#f8f6f1',display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ fontFamily: 'ClimateCrisisKR-1979', flexGrow: 0 }}>
            <span style={{ fontWeight: 200, fontSize: '12px', color: '#412823' }}>이제</span><br />
            <span style={{ fontWeight: 400, fontSize: '16px', color: '#412823' }}>댄스타임</span>
          </div>

          <a href="/invitation" className="ajax-link" style={{ marginLeft: 'auto' }}>
            <img
              src="/static/icons/hamburger.png"
              alt="menu"
              id="menu-button"
            />
          </a>
        </div>
      </header>
      </div>


      <div className="floating"></div>

      <div className="container" id="content" ref={containerRef}>
        <div id="ajax-content">
          <div className="mainImage">
            <img
              id="mainBanner"
              src="/static/stockimages/mainbanner1.png"
              alt="main"
            />
          </div>

          <div className="image-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8,9,10,11,12,13,14].map((num) => (
              <div className="image-item" key={num}>
                <img src={`https://placehold.co/200x200?text=Image${num}`} alt={`grid ${num}`} />
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