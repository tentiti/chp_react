import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import RecordRTC from 'recordrtc';
import { UseVideo } from './VideoContext';
import { isTablet, isDesktop } from 'react-device-detect';
import Hpapereader from './Header';
import Invitation from './Invitation'; // Invitation 컴포넌트 임포트
import Credit from './Credit'
import { useScene } from './SceneContext'; // SceneContext 사용

const PostcardView = () => {
  //초대
  const [isInvitationVisible, setIsInvitationVisible] = useState(false); // Invitation의 가시성을 관리하는 상태

  //크레딧
  const [isCreditVisible, setIsCreditVisible] = useState(false);
  
  // Invitation을 보이게 하는 함수 (메뉴 클릭 시 호출됨)
  const handleMenuClick = () => {
    // setIsInvitationVisible(true);
    setIsCreditVisible(true);
    // setIsFloatingVisible(false); // Invitation을 보이면 플로팅 버튼을 숨김
  };

  // Invitation을 숨기고 원래 화면으로 돌아가는 함수 (뒤로가기 클릭 시 호출됨)
  const handleBackClick = () => {
    // setIsInvitationVisible(false);
    setIsCreditVisible(false);
    // setIsFloatingVisible(true); // Invitation을 숨기고 플로팅 버튼을 다시 보이게 함
  };

  const { videoFiles } = UseVideo(); // Blob URL 가져오기 (배열로 여러 개의 비디오 파일)
  const { id } = useParams();
  const [postcard, setPostcard] = useState(null);
  const [blobUrl, setBlobUrl] = useState(null); // State for storing the blob URL
  const [isRecording, setIsRecording] = useState(true); // 상태 추가 (녹화 중 여부)
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const recorderRef = useRef(null);
  const videoTextureRef = useRef(null); // Ref for video texture

  const [recordedBlob, setRecordedBlob] = useState(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const audioRef = useRef(null);

  const updateCanvasSize = () => {
    const width = window.innerWidth; // 100vw
    const height = (width / 9) * 16; // 16:9 aspect ratio
  
    if (isTablet || isDesktop) {
      const a = 390;
      const b = 693;
      return { width: a, height: b }; // Use valid keys 'width' and 'height'
    } 
    return { width, height };
  };

  const [showImage, setShowImage] = useState(false);

  const handleCloseImage = () => {
    setShowImage(false);
  };

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

  useEffect(() => {
    if (!postcard || !videoFiles || videoFiles.length === 0) return;

    const initThreeJS = async () => {
      const { width, height } = updateCanvasSize();

      sceneRef.current = new THREE.Scene();
      cameraRef.current = new THREE.OrthographicCamera(
        width / -2, width / 2, height / 2, height / -2, 0.1, 1000
      );
      cameraRef.current.position.z = 1;

      rendererRef.current = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true });
      rendererRef.current.setSize(width, height);  // Set to dynamic size
      rendererRef.current.setPixelRatio(window.devicePixelRatio);  // Maintain quality across devices
      rendererRef.current.setClearColor(0xffffff);

      // Background
      const loader = new THREE.TextureLoader();
      const bgTexture = await loader.loadAsync(`/static/stockimages/postcardfinal_${postcard.number}.png`);
      bgTexture.colorSpace = THREE.SRGBColorSpace;
      bgTexture.minFilter = THREE.LinearFilter;
      bgTexture.magFilter = THREE.LinearFilter;
      const bgGeometry = new THREE.PlaneGeometry(width, height);
      const bgMaterial = new THREE.MeshBasicMaterial({ map: bgTexture });
      const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);

      // Scale down the background mesh
      // bgMesh.scale.set(0.8, 0.8, 1); // Adjust these values as needed
      sceneRef.current.add(bgMesh);

      if (videoFiles[postcard.number - 1]) {
        const videoUrl = URL.createObjectURL(videoFiles[postcard.number - 1]);
        const video = document.createElement('video');
        video.src = videoUrl;
        video.crossOrigin = 'anonymous';
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        video.autoplay = true;
        // const speed = 0.32;
        const speed = 1;
        video.playbackRate = speed;

        // 비디오가 반복될 때마다 playbackRate를 다시 설정
        video.addEventListener('ended', () => {
          video.playbackRate = speed;
        });

        // 비디오를 재생할 때도 playbackRate를 유지
        video.addEventListener('play', () => {
          video.playbackRate = speed;
        });

        video.addEventListener('canplay', () => {
          videoTextureRef.current = new THREE.VideoTexture(video);
          videoTextureRef.current.colorSpace = THREE.SRGBColorSpace;
          videoTextureRef.current.minFilter = THREE.LinearFilter;
          videoTextureRef.current.magFilter = THREE.LinearFilter;
          videoTextureRef.current.format = THREE.RGBAFormat;

          const videoAspectRatio = video.videoWidth / video.videoHeight;
          const videoWidth = width * 0.8; // Scale down video width
          const videoHeight = videoWidth / videoAspectRatio;

          const videoGeometry = new THREE.PlaneGeometry(videoWidth, videoHeight);
          const videoMaterial = new THREE.MeshBasicMaterial({ map: videoTextureRef.current });
          const videoMesh = new THREE.Mesh(videoGeometry, videoMaterial);

          videoMesh.position.set(0, 20, 0.1);

          // Scale down the video mesh
          // videoMesh.scale.set(0.8, 0.8, 1); // Adjust these values as needed
          sceneRef.current.add(videoMesh);

          video.play();
          setIsVideoReady(true);
        });
      }

      const addText = (text, x, y, size = 50) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
      
        canvas.width = 2048;
        canvas.height = 2048;
        const fontSize = size * 3;
        ctx.font = `bold ${fontSize}px Cafe24Simplehae, sans-serif`;
        ctx.fillStyle = 'rgba(65, 40, 35, 1)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
      
        const maxLineLength = 38;
        const lines = [];
        for (let i = 0; i < text.length; i += maxLineLength) {
          lines.push(text.slice(i, i + maxLineLength));
        }
      
        const lineHeight = fontSize * 2.8;
        
        // 전체 텍스트의 높이를 계산
        const totalTextHeight = lines.length * lineHeight;
      
        // 텍스트 시작점을 조정하여 첫 줄이 고정된 Y 위치에 오도록 함
        lines.forEach((line, index) => {
          const adjustedYPos = canvas.height / 2 - totalTextHeight / 2 + index * lineHeight - 30;
          ctx.fillText(line, canvas.width / 2, adjustedYPos);
        });
      
        const xPos = (x / 393) * width;
        let yPos = (y / 700) * height * 1.2;
        if (text.length > 38) {
          yPos -= 19;
        } 
      
        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.format = THREE.RGBAFormat;
      
        const aspectRatio = canvas.width / canvas.height;
        const geometry = new THREE.PlaneGeometry(600 * aspectRatio, 600);
        const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
        const mesh = new THREE.Mesh(geometry, material);
      
        mesh.position.set(xPos, yPos, 0.2);
        sceneRef.current.add(mesh);
      };
      

      addText(`${postcard.comment}`, 0, -165, 12);
      addText(postcard.timestamp, 0, -210, 8);
      addText(`${postcard.name}`, 106, -236, 12);
    };

    initThreeJS();

    const animate = () => {
      requestAnimationFrame(animate);
      if (videoTextureRef.current) {
        videoTextureRef.current.needsUpdate = true;
      }

      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };
    animate();

    window.addEventListener('resize', () => {
      const { width, height } = updateCanvasSize();

      cameraRef.current.left = width / -2;
      cameraRef.current.right = width / 2;
      cameraRef.current.top = height / 2;
      cameraRef.current.bottom = height / -2;
      cameraRef.current.updateProjectionMatrix();

      rendererRef.current.setSize(width, height);
      canvasRef.current.style.width = `${width}px`;
      canvasRef.current.style.height = `${height}px`;
    });
  }, [postcard, videoFiles]);


  useEffect(() => {
    if (isVideoReady) {
      setTimeout(() => startRecording(), 500);
    }
  }, [isVideoReady]);

  const startRecording = () => {
    if (!audioRef.current || !audioRef.current.readyState) {
      console.error('Audio element is not initialized or not ready');
      return;
    }

    const canvasStream = canvasRef.current.captureStream(24);
    const audioContext = new (window.AudioContext)();
    const audioSource = audioContext.createMediaElementSource(audioRef.current);
    const destination = audioContext.createMediaStreamDestination();

    audioSource.connect(destination);
    audioSource.connect(audioContext.destination);

    const combinedStream = new MediaStream([...canvasStream.getTracks(), ...destination.stream.getTracks()]);

    const recorder = new RecordRTC(combinedStream, {
      type: 'video',
      mimeType: 'video/mp4',
      bitsPerSecond: 8000000,
    });

    recorder.startRecording();

    // 비디오 설정
  const video = document.querySelector('video'); // 비디오 엘리먼트 참조
  if (video) {
    const playbackSpeed = 0.32; // 재생 속도 설정 (0.5배속)
    
    // 비디오 설정: 처음부터, 반복, 재생 속도 설정
    video.currentTime = 0; // 비디오를 처음부터 재생
    video.loop = true;     // 반복 재생
    video.playbackRate = playbackSpeed; // 재생 속도 설정

    // 재생 시 재생 속도를 유지하기 위한 이벤트 리스너 추가
    video.addEventListener('play', () => {
      video.playbackRate = playbackSpeed;
    });

    // 비디오 반복 시에도 재생 속도를 유지하기 위한 이벤트 리스너 추가
    video.addEventListener('ended', () => {
      video.playbackRate = playbackSpeed;
      video.currentTime = 0; // 반복 시 처음부터 재생
      video.play(); // 재생 시작
    });

    // 비디오 재생 시작
    video.play().catch((err) => {
      console.error('Video playback failed:', err);
    });
  }

  if (audioRef.current) {
    // 오디오 재생
    audioRef.current.play().catch((err) => {
      console.error('Audio playback failed:', err);
    });
  }


    recorderRef.current = recorder;

    setTimeout(() => stopRecording(), 18750);
  };

  const stopRecording = () => {
    if (recorderRef.current) {
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
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText('hello world!');
        console.log('Text copied to clipboard');
      } catch (error) {
        console.error('Failed to copy text:', error);
      }
    }

    if (blobUrl) {
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = blobUrl;
      a.download = `${postcard?.name}의 춤사위.mp4`;
      document.body.appendChild(a);
      a.click();
    }
  };

  const shareVideo = async () => {
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText('hello world!');
        console.log('Text copied to clipboard');
      } catch (error) {
        console.error('Failed to copy text:', error);
      }
    }

    if (navigator.canShare && recordedBlob) {
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

  const navigate = useNavigate();
  // const handleMenuClick = () => {
  //   setShowImage(true);
  // };
  const goToCreditPage = () => {
    navigate(`/credit/${postcard.id}`);  // 버튼 클릭 시 /credit 경로로 이동
  };


  return (
    <div style={{ backgroundImage: `url('/static/stockimages/background_paper.png')`, width: '100%', height: '100%', zIndex: '900' }}>
      {isInvitationVisible && (
        <div className={`invitation-container ${isInvitationVisible ? 'visible' : ''}`}>
          <Invitation onBack={handleBackClick} /> {/* Invitation 컴포넌트 및 뒤로가기 핸들러 */}
        </div>
      )}

    {isCreditVisible && (
        <div className={`invitation-container ${isCreditVisible ? 'visible' : ''}`}>
          <Credit onBack={handleBackClick} /> {/* Invitation 컴포넌트 및 뒤로가기 핸들러 */}
        </div>
      )}
     
      <audio ref={audioRef} src="/static/test.mp3" loop></audio>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between', // 아이콘은 양쪽 끝으로, 텍스트는 가운데로
          alignItems: 'center', // Vertically center all elements
          width: '100%',
          backgroundColor: 'transparent',
          height: '58px',
          backgroundColor: '#F8F6F1',
          position: 'fixed',
          top: '0',
          zIndex: '1000',
          left: '0',
        }}
      >
        {/* Left Home Icon */}
        <div onClick={() => navigate('/home')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', paddingLeft: '20px' }}>
          <img src="/static/icons/home.png" alt="home" style={{ width: '24px', height: '24px' }} />
        </div>

        {/* Center Text */}
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

        {/* Right Menu Icon */}
        <div onClick={handleMenuClick} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', paddingRight: '20px' }}>
          <img src="/static/icons/hamburger.png" alt="menu" id="menu-button" />
        </div>
      </header>



      <canvas
        ref={canvasRef}
        style={{
          position: 'relative', // 상대적 위치로 설정하여 헤더 아래에 표시
          top:'0px',
          left: '0',

          aspectRatio: '9 / 16',
          // width: '70%',
          height: 'calc(70vw * (16 / 9))',
          maxHeight: 'calc(100vh - 178px)', // 화면 높이를 넘지 않도록 설정
          overflow: 'hidden',
          zIndex: '900', // 헤더보다 아래에 표시되도록 설정
          transform: 'translateY(-5%)',
        }}
      />
      {/* Promotion Image */}
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
          backgroundColor: '#F8F6F1',
          borderTop: '1px solid #E6E1DC',
          zIndex: '1100',
          gap: '20px',
          padding: '0 10px',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
      <button onClick={goToCreditPage}>
        Go to Credit Page
      </button>

        <button className="upbutton" onClick={downloadVideo} disabled={!blobUrl}>
          {isRecording ? '공유 영상 준비 중...' : '영상 저장하기'}
        </button>
        <button className="upbutton" onClick={shareVideo} disabled={!blobUrl}>
          {isRecording ? '공유 영상 준비 중...' : '영상 공유하기'}
        </button>
      </div>
    </div>
  );
};

export default PostcardView;
