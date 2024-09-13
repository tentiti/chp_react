import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import RecordRTC from 'recordrtc';
import { UseVideo } from './VideoContext';
import Header from './Header';

const PostcardView = () => {
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
    return { width, height };
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
      sceneRef.current.add(bgMesh);

      if (videoFiles[postcard.number - 1]) {  // postcard.number-1 번째 영상
        const videoUrl = URL.createObjectURL(videoFiles[postcard.number - 1]); // Blob -> URL 변환
        const video = document.createElement('video'); // 비디오 엘리먼트 생성
        video.src = videoUrl;
        video.crossOrigin = 'anonymous';
        video.loop = true; // 비디오 루프 설정
        video.muted = true; // 비디오 음소거 (자동 재생 가능)
        video.playsInline = true; // 모바일에서 inline 재생 허용 (필수)
        video.autoplay = true;  // autoplay 설정, 텍스처로 사용 시 필요
        video.playbackRate = 0.4;  // Slow down playback to half speed
      
        

        // 비디오 엘리먼트를 DOM에 추가하지 않음
        video.addEventListener('canplay', () => {
          videoTextureRef.current = new THREE.VideoTexture(video);
          videoTextureRef.current.colorSpace = THREE.SRGBColorSpace;
          videoTextureRef.current.minFilter = THREE.LinearFilter;
          videoTextureRef.current.magFilter = THREE.LinearFilter;
          videoTextureRef.current.format = THREE.RGBAFormat;
      
          const videoAspectRatio = video.videoWidth / video.videoHeight;
          const canvasWidth = window.innerWidth;
          const videoWidth = canvasWidth * 0.8;
          const videoHeight = videoWidth / videoAspectRatio;
      
          const videoGeometry = new THREE.PlaneGeometry(videoWidth, videoHeight);
          const videoMaterial = new THREE.MeshBasicMaterial({ map: videoTextureRef.current });
          const videoMesh = new THREE.Mesh(videoGeometry, videoMaterial);
      
          videoMesh.position.set(0, 20, 0.1);
          sceneRef.current.add(videoMesh);
          
          // 비디오를 Three.js 텍스처로 사용하려면 재생 필요
          video.play();
          setIsVideoReady(true);
        });
      }
      
      
      // Text
      const addText = (text, x, y, size = 50) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
      
        // Further increase canvas size for higher resolution
        canvas.width = 2048;
        canvas.height = 2048;
      
        // Increase font size significantly
        const fontSize = size * 3; // Doubled from previous version
        ctx.font = `bold ${fontSize}px Cafe24Simplehae, sans-serif`;
        ctx.fillStyle = 'rgba(65, 40, 35, 1)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
      
        // Enhance text shadow for better visibility
        // ctx.shadowColor = 'rgba(255, 255, 255, 0.7)';
        // ctx.shadowBlur = 6;
        // ctx.shadowOffsetX = 3;
        // ctx.shadowOffsetY = 3;
      
        // Anti-aliasing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
      
        const maxLineLength = 45; // 정확하게 40글자로 자름
        const lines = [];
        let currentLine = '';
        
        for (let i = 0; i < text.length; i += maxLineLength) {
          const line = text.slice(i, i + maxLineLength);
          lines.push(line);
        }
        
        const lineHeight = fontSize * 2.8; // 줄 간격
        lines.forEach((line, index) => {
          ctx.fillText(line, canvas.width / 2, (canvas.height / 2) + (index - lines.length / 2) * lineHeight);
        });
        
      
        // Adjust positioning to account for larger text
        const xPos = (x / 393) * width;
        const yPos = (y / 700) * height * 1.2; // Moved text slightly down
      
        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.format = THREE.RGBAFormat;
      
        const aspectRatio = canvas.width / canvas.height;
        const geometry = new THREE.PlaneGeometry(600 * aspectRatio, 600); // Increased size
        const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
        const mesh = new THREE.Mesh(geometry, material);
      
        mesh.position.set(xPos, yPos, 0.2);
        sceneRef.current.add(mesh);
      };
    
    
      // 예시 텍스트 추가 (크기와 좌표 수정)
      addText(`${postcard.comment}`,  0, -178, 12); // 크기를 키운 텍스트
      addText(postcard.timestamp,  0, -206, 8);   // 타임스탬프도 크기 키움
      addText(`${postcard.name}`, 108, -233, 12); // 이름 텍스트도 크기 증가
    };

    initThreeJS();

    const animate = () => {
      requestAnimationFrame(animate);
      if (videoTextureRef.current) {
        videoTextureRef.current.needsUpdate = true;  // Ensure the video texture updates
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
      
      rendererRef.current.setSize(width, height);  // 실제 크기를 더 크게 설정
      canvasRef.current.style.width = `${width}px`;  // CSS에서 크기를 원래대로 유지
      canvasRef.current.style.height = `${height}px`;

    });


  }, [postcard, videoFiles]);

    // 새로운 useEffect 추가: isVideoReady 상태 변경 감지 및 녹화 시작
  useEffect(() => {
    if (isVideoReady) {
      // alert('녹화를 시작합니다. 10초 후 자동으로 녹화가 중지됩니다.');
      // 비디오가 준비되면 0.5초 후 녹화 시작
      setTimeout(() => startRecording(), 500);
    }
  }, [isVideoReady]);

  const startRecording = () => {
    const canvasStream = canvasRef.current.captureStream(30);
    
    // Check if the audio context is already created
    // const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audioContext = new (window.AudioContext)();

    // Create audio source only if it hasn't been created yet
    const audioSource = audioContext.createMediaElementSource(audioRef.current);
    const destination = audioContext.createMediaStreamDestination();
    
    // Connect audio source to destination
    audioSource.connect(destination);
    
    // Connect the audio context to the destination (speakers)
    audioSource.connect(audioContext.destination); // Output to speakers
    
    // Combine video stream and audio stream
    const combinedStream = new MediaStream([...canvasStream.getTracks(), ...destination.stream.getTracks()]);
  
    // Use RecordRTC to record the combined stream
    const recorder = new RecordRTC(combinedStream, {
      type: 'video',
      mimeType: 'video/mp4',
      bitsPerSecond: 8000000,
    });
  
    recorder.startRecording();
    audioRef.current.play(); // Ensure the audio starts playing
    recorderRef.current = recorder;
  
    // Stop recording after 10 seconds
    setTimeout(() => stopRecording(), 10000);
};


  const stopRecording = () => {
    if (recorderRef.current) {
      recorderRef.current.stopRecording(() => {
        const blob = recorderRef.current.getBlob();
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
        setRecordedBlob(blob); // Store the actual blob
        setIsRecording(false); // 녹화 완료

        // 오디오 재생 중지
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }

      });
    }
  };

  const downloadVideo = () => {
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
      // 클립보드에 "hello world!" 복사
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
  const handleMenuClick = useCallback(() => {
    console.log('Navigating to Home');
    navigate('/Home', { replace: true });
  }, [navigate]);

  return (

    
<div style={{
  // position: 'relative', // 상위 컨테이너를 상대적으로 설정하여 하위 요소 배치
}}>
  <audio ref={audioRef} src="/static/test.mp3" loop></audio>
  <div style={{
    height: '58px',
    backgroundColor: '#F8F6F1',
    position: 'fixed',
    top: '0',
    zIndex: '1000', 
  }}>
    <Header 
      title={postcard?.name ? `'${postcard.name}'의 춤사위'` : '춤사위'}
      onMenuClick={handleMenuClick}
      style={{ }}
    />
  </div>


  <canvas
    ref={canvasRef}
    style={{
      position: 'relative', // 상대적 위치로 설정하여 헤더 아래에 표시
      left: '0',
      width: '70vw',
      height: 'calc(70vw * (16 / 9))',
      overflow: 'hidden',
      zIndex: '900',        // 헤더보다 아래에 표시되도록 설정
      transform: 'translateY(-5%)',
    }}
  />


  {/* Promotion Image */}
  <img 
    src="/static/stockimages/promotion.png" 
    alt="Promotion"
    style={{
      position: 'fixed',
      right: '20px',
      bottom: 'calc(25vw * (16 / 9) - 100px)',
    
      width: '70vw',
      height: 'auto',
      zIndex: '1100',
    }} 
  />
  <div id="upbuttons" style={{ 
    display: 'flex', 
    justifyContent: 'center',
     marginTop: '20px',
     height: 'calc(25vw * (16 / 9) - 140px)'
     }}>
    <button className="upbutton" onClick={downloadVideo} disabled={!blobUrl}>
      {isRecording ? '공유 영상 준비 중...' : 'Download Video'}
    </button>
    <button className="upbutton" onClick={shareVideo} disabled={!blobUrl}>
      {isRecording ? '공유 영상 준비 중...' : 'Share Video'}
    </button>
  </div>
</div>

  );
};

export default PostcardView;
