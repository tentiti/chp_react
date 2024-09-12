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
        });
      }
      
      
      // Text
      const addText = (text, x, y, size = 50) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
    
        // 캔버스 크기를 더 크게 설정 (더 높은 해상도)
        canvas.width = 393;  // 더 큰 너비
        canvas.height = 700; // 더 큰 높이
    
        // 더 큰 텍스트 크기를 사용
        ctx.font = `${size}px Cafe24Simplehae, sans-serif`;
        ctx.fillStyle = 'rgba(65, 40, 35, 1)'; // 수정된 부분
        ctx.textAlign = 'center';
        ctx.fillText(text, canvas.width / 2, 100);  // 텍스트 위치는 가운데로 유지
    
        // 캔버스 크기에 맞춘 좌표 변환
        const xPos = (x / 393) * width;  // 비율대로 크기 변환
        const yPos = (y / 700) * 200;
    
        // 텍스처 생성
        const texture = new THREE.CanvasTexture(canvas);
    
        // PlaneGeometry의 크기도 텍스트가 충분히 보이도록 설정 (비율 맞추기)
        const geometry = new THREE.PlaneGeometry(400, 600);  // 더 큰 크기 설정
        const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
        const mesh = new THREE.Mesh(geometry, material);
    
        // 변환된 좌표에 메시를 배치
        mesh.position.set(xPos, yPos, 0.2);
        sceneRef.current.add(mesh);
      };
    
      // 예시 텍스트 추가 (크기와 좌표 수정)
      addText(`${postcard.comment}`,  0, -1400, 12); // 크기를 키운 텍스트
      addText(postcard.timestamp,  0, -1590, 8);   // 타임스탬프도 크기 키움
      addText(`${postcard.name}`, 108, -1680, 12); // 이름 텍스트도 크기 증가
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
      
      rendererRef.current.setSize(width * 2, height * 2);  // 실제 크기를 더 크게 설정
      canvasRef.current.style.width = `${width}px`;  // CSS에서 크기를 원래대로 유지
      canvasRef.current.style.height = `${height}px`;

    });

    // 로딩과 동시에 녹화 시작
    startRecording();
  }, [postcard, videoFiles]);

  const startRecording = () => {
    const canvasStream = canvasRef.current.captureStream(30);
    
    // 오디오 엘리먼트 생성 및 재생
    const audio = new Audio('/static/test.mp3');
    audio.loop = true;
    audio.play();
  
    // 오디오 트랙을 가져옴
    const audioContext = new AudioContext();
    const audioSource = audioContext.createMediaElementSource(audio);
    const destination = audioContext.createMediaStreamDestination();
    audioSource.connect(destination);
  
    // 비디오 스트림과 오디오 스트림을 결합
    const combinedStream = new MediaStream([...canvasStream.getTracks(), ...destination.stream.getTracks()]);
  
    // RecordRTC 사용
    const recorder = new RecordRTC(combinedStream, {
      type: 'video',
      mimeType: 'video/mp4',
      bitsPerSecond: 8000000,
    });
  
    recorder.startRecording();
    recorderRef.current = recorder;
  
    // 10초 후 녹화 중지
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
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
    <Header 
      title={postcard?.name ? `'${postcard.name}'의 춤사위'` : '춤사위'}
      onMenuClick={handleMenuClick}
    />


      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',   // 캔버스를 절대 위치로 설정      // 상단에서 58px 만큼 띄움
          top:'58px',
          left: '0',              // 화면 왼쪽에 맞춤
          width: '100vw',         // 화면 너비를 100% 사용
          height: 'calc(100vw * (16 / 9))',  // 9:16 비율을 유지하면서 높이를 설정
          overflow: 'hidden'      // 넘침을 방지
        }}
      />
    
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', position:'fixed', bottom:'0', height:'calc(43.75vw - 58px)'}}>
        <button onClick={downloadVideo} style={{ marginRight: '10px' }} disabled={!blobUrl}>
          {isRecording ? '공유 영상 준비 중...' : 'Download Video'}
        </button>
        <button onClick={shareVideo} disabled={!blobUrl}>
          {isRecording ? '공유 영상 준비 중...' : 'Share Video'}
        </button>
      </div>
    </div>
  );
};

export default PostcardView;
