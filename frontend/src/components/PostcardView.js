import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import RecordRTC from 'recordrtc';
import { useVideo } from './VideoContext';

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
      const bgTexture = await loader.loadAsync(`/static/stockimages/bg${postcard.number}.png`);
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
