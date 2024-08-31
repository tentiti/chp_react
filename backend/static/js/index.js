// 페이지 로드 시 페이드 인 애니메이션을 적용하는 코드
document.addEventListener('DOMContentLoaded', function() {
    const content = document.getElementById('content');
    
    // 페이드 인 클래스 추가 전 살짝 딜레이를 주어서 브라우저가 초기 상태를 적용할 시간을 줌
    setTimeout(() => {
        content.classList.add('fade-in');
    }, 10); // 짧은 딜레이로 애니메이션을 시작하도록 설정

    // 초기화 함수 호출
    initializeContent();
});

// 플로팅 버튼 및 다른 이벤트 초기화 코드 (변경 없이 유지)
const floatingButton = document.querySelector('.floating');
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
    const maxX = window.innerWidth+30;
    const maxY = window.innerHeight - 30;

    posX += xDirection * speed;
    posY += yDirection * speed;

    if (posX <= 0 || posX >= maxX) {
        xDirection *= -1;
        floatingButton.style.backgroundColor = getRandomColor();
        // alert('플로팅 버튼이 x 경계에 닿았습니다!');
    }

    if (posY <= 60 || posY >= maxY) {
        yDirection *= -1;
        // alert('플로팅 버튼이 y 경계에 닿았습니다!');
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

function initializeAjaxLinks() {
    document.body.addEventListener('click', function(event) {
        const ajaxLink = event.target.closest('.ajax-link');
        if (ajaxLink) {
            event.preventDefault();
            const url = ajaxLink.href;

            const content = document.getElementById('content');
            content.classList.add('fade-out');

            setTimeout(() => {
                window.location.href = url;
            }, 500); // 페이드 아웃 애니메이션 지속 시간에 맞춰서
        }
    });
}

// 초기화 함수 - 페이지 로드 시 호출
function initializeContent() {
    // initializeMenuEvents();
    initializeAjaxLinks();
}

//메인 배너 
const images = [
    "../static/stockimages/mainbanner1.png",
    "../static/stockimages/mainbanner2.png",
    "../static/stockimages/mainbanner3.png"
  ];

  let currentIndex = 0;
  const banner = document.getElementById("mainBanner");

  function changeImage() {
    // 현재 이미지 페이드 아웃
    banner.classList.add('fade-out');

    // 페이드 아웃 후 이미지 변경
    setTimeout(() => {
      currentIndex = (currentIndex + 1) % images.length;
      banner.src = images[currentIndex];
      
      // 이미지 변경 후 페이드 인
      banner.classList.remove('fade-out');
    }, 1000); // 페이드 아웃 시간(1초)과 일치시킴
  }

  // 2초마다 이미지 변경 (디졸브 포함)
  setInterval(changeImage, 4000); // 4초로 설정(2초마다 변경, 디졸브 1초 포함)