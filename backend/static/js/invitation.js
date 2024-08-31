document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.container');
    const invText = document.getElementById('inv_text');
    const blurOverlay = document.querySelector('.blur-overlay');
  
    // 컨텐츠 높이 설정
    function setContentHeight() {
      const windowHeight = window.innerHeight;
      const headerHeight = 58; // 헤더 높이
      const buttonHeight = 130; // 버튼 영역 높이
      invText.style.minHeight = `${windowHeight - headerHeight - buttonHeight}px`;
    }
  
    // 초기 높이 설정 및 리사이즈 이벤트에 연결
    setContentHeight();
    window.addEventListener('resize', setContentHeight);
  
    container.addEventListener('scroll', function() {
      const scrollPosition = container.scrollTop;
      const invTextHeight = invText.offsetHeight;
      const blurStart = invTextHeight * 0.7; // 70% 지점부터 블러 시작
  
      if (scrollPosition > blurStart) {
        const blurAmount = Math.min((scrollPosition - blurStart) / (invTextHeight * 0.3) * 5, 5);
        blurOverlay.style.backdropFilter = `blur(${blurAmount}px)`;
        blurOverlay.style.webkitBackdropFilter = `blur(${blurAmount}px)`;
      } else {
        blurOverlay.style.backdropFilter = 'blur(0px)';
        blurOverlay.style.webkitBackdropFilter = 'blur(0px)';
      }
    });
  
    // 뒤로 가기 버튼 기능
    const backButton = document.getElementById('back-button');
    if (backButton) {
      backButton.addEventListener('click', function() {
        window.history.back();
      });
    }
  
    // 스크롤 가능 여부 확인 및 로그 출력
    console.log('Container scrollable:', container.scrollHeight > container.clientHeight);
    console.log('Container height:', container.clientHeight);
    console.log('Container scroll height:', container.scrollHeight);
  });