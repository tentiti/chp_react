import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import RecordRTC from 'recordrtc';
import { UseVideo } from './VideoContext';
import { isTablet, isDesktop } from 'react-device-detect';
import Header from './Header';
import Invitation from './Invitation';
import { useScene } from './SceneContext';
import './PostcardView.css';

const Credit = () => {
  console.log('Credit component rendered');

  // Refs
  const audioContextRef = useRef(null);
  const audioSourceRef = useRef(null);
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const recorderRef = useRef(null);
  const videoTextureRef = useRef(null);

  // State
  const [isInvitationVisible, setIsInvitationVisible] = useState(false);
  const [isCreditVisible, setIsCreditVisible] = useState(false);
  const [postcard, setPostcard] = useState(null);
  const [blobUrl, setBlobUrl] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [isVideoReady, setIsVideoReady] = useState(false);

  // Hooks
  const { sceneData } = useScene();
  const { videoFiles } = UseVideo();
  const { id } = useParams();
  const navigate = useNavigate();

  // Functions
  const handleMenuClick = () => {
    console.log('Menu clicked');
    setIsInvitationVisible(true);
  };

  const handleBackClick = () => {
    console.log('Back clicked');
    setIsInvitationVisible(false);
  };

  const updateCanvasSize = () => {
    const width = window.innerWidth;
    const height = (width / 9) * 16;
  
    if (isTablet || isDesktop) {
      return { width: 390, height: 693 };
    } 
    return { width, height };
  };

  const startRecording = () => {
    if (isRecording) {
      console.error('Already recording');
      return;
    }

    console.log('Starting recording');
    setIsRecording(true);
  
    if (!audioRef.current || audioRef.current.readyState !== 4) {
      console.error('Audio is not ready');
      return;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
  
    if (!audioSourceRef.current) {
      audioSourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
    }
  
    const destination = audioContextRef.current.createMediaStreamDestination();
  
    audioSourceRef.current.connect(destination);
    audioSourceRef.current.connect(audioContextRef.current.destination);

    const canvasElement = rendererRef.current.domElement;
    if (!canvasElement.captureStream) {
      console.error('captureStream is not supported on this canvas element');
      return;
    }
  
    const canvasStream = canvasElement.captureStream(24);
    const combinedStream = new MediaStream([...canvasStream.getTracks(), ...destination.stream.getTracks()]);
  
    const recorder = new RecordRTC(combinedStream, {
      type: 'video',
      mimeType: 'video/mp4',
      bitsPerSecond: 8000000,
    });
  
    recorder.startRecording();
  
    if (audioRef.current) {
      audioRef.current.play().catch((err) => {
        console.error('Audio playback failed:', err);
      });
    }
  
    recorderRef.current = recorder;
  
    setTimeout(() => stopRecording(), 2000);
  };

  const stopRecording = () => {
    if (recorderRef.current) {
      console.log('Stopping recording');
      recorderRef.current.stopRecording(() => {
        const blob = recorderRef.current.getBlob();
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
        setRecordedBlob(blob);
        setIsRecording(false);

        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      });
    }
  };

  const downloadVideo = async () => {
    alert('downloadVideo');
    if (blobUrl) {
      console.log('Downloading video');
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = blobUrl;
      a.download = `${postcard?.name}의 춤사위.mp4`;
      document.body.appendChild(a);
      a.click();
    }
  };

  const shareVideo = async () => {
    if (navigator.canShare && recordedBlob) {
      console.log('Sharing video');
      const file = new File([recordedBlob], `${postcard?.name}의 춤사위.mp4`, { type: 'video/mp4' });

      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: 'Postcard Video',
            text: 'Check out this postcard video!',
            files: [file],
          });
          console.log('Video shared successfully');
        } catch (error) {
          console.error('Error sharing video:', error);
        }
      } else {
        console.warn('Sharing not supported on this device');
      }
    } else {
      console.warn('Sharing not supported or no video recorded');
    }
  };

  // Effects
  useEffect(() => {
    console.log('Fetching postcard data');
    const fetchPostcard = async () => {
      try {
        const response = await axios.get(`/api/postcard/${id}`, { cache: 'no-cache' });
        if (response.status === 200) {
          console.log('Postcard data fetched successfully:', response.data);
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

  useEffect(() => {
    const audioElement = audioRef.current;
    
    const handleCanPlay = () => {
      console.log('Audio is ready to play');
      setIsVideoReady(true);
    };

    if (audioElement) {
      audioElement.addEventListener('canplay', handleCanPlay);
    }

    return () => {
      if (audioElement) {
        audioElement.removeEventListener('canplay', handleCanPlay);
      }
    };
  }, []);

  useEffect(() => {
    if (sceneData.scene && sceneData.camera && sceneData.renderer && canvasRef.current) {
      const initThreeJS = async () => {
      console.log('Setting up 3D scene');
      sceneRef.current = sceneData.scene;

      sceneRef.current.traverse((child) => {
        if (child.isMesh) {
          console.log('Model Position:', child.position);
          console.log('Model Scale:', child.scale);
        }
      });
      

      
      const { width, height } = updateCanvasSize();
      const aspect = width / height;

      //새 렌더러
      rendererRef.current = new THREE.WebGLRenderer({
        antialias: true,
        canvas: canvasRef.current, // canvasRef로 전달된 canvas에 직접 렌더링
        alpha: true  // 투명 배경 설정
      });
      rendererRef.current.setClearColor(0x000000, 0);  // 완전 투명 배경

      rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      rendererRef.current.setSize(width, height);

      //새로운 카메라
      // 카메라 설정 (OrthographicCamera)
      const frustumSize = 40; // 카메라에 보이는 영역의 크기
      cameraRef.current = new THREE.OrthographicCamera(
        frustumSize * aspect / -2, frustumSize * aspect / 2, 
        frustumSize / 2, frustumSize / -2, 
        0.1, 10
      );
      cameraRef.current.position.set(0, 0, 5); // 카메라 위치 설정
      cameraRef.current.lookAt(0, 0, 0); // 카메라가 바라보는 위치



      // 카메라 설정 수정
      // cameraRef.current = new THREE.PerspectiveCamera(10, aspect, 0.01, 10000);
      // cameraRef.current.position.set(0, 0, 100);
      // cameraRef.current.lookAt(sceneRef.current.position);
      // cameraRef.current.aspect = width / height;
      // cameraRef.current.updateProjectionMatrix();
      



      // rendererRef.current = new THREE.WebGLRenderer({
      //   antialias: true,  // 화질 향상을 위해 안티앨리어싱 적용
      //   canvas: canvasRef.current // canvasRef로부터 전달된 캔버스에 직접 렌더링
      // });

      // rendererRef.current.setSize(width, height, false);
      // rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio, 2)); 

      // rendererRef.current.setClearColor(0xffffff, 1);  // 배경색을 흰색으로 설정
      
      // if (!canvasRef.current.hasChildNodes()) {
      //   canvasRef.current.appendChild(rendererRef.current.domElement);
      // }

      // 배경 이미지 추가
      const loader = new THREE.TextureLoader();
      loader.load(`/static/stockimages/postcardfinal_${postcard?.number}.png`, (bgTexture) => {
        bgTexture.generateMipmaps = true;
        bgTexture.colorSpace = THREE.SRGBColorSpace;
        bgTexture.minFilter = THREE.LinearMipMapLinearFilter;
        bgTexture.magFilter = THREE.LinearFilter;
        bgTexture.anisotropy = rendererRef.current.capabilities.getMaxAnisotropy();


        const bgMaterial = new THREE.MeshBasicMaterial({ map: bgTexture });

        const canvasWidth = canvasRef.current.clientWidth;
        const canvasHeight = canvasRef.current.clientHeight;    
        const canvasAspect = canvasWidth / canvasHeight;

        alert(canvasWidth);

        // 배경 이미지의 가로 세로 비율 계산
        const bgAspect = bgTexture.image.width / bgTexture.image.height;

        let bgWidth, bgHeight;

        // 캔버스를 완전히 채우도록 배경 이미지 크기 조정
        if (bgAspect > canvasAspect) {
          bgHeight = canvasHeight;
          bgWidth = canvasHeight * bgAspect;
        } else {
          bgWidth = canvasWidth;
          bgHeight = canvasWidth / bgAspect;
        }

        const bgMesh = new THREE.Mesh(
          new THREE.PlaneGeometry(frustumSize * canvasAspect, frustumSize), 
          bgMaterial
        );
        bgMesh.position.z = -3;

        // sceneRef.current.add(bgMesh);
      });
    };

    initThreeJS();
      // 씬 정리
      // while(sceneRef.current.children.length > 0) { 
      //   sceneRef.current.remove(sceneRef.current.children[0]); 
      // }

      // 여기에 애니메이션 요소들을 추가합니다.
      // 예: sceneRef.current.add(animationMesh);

      const animate = () => {
        requestAnimationFrame(animate);
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      };

      animate();

      return () => {
        rendererRef.current.dispose();
      };
    }
  }, [canvasRef.current]);

  //화질 조정
  


  useEffect(() => {
    if (isVideoReady && !isRecording) {
      console.log('Video is ready, starting recording');
      setTimeout(() => startRecording(), 500);
    }
  }, [isVideoReady, isRecording]);

  if (!postcard) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ 
      backgroundColor: 'yellow',
      width: '100%', 
      height: '100%', 
      zIndex: '900',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      {isInvitationVisible && (
        <div className={`invitation-container ${isInvitationVisible ? 'visible' : ''}`}>
          <Invitation onBack={handleBackClick} /> 
        </div>
      )}
      {isCreditVisible && (
        <div className={`invitation-container ${isCreditVisible ? 'visible' : ''}`}>
          <Credit onBack={handleBackClick} /> 
        </div>
      )}

      <audio ref={audioRef} src="/static/test.mp3" loop></audio>
      
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between', 
          alignItems: 'center', 
          width: '100%',
          backgroundColor: '#F8F6F1',
          position: 'fixed',
          top: '0',
          zIndex: '1000',
          left: '0',
        }}
      >
        <div onClick={() => navigate('/home')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', paddingLeft: '20px' }}>
          <img src="/static/icons/home.png" alt="home" style={{ width: '24px', height: '24px' }} />
        </div>

        <div
          style={{
            textAlign: 'center',
            fontSize: '20px',
            color: '#412823',
            lineHeight: '1',
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          {postcard?.name ? `'${postcard.name}'의 춤사위` : '춤사위'}
        </div>

        <div onClick={handleMenuClick} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', paddingRight: '20px' }}>
          <img src="/static/icons/hamburger.png" alt="menu" id="menu-button" />
        </div>
      </header>

      {/* <canvas
        ref={canvasRef}
        style={{
          position: 'relative',
          top: '0px',
          left: '0',
          // position: 'fixed',
          // top:'20%',
          // left: '10%',
          aspectRatio: '9 / 16',
          height: 'calc(70vw * (16 / 9))',
          maxHeight: 'calc(100vh - 178px)', 
          border: '1px solid #E6E1DC',
          backgroundColor: 'blue',
          overflow: 'hidden',
          zIndex: '900',
          transform: 'translateY(-5%)',
        }}
      ></canvas> */}

      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '9 / 16',
        maxHeight: 'calc(100vh - 178px)',
        overflow: 'hidden',
      }}>
        <img
          src={`/static/stockimages/postcardfinal_${postcard?.number}.png`}
          alt="Background"
          style={{            
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
          }}
        />
      </div>

      <img
        src="/static/stockimages/promotion.png"
        alt="Promotion"
        style={{
          position: 'fixed',
          right: '5%',
          bottom: '58px',
          width: '70%',
          height: 'auto',
          zIndex: '1100',
        }}
      />

      <div
        id="upbuttons"
        style={{
          position: 'fixed',
          bottom: '0',
          width: '100%',
          height: '60px',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          backgroundColor: 'yellowgreen',
          borderTop: '1px solid #E6E1DC',
          zIndex: '1100',
          gap: '20px',
          padding: '0 10px',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        <button className="upbutton" onClick={downloadVideo}>
          {isRecording ? '공유 영상 준비 중...' : '영상 저장하기'}
        </button>
        <button className="upbutton" onClick={shareVideo}>
          {isRecording ? '공유 영상 준비 중...' : '영상 공유하기'}
        </button>
      </div>
    </div>
  );
};

export default Credit;