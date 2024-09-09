import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const VideoRecorder = () => {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());
  const modelsRef = useRef([]);
  const [videoBlob, setVideoBlob] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    // Three.js 초기화 코드
    const initThreeJS = () => {
      sceneRef.current = new THREE.Scene();
      cameraRef.current = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
      rendererRef.current = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true });
      rendererRef.current.setSize(400, 400);

      // 조명 설정
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      sceneRef.current.add(ambientLight);
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(2, 2, 2);
      sceneRef.current.add(directionalLight);

      cameraRef.current.position.z = 5;
    };

    initThreeJS();
    loadModel('/path/to/your/model.glb');

    const animate = () => {
      requestAnimationFrame(animate);
      const delta = clockRef.current.getDelta();
      modelsRef.current.forEach(({ mixer }) => mixer.update(delta));
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };

    animate();
  }, []);

  const loadModel = (modelPath) => {
    const loader = new GLTFLoader();
    loader.load(
      modelPath,
      (gltf) => {
        const model = gltf.scene;
        sceneRef.current.add(model);
        const mixer = new THREE.AnimationMixer(model);
        if (gltf.animations.length > 0) {
          const action = mixer.clipAction(gltf.animations[0]);
          action.play();
        }
        modelsRef.current.push({ model, mixer });
      },
      undefined,
      (error) => console.error('Error loading GLB file:', error)
    );
  };

  const startRecording = async () => {
    const stream = canvasRef.current.captureStream(30); // 30 FPS
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    const chunks = [];

    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      setVideoBlob(blob);
    };

    setIsRecording(true);
    mediaRecorder.start();

    // 3초 후 녹화 중지
    setTimeout(() => {
      mediaRecorder.stop();
      setIsRecording(false);
    }, 3000);
  };

  const shareVideo = async () => {
    if (!videoBlob) return;

    const file = new File([videoBlob], 'animation.webm', { type: 'video/webm' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'My Animation',
          text: 'Check out this animation I created!',
        });
        console.log('Video shared successfully!');
      } catch (error) {
        console.error('Error sharing video:', error);
        // 공유 실패 시 다운로드로 대체
        downloadVideo();
      }
    } else {
      // 공유 API를 지원하지 않는 경우 다운로드
      downloadVideo();
    }
  };

  const downloadVideo = () => {
    const url = URL.createObjectURL(videoBlob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'animation.webm';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div>
      <canvas ref={canvasRef} style={{ width: '400px', height: '400px' }} />
      <button onClick={startRecording} disabled={isRecording}>
        {isRecording ? 'Recording...' : 'Start Recording'}
      </button>
      <button onClick={shareVideo} disabled={!videoBlob}>
        Share Video
      </button>
    </div>
  );
};

export default VideoRecorder;