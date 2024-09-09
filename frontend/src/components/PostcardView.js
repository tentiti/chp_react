import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import RecordRTC from 'recordrtc';
import SuperGif from 'libgif';


const PostcardView = () => {
  const { id } = useParams();
  const [postcard, setPostcard] = useState(null);
  const [blobUrl, setBlobUrl] = useState(null); // State for storing the blob URL
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const recorderRef = useRef(null);
  const gifTextureRef = useRef(null);

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
      const { width, height } = updateCanvasSize(); // Updated canvas size

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
      const bgTexture = await loader.loadAsync(`/static/stockimages/bg${postcard.number + 1}.png`);
      const bgGeometry = new THREE.PlaneGeometry(width, height);
      const bgMaterial = new THREE.MeshBasicMaterial({ map: bgTexture });
      const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
      sceneRef.current.add(bgMesh);

      // GIF
      if (postcard.gif_name) {
        const gifUrl = `https://localhost:8000/uploads/${postcard.gif_name}`;
        const gifFrames = await loadGif(gifUrl);
        gifTextureRef.current = new THREE.DataTexture(
          gifFrames[0].data,
          gifFrames[0].width,
          gifFrames[0].height,
          THREE.RGBAFormat
        );
        gifTextureRef.current.flipY = true; // Fix upside-down issue
        gifTextureRef.current.needsUpdate = true;

        const gifGeometry = new THREE.PlaneGeometry(116, 150);
        const gifMaterial = new THREE.MeshBasicMaterial({ map: gifTextureRef.current, transparent: true });
        const gifMesh = new THREE.Mesh(gifGeometry, gifMaterial);
        gifMesh.position.set(0, -10, 0.1);  // Adjust position as needed
        sceneRef.current.add(gifMesh);

        // Animate GIF
        let frameIndex = 0;
        let lastFrameTime = performance.now();
        let accumulatedTime = 0;  // 누적된 시간을 저장
        
        const animateGif = () => {
          const currentTime = performance.now();
          const elapsedTime = currentTime - lastFrameTime;
          lastFrameTime = currentTime;  // 마지막 프레임 시간 업데이트
          accumulatedTime += elapsedTime;  // 누적 시간을 증가
        
          const currentFrame = gifFrames[frameIndex];
          const delayInMilliseconds = currentFrame.delay * 100;  // 센티초를 밀리초로 변환
        
          // 누적 시간이 현재 프레임의 지연 시간을 초과하면 프레임 전환
          while (accumulatedTime >= delayInMilliseconds) {
            frameIndex = (frameIndex + 1) % gifFrames.length;
            gifTextureRef.current.image.data = gifFrames[frameIndex].data;
            gifTextureRef.current.needsUpdate = true;
            
            accumulatedTime -= delayInMilliseconds;  // 초과된 시간을 차감
          }
        
          // 다음 프레임을 요청
          requestAnimationFrame(animateGif);
        };
        
        // Start GIF animation
        animateGif();
        
        
        // Start GIF animation
        animateGif();
        
      }

      // Text
      const addText = (text, y, size = 20) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = width;
        canvas.height = 200;
        ctx.font = `${size}px Cafe24Simplehae, sans-serif`;
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.fillText(text, canvas.width / 2, 100);
        
        const texture = new THREE.CanvasTexture(canvas);
        const geometry = new THREE.PlaneGeometry(width, 200);
        const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, y, 0.2);
        sceneRef.current.add(mesh);
      };

      addText(`내용: ${postcard.comment}`, 400);
      addText(postcard.timestamp, 300);
      addText(`이름: ${postcard.name}`, 200);
    };

    initThreeJS();

    const animate = () => {
      requestAnimationFrame(animate);
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };
    animate();

    window.addEventListener('resize', () => {
      const { width, height } = updateCanvasSize();

    });
  }, [postcard]);

  const loadGif = (url) => {
    return new Promise((resolve) => {
      const img = document.createElement('img');
      img.src = url;
  
      // 이미지 숨기기
      img.style.display = 'none';
      document.body.appendChild(img); // Append img to the DOM temporarily
  
      const superGif = new SuperGif({
        gif: img,
        draw_while_loading: false,  // 로딩 중 그리지 않음
        auto_play: false,           // 자동 재생 비활성화
      });
      superGif.load(() => {
        const frames = [];
        for (let i = 0; i < superGif.get_length(); i++) {
          superGif.move_to(i);
          const canvas = superGif.get_canvas();
  
          // 내부 캔버스 숨기기
          canvas.style.display = 'none';
  
          const ctx = canvas.getContext('2d');
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
          frames.push({
            data: new Uint8Array(imageData.data.buffer),
            width: canvas.width,
            height: canvas.height,
            delay: 100// Default 100ms delay for each frame
          });
        }
  
        // 이미지와 내부 캔버스를 DOM에서 제거
        // document.body.removeChild(img);
  
        resolve(frames);
      });
    });
  };
  
  

  const startRecording = () => {
    const stream = canvasRef.current.captureStream(30);
    const recorder = new RecordRTC(stream, {
      type: 'video',
      mimeType: 'video/mp4',
      bitsPerSecond: 8000000
    });

    recorder.startRecording();
    recorderRef.current = recorder;

    setTimeout(() => stopRecording(), 10000);  // 3 seconds recording
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
    <div>
      <canvas
  ref={canvasRef}
  style={{
    position: 'absolute',   // 캔버스를 절대 위치로 설정
    top: '120px',            // 상단에서 58px 만큼 띄움
    left: '0',              // 화면 왼쪽에 맞춤
    width: '100vw',         // 화면 너비를 100% 사용
    height: 'calc(100vw * (16 / 9))',  // 9:16 비율을 유지하면서 높이를 설정
    overflow: 'hidden'      // 넘침을 방지
  }}
/>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
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
