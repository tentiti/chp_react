import React, { useRef, useEffect, useState } from 'react';
import axios from 'axios';
import Header from './Header';
import { useParams } from 'react-router-dom';
import * as THREE from 'three'; // Importing Three.js
import { isTablet, isDesktop } from 'react-device-detect';
import './PostcardView.css';

const backgrounds = [
  "/static/stockimages/bg1.webp",
  "/static/stockimages/bg1.webp",
  "/static/stockimages/bg2.webp",
  "/static/stockimages/bg3.webp",
];

const modelPositions = [
  { x: 16.75, y: 31.5, width: 36.75},
  { x: 33.5, y: 26.5, width: 36.75},
  { x: 42.25, y: 22, width: 36.75},
];

const PostcardShareView = () => {
  const { id } = useParams();
  const [postcard, setPostcard] = useState(null);
  const [gifKey, setGifKey] = useState(0); // Add state for gif reload
  const [isFixedSize, setIsFixedSize] = useState(false); // 화면 고정 여부 상태
  const audioRef = useRef(null);
  const canvasRef = useRef(null);

  // 화면 크기 설정
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // 화면이 390 * 840보다 크면 고정 크기로 설정
      if (isTablet || isDesktop) {
        setIsFixedSize(true);
      } else {
        setIsFixedSize(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // 초기 실행

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const fetchPostcard = async () => {
      try {
        const response = await axios.get(`/api/postcard/${id}`, { cache: 'no-cache' });
        if (response.status === 200) {
          setPostcard(response.data);
        } else {
          console.error('Error fetching postcard:', response.status);
        }
      } catch (error) {
        console.error('Network error:', error);
      }
    };

    fetchPostcard();
  }, [id]);

  const handlePlayAudioAndRestartGIF = () => {
    // Generate a new unique timestamp
    const timestamp = new Date().getTime();
    
    // Find the GIF element
    const gifElement = document.querySelector('#gifElement');
    
    if (gifElement) {
      // Set the src to an empty string to stop the current animation
      gifElement.src = '';
      
      // Force a reflow
      void gifElement.offsetWidth;
      
      // Set the new src with the timestamp to force a reload
      gifElement.src = `/api/uploads/${postcard.gif_name}?t=${timestamp}`;
    }
    
    // Play the audio
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => {
        console.error("Audio playback failed:", err);
      });
    }
    
    // Update the state to trigger a re-render
    setGifKey(prevKey => prevKey + 1);
  };
  
  if (!postcard) {
    return <div>Loading...</div>;
  }

  document.body.addEventListener('touchmove', function (e) {
    e.preventDefault();
  }, { passive: false });

  return (
    <div style={{
      position: 'absolute',
      top: '0',
      left: '0',
      backgroundImage: `url('/static/stockimages/background_paper.webp')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      width: isFixedSize ? '390px' : '100dvw', // 고정 크기 또는 가로 100%
      height: isFixedSize ? '780px' : '100dvh', // 고정 크기 또는 세로 100%

      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      overflowY: 'hidden',


    }}>
      <div
        style={{
          height: '58px', // Keep the height fixed
          position: 'fixed',
          top: '0',
          width: isFixedSize ? '390px' : '100vw', // Adjust width based on screen size
          zIndex: '1000',
          left: '50%', // Centering
          transform: isFixedSize ? 'translateX(-50%)' : 'none', // Center for fixed width
          overflow: 'hidden', // Prevent content overflow
          padding: '0', // Ensure no padding inflates the size
          margin: '0', // Ensure no margins affect size
          boxSizing: 'border-box', // Ensure padding and borders are included in the size calculation
      }}
      >
        <Header
          title={`'${postcard.name}'의 춤사위`}
          needthird={false}
          style={{
            width: '100%',
            height: '100%', // Ensure the header fits within its container
            display: 'flex',
            alignItems: 'center', // Vertically center content
            justifyContent: 'center', // Horizontally center content
            fontSize: isFixedSize ? '16px' : '2vw', // Adjust font size for larger screens
            padding: '0', // Ensure no extra padding inside the header
            margin: '0', // Remove margins if any
            overflow: 'hidden', // Ensure no overflow
          }}
        />
      </div>



      <div id="createdImages" style={{
        position: 'fixed',
        top: '58px',
        // width: '100%',  // 창 너비를 100%로 맞춤
        aspectRatio: '9/16.5',  // 16:9 비율을 유지
        height: 'calc(100% - 70px)',  // 높이는 전체에서 160px을 뺀 값으로 설정
        
        minWidth: '200px',  // 최대 너비 제한
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        zIndex: '900',
        overflow: 'hidden',
        backgroundImage: `url(/static/stockimages/share_postcardfinal_${postcard.number}.webp)`,
        backgroundSize: 'contain',  // 배경 이미지가 컨테이너를 덮도록 설정
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center Top',  // 이미지가 가운데에 위치하게 설정
      }}>


          <img
            id="gifElement" 
            key={gifKey} // Ensure the GIF is reloaded by changing the key
            src={`/api/uploads/${postcard.gif_name}`}
            alt="GIF"
            style={{
              position: 'absolute',
              overflow: 'hidden',

              zIndex: '900',
              top: `calc(${modelPositions[postcard.number-1].y}% - 5%)`,
              left: `calc(${modelPositions[postcard.number-1].x}% + 1%)`,
              width: `calc(${modelPositions[postcard.number-1].width}% + 7%)`,
              height:'auto',
            }}
          />
  

        <div
          style={{
            position: 'absolute',
            top: '66%',
            zIndex: '900',
            width: '83%',
            color: '#412823',
            fontSize: isFixedSize? '12px' : '2.8vw',
            textAlign: 'center',
            verticalAlign: 'top',
            lineHeight: '2.3',
            fontFamily: 'Cafe24Simplehae, sans-serif',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            whiteSpace: 'normal',
            overflow: 'hidden',
          }}
        >
          {postcard.comment}
        </div>

        <div
          style={{
            position: 'absolute',
            top: isFixedSize? '73.2%': '73.3%',
            zIndex: '900',
            width: '20%',
            color: '#412823',
            zIndex: '900',
            marginTop: '5px',
            width: '320px',
            color: '#412823',
            fontSize: '8px',
            textAlign: 'center',
            lineHeight: '2',
            fontFamily: 'Cafe24Simplehae, sans-serif',
            wordWrap: 'break-word',
            overflow: 'hidden',
          }}
        >
          {postcard.timestamp}
        </div>

        <div
          style={{
            position: 'absolute',
            top: isFixedSize? '78.3%' : '78.4%',
            zIndex: '900',
            width: '20%',
            color: '#412823',

            fontSize: '8px',
            fontFamily: 'pretandard, sans-serif',
            position: 'relative',
            left: '26.3%',
            textAlign: 'center',
            verticalAlign: 'middle',
            overflow: 'hidden',
          }}
        >
          {postcard.name}
        </div>




      </div>

              {/* Add a button to start audio playback and restart the GIF */}
        <button 
        onClick={handlePlayAudioAndRestartGIF} 
        style={{
          position: 'absolute',
          zIndex: '200000',
          bottom: '65px',
          cursor: 'pointer',
          overflow: 'hidden',

          /* 캐릭터 생성하기 */
          width: '170px',
          height: '35px',

          background: '#F8F6F1',
          border: '1px solid #E6E1DC',
          boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.25)',
          color: '#412823',
        }}
      >
        음악과 함께 춤추기
      </button>

      <footer style={{
          position: 'absolute',
          width:'100%',
          bottom: '0.1%',
          letterSpacing: '-0.025em',
        }}>
          <div>2024. 10. 12 - 10.29.</div>
          <div className="footerBorder">|</div>
        <a href="https://www.instagram.com/kkot.pida.gallery/">김화순 개인전</a>
        <div className="footerBorder">|</div>
        <a href="https://www.zahamuseum.org">자하미술관</a>
        </footer>

      {/* Add the audio element for test.mp3 */}
      <audio ref={audioRef} loop>
        <source src="/static/test.mp3" type="audio/wav" />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
};

export default PostcardShareView;
