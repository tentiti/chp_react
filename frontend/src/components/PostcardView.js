import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import RecordRTC from 'recordrtc';
import { useVideo } from './VideoContext';
import Header from './Header';

const PostcardView = () => {
  const { videoFile } = useVideo(); // Blob URL 가져오기
  const { id } = useParams();
  const [postcard, setPostcard] = useState(null);
  const [blobUrl, setBlobUrl] = useState(null); // State for storing the blob URL
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const recorderRef = useRef(null);
  const videoTextureRef = useRef(null); // Ref for video texture

  const updateCanvasSize = () => {
    const width = window.innerWidth; // 100vw
    const height = (width / 9) * 16; // 16:9 aspect ratio
    return { width, height };
  };

  useEffect(() => {
    const fetchPostcard = async () => {
      try {
        const response = await axios.get(`https://127.0.0.1:8000/postcard/${id}`, { cache: 'no-cache' });
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
    if (!postcard) return;

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
      bgTexture.minFilter = THREE.LinearFilter;
      bgTexture.magFilter = THREE.LinearFilter;
      const bgGeometry = new THREE.PlaneGeometry(width, height);
      const bgMaterial = new THREE.MeshBasicMaterial({ map: bgTexture });
      const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
      sceneRef.current.add(bgMesh);

      // WebM Video Texture (Using Blob directly)
      if (videoFile) {
        const videoUrl = URL.createObjectURL(videoFile); // Blob -> URL 변환
        const video = document.createElement('video');
        video.src = videoUrl;
        video.crossOrigin = 'anonymous';
        video.loop = true; // Loop the video
        video.muted = true; // Mute the video if necessary
        video.play(); // Auto-play the video

        video.addEventListener('canplay', () => {
          // Only after video is ready, apply it as a texture
          videoTextureRef.current = new THREE.VideoTexture(video);
          videoTextureRef.current.minFilter = THREE.LinearFilter;
          videoTextureRef.current.magFilter = THREE.LinearFilter;
          videoTextureRef.current.format = THREE.RGBAFormat;

          videoTextureRef.current.needsUpdate = true;
          videoTextureRef.current.flipY = true;

          const videoGeometry = new THREE.PlaneGeometry(116, 150);
          const videoMaterial = new THREE.MeshBasicMaterial({ map: videoTextureRef.current, transparent: true });
          const videoMesh = new THREE.Mesh(videoGeometry, videoMaterial);
          videoMesh.position.set(0, -10, 0.1);
          sceneRef.current.add(videoMesh);
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
        ctx.fillStyle = 'black';
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
  }, [postcard, videoFile]);

  const startRecording = () => {
    const stream = canvasRef.current.captureStream(30);
    const recorder = new RecordRTC(stream, {
      type: 'video',
      mimeType: 'video/mp4',
      bitsPerSecond: 8000000
    });

    recorder.startRecording();
    recorderRef.current = recorder;

    setTimeout(() => stopRecording(), 10000);  // 10 seconds recording
  };

  const [recordedBlob, setRecordedBlob] = useState(null);

  const stopRecording = () => {
    if (recorderRef.current) {
      recorderRef.current.stopRecording(() => {
        const blob = recorderRef.current.getBlob();
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
        setRecordedBlob(blob); // Store the actual blob
      });
    }
  };

  const downloadVideo = () => {
    if (blobUrl) {
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = blobUrl;
      a.download = 'postcard-video.mp4';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);  // Clean up the object URL
      }, 100);
    }
  };

  const shareVideo = async () => {
    if (navigator.canShare && recordedBlob) {
      const file = new File([recordedBlob], 'postcard-video.mp4', { type: 'video/mp4' });

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

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Header title={`'${postcard?.name}'의 춤사위`} />
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
        <button onClick={startRecording} style={{ marginRight: '10px' }}>
          Start Recording
        </button>
        <button onClick={downloadVideo} style={{ marginRight: '10px' }} disabled={!blobUrl}>
          Download Video
        </button>
        <button onClick={shareVideo} disabled={!blobUrl}>
          Share Video
        </button>
      </div>

    </div>
  );
};

export default PostcardView;
