import React, { useRef, useEffect, useState } from 'react';
import axios from 'axios';
import Header from './Header';
import { useParams } from 'react-router-dom';
import * as THREE from 'three'; // Importing Three.js
import { isTablet, isDesktop } from 'react-device-detect';
import './PostcardView.css';

const backgrounds = [
  "/static/stockimages/bg1.png",
  "/static/stockimages/bg1.png",
  "/static/stockimages/bg2.png",
  "/static/stockimages/bg3.png",
];

const modelPositions = [
  { x: 67, y: 150, width: 147, height: 190 },
  { x: 67, y: 150, width: 147, height: 190 },
  { x: 168, y: 102, width: 147, height: 190 },
  { x: 196, y: 65, width: 147, height: 190 },
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
    if (audioRef.current) {
      audioRef.current.play().catch(err => {
        console.error("Audio playback failed:", err);
      });
    }
    // Restart GIF by updating the gifKey
    setGifKey(prevKey => prevKey + 1);
  };

  useEffect(() => {
    if (canvasRef.current) {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current });
      renderer.setSize(window.innerWidth, window.innerHeight);

      const geometry = new THREE.BoxGeometry();
      const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      const cube = new THREE.Mesh(geometry, material);
      scene.add(cube);

      camera.position.z = 5;

      const animate = function () {
        requestAnimationFrame(animate);
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
        renderer.render(scene, camera);
      };

      animate();
    }
  }, [canvasRef]);

  if (!postcard) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{
      position: 'absolute',
      top: '0',
      left: '0',
      backgroundImage: `url('/static/stockimages/background_paper.png')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      width: isFixedSize ? '390px' : '100vw', // 고정 크기 또는 가로 100%
      height: isFixedSize ? '780px' : '100vh', // 고정 크기 또는 세로 100%

      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      overflow: 'hidden',
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
        top: '9px',
        width: 'calc((100% - 108px)',
        maxWidth: '390px',
        height: 'calc(100% - 108px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        zIndex: '900',
        overflow: 'hidden',
        backgroundImage: `url(/static/stockimages/share_postcardfinal_${postcard.number}.png)`,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',  // 이미지가 가운데에 위치하게 설정
      }}>


        //움짤
        {postcard.gif_name && (
          <img
            key={gifKey} // Ensure the GIF is reloaded by changing the key
            src={`/api/uploads/${postcard.gif_name}`}
            alt="GIF"
            style={{
              position: 'absolute',
              overflow: 'hidden',

              zIndex: '900',
              top: `calc(${modelPositions[postcard.number].y}px * 0.8)`,
              left: `calc(${modelPositions[postcard.number].x}px * 0.8)`,
              width: `calc(${modelPositions[postcard.number].width}px * 0.8)`,
              height: `calc(${modelPositions[postcard.number].width}px * 0.8)`,
            }}
          />
        )}

        //한마디
      
        <div
          style={{
            position: 'absolute',
            top: '83.5%',
            zIndex: '900',
            width: '85%',
            color: '#412823',
            fontSize: '12px',
            textAlign: 'center',
            lineHeight: '2',
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
            top: '91%',
            zIndex: '900',
            width: '20%',
            color: '#412823',
            zIndex: '900',
            marginTop: '5px',
            width: '320px',
            color: '#412823',
            fontSize: '8px',
            textAlign: 'center',
            lineHeight: '1.6',
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
            top: '90%',
            zIndex: '900',
            width: '20%',
            color: '#412823',

            fontSize: '8px',
            fontFamily: 'pretandard, sans-serif',
            position: 'relative',
            left: '105px',
            textAlign: 'center',
            overflow: 'hidden',
          }}
        >
          {postcard.name}
        </div>

        <footer>
          <div>2024. 10. 12 - 10.29.</div>
          <div className="footerBorder">|</div>
          <a href="https://google.com">김화순 개인전</a>
          <div className="footerBorder">|</div>
          <a href="https://google.com">자하미술관</a>
        </footer>
      </div>

      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', display: 'none' }}></canvas>

      {/* Add a button to start audio playback and restart the GIF */}
      <button 
        onClick={handlePlayAudioAndRestartGIF} 
        style={{
          position: 'fixed',
          zIndex: '200000',
          top: '60vh',
          padding: '10px 20px',
          backgroundColor: '#412823',
          color: '#fff',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          overflow: 'hidden',
        }}
      >
        Play Audio & Restart GIF
      </button>

      {/* Add the audio element for test.mp3 */}
      <audio ref={audioRef} loop>
        <source src="/static/test.mp3" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
};

export default PostcardShareView;
