import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import RecordRTC from 'recordrtc';
import Invitation from './Invitation';
import { useScene } from './SceneContext';
import './PostcardView.css';

const Credit = () => {
  const audioContextRef = useRef(null);
  const audioSourceRef = useRef(null);
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const recorderRef = useRef(null);
  const containerRef = useRef(null);

  const [isInvitationVisible, setIsInvitationVisible] = useState(false);
  const [postcard, setPostcard] = useState(null);
  const [blobUrl, setBlobUrl] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  const { sceneData } = useScene();
  const { id } = useParams();

  const handleMenuClick = () => setIsInvitationVisible(true);
  const handleBackClick = () => setIsInvitationVisible(false);

  const startRecording = () => {
    if (isRecording) return;

    setIsRecording(true);
    if (!audioRef.current || audioRef.current.readyState !== 4) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      audioSourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
    }

    const destination = audioContextRef.current.createMediaStreamDestination();
    audioSourceRef.current.connect(destination);
    audioSourceRef.current.connect(audioContextRef.current.destination);

    const canvasElement = rendererRef.current.domElement;
    const canvasStream = canvasElement.captureStream(24);
    const combinedStream = new MediaStream([...canvasStream.getTracks(), ...destination.stream.getTracks()]);

    const recorder = new RecordRTC(combinedStream, {
      type: 'video',
      mimeType: 'video/mp4',
      bitsPerSecond: 8000000,
      video: {
        width: 1080,
        height: 1920,
      },
    });

    recorder.startRecording();
    recorderRef.current = recorder;

    setTimeout(stopRecording, 5000);
  };

  const stopRecording = () => {
    if (recorderRef.current) {
      recorderRef.current.stopRecording(() => {
        const blob = recorderRef.current.getBlob();
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
        setIsRecording(false);

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
    if (navigator.canShare && blobUrl) {
      const response = await fetch(blobUrl);
      const blob = await response.blob();
      const file = new File([blob], `${postcard?.name}의 춤사위.mp4`, { type: 'video/mp4' });

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

  useEffect(() => {
    const fetchPostcard = async () => {
      try {
        const response = await axios.get(`/api/postcard/${id}`, { cache: 'no-cache' });
        if (response.status === 200) {
          setPostcard(response.data);
        }
      } catch (error) {
        console.error('Error fetching postcard:', error);
      }
    };
    fetchPostcard();
  }, [id]);

  useEffect(() => {
    const initThreeJS = async () => {
      if (!sceneData.scene || !canvasRef.current) return;

      sceneRef.current = sceneData.scene;

      const pixelRatio = window.devicePixelRatio || 1;
      const width = 1080 * pixelRatio; // 실제 렌더링 해상도
      const height = 1920 * pixelRatio;

      rendererRef.current = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true, antialias: true });
      rendererRef.current.setSize(width, height);
      rendererRef.current.setClearColor(0x000000, 0);

      const frustumSize = 40;
      cameraRef.current = new THREE.OrthographicCamera(
        (frustumSize * 1080) / 1920 / -2,
        (frustumSize * 1080) / 1920 / 2,
        frustumSize / 2,
        frustumSize / -2,
        0.1,
        1000
      );
      cameraRef.current.position.set(0, 0, 5);
      cameraRef.current.lookAt(0, 0, 0);

      const loader = new THREE.TextureLoader();
      loader.load(`/static/stockimages/postcardfinal_${postcard?.number}.png`, (bgTexture) => {
        bgTexture.colorSpace = THREE.SRGBColorSpace;
        bgTexture.anisotropy = rendererRef.current.capabilities.getMaxAnisotropy();
        bgTexture.minFilter = THREE.LinearFilter;
        bgTexture.magFilter = THREE.LinearFilter;

        const bgMaterial = new THREE.MeshBasicMaterial({ map: bgTexture });
        const bgMesh = new THREE.Mesh(new THREE.PlaneGeometry(frustumSize * (1080 / 1920), frustumSize), bgMaterial);
        bgMesh.position.z = -3;
        sceneRef.current.add(bgMesh);
      });

      const animate = () => {
        requestAnimationFrame(animate);
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      };
      animate();
    };
    initThreeJS();
  }, [sceneData, postcard]);

  useEffect(() => {
    if (postcard) {
      setTimeout(startRecording, 1000);
    }
  }, [postcard]);

  if (!postcard) return <div>Loading...</div>;

  // 부모 div의 크기 및 스케일 동적 계산
  const containerStyle = {
    position: 'relative',
    width: '100%',
    aspectRatio: '9 / 16',
    maxHeight: 'calc(100vh - 178px)',
    overflow: 'hidden',
  };

  // 캔버스의 크기 및 스케일 동적 계산
  const canvasStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    transform: `scale(${containerRef.current ? containerRef.current.clientWidth / 1080 : 1}, ${containerRef.current ? containerRef.current.clientHeight / 1920 : 1})`,
    transformOrigin: 'top left',
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {isInvitationVisible && <Invitation onBack={handleBackClick} />}
      <audio ref={audioRef} src="/static/test.mp3" loop></audio>
      <div ref={containerRef} style={containerStyle}>
        <img
          src={`/static/stockimages/postcardfinal_${postcard?.number}.png`}
          alt="Background"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'none' }}
        />
        <canvas ref={canvasRef} style={canvasStyle} />
      </div>
      <button onClick={downloadVideo}>영상 저장하기</button>
      <button onClick={shareVideo}>영상 공유하기</button>
    </div>
  );
};

export default Credit;
