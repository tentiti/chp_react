import React, { useRef, useEffect, useState } from 'react';
import axios from 'axios';
import Header from './Header';
import { useParams } from 'react-router-dom';
import * as THREE from 'three'; // Importing Three.js
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
  const audioRef = useRef(null);
  const canvasRef = useRef(null);

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
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',

      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
    }}>
      <div style={{
        height:'58px',
        position: 'fixed',
        top: '0',
        width: '100vw',
        zIndex: '1000',
      }}>
        <Header title={`'${postcard.name}'의 춤사위`} needthird={false} />
      </div>

      <div id="createdImages" style={{
        position: 'fixed',
        top: '-45px',
        width: '370px',
        height: '680px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        zIndex: '900',
      }}>
        <img 
          src={`/static/stockimages/postcardfinal_${postcard.number}.png`}
          alt="Postcard Background" 
          style={{
            position: 'absolute',
            top: '58px',
            width:'auto',
            height:'100%',
            zIndex: '800',
          }}
        />

        //움짤
        {postcard.gif_name && (
          <img
            key={gifKey} // Ensure the GIF is reloaded by changing the key
            src={`/api/uploads/${postcard.gif_name}`}
            alt="GIF"
            style={{
              position: 'absolute',

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
            width: '80vw',
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
          position: 'relative',
          zIndex: '2',
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: '#412823',
          color: '#fff',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
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
