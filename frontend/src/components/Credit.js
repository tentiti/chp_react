import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useParams, useNavigate } from 'react-router-dom';
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

  const [blobUrl, setBlobUrl] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingDone, setIsRecordingDone] = useState(false);
  const [textMeshes, setTextMeshes] = useState([]);

  const navigate = useNavigate();
  const { id } = useParams();
  const [postcard, setPostcard] = useState(null);
  const { sceneData } = useScene();

  const [isInvitationVisible, setIsInvitationVisible] = useState(false);
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
    // audioRef.current.play();

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
    });

    recorder.startRecording();
    recorderRef.current = recorder;

    setTimeout(stopRecording, 8750);
  };

  const stopRecording = () => {
    if (recorderRef.current) {
      recorderRef.current.stopRecording(() => {
        const blob = recorderRef.current.getBlob();
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
        setIsRecording(false);
        setIsRecordingDone(true);
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
      if (!sceneData.scene || !canvasRef.current || !postcard) return;

      sceneRef.current = sceneData.scene;

      const width = 720;
      const height = 1280;

      rendererRef.current = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true, antialias: true });
      rendererRef.current.setSize(width, height);
      rendererRef.current.setClearColor(0x000000, 0);

      const frustumSize = 40;
      cameraRef.current = new THREE.OrthographicCamera(
        (frustumSize * 720) / 1280 / -2,
        (frustumSize * 720) / 1280 / 2,
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
        const bgMesh = new THREE.Mesh(new THREE.PlaneGeometry(frustumSize * (720 / 1280), frustumSize), bgMaterial);
        bgMesh.position.z = -0.2;
        // sceneRef.current.add(bgMesh);
      });

      const addText = (text, x, y, size = 50) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
      
        canvas.width = 2048;
        canvas.height = 2048;
        const fontSize = size * 1;
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
        const totalTextHeight = lines.length * lineHeight;
      
        lines.forEach((line, index) => {
          const adjustedYPos = canvas.height / 2 - totalTextHeight / 2 + index * lineHeight - 30;
          ctx.fillText(line, canvas.width / 2, adjustedYPos);
        });
      
        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.format = THREE.RGBAFormat;
      
        const aspectRatio = canvas.width / canvas.height;
        const geometry = new THREE.PlaneGeometry(600 * aspectRatio, 600);
        const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
        const mesh = new THREE.Mesh(geometry, material);
      
        mesh.position.set(x, y, 0.1);
        sceneRef.current.add(mesh);
        return mesh;
      };

      // Add texts
      const commentMesh = addText(postcard.comment, 0, -165, 12);
      const timestampMesh = addText(new Date(postcard.timestamp).toLocaleString(), 0, -210, 8);
      const nameMesh = addText(postcard.name, 106, -236, 12);

      setTextMeshes([commentMesh, timestampMesh, nameMesh]);

      const animate = () => {
        requestAnimationFrame(animate);
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      };
      animate();
    };

    initThreeJS();

    return () => {
      // Clean up text meshes
      textMeshes.forEach(mesh => {
        if (mesh && mesh.geometry) mesh.geometry.dispose();
        if (mesh && mesh.material) mesh.material.dispose();
        if (mesh && mesh.parent) mesh.parent.remove(mesh);
      });
    };
  }, [sceneData, postcard]);

  useEffect(() => {
    if (postcard) {
      setTimeout(startRecording, 1000);
    }
  }, [postcard]);

  if (!postcard) return <div>Loading...</div>;

  const containerStyle = {
    position: 'relative',
    width: '100%',
    aspectRatio: '9 / 16',
    maxHeight: 'calc(100vh - 178px)',
    overflow: 'hidden',
  };

  const canvasStyle = {
    position: 'absolute',
    top: '10px',
    left: 0,
    width: '100%',
    height: '100%',
    transform: `scale(${containerRef.current ? containerRef.current.clientWidth / 720 : 1}, ${containerRef.current ? containerRef.current.clientHeight / 1280 : 1})`,
    transformOrigin: 'top left',
  };

  return (
    <div style={{ 
      backgroundImage: `url('/static/stockimages/background_paper.png')`, 
      width: '100vw', 
      height: '100vh', 
      zIndex: '900',
      overflow: 'hidden' 
      }}>
      {isInvitationVisible && <Invitation onBack={handleBackClick} />}

      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
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

      <audio ref={audioRef} src="/static/test.mp3" loop></audio>

      <div ref={containerRef} style={containerStyle}>
        <img
          src={`/static/stockimages/postcardfinal_${postcard?.number}.png`}
          alt="Background"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'none' }}
        />
        <canvas ref={canvasRef} style={canvasStyle} />
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
          backgroundColor: '#F8F6F1',
          borderTop: '1px solid #E6E1DC',
          zIndex: '1100',
          gap: '20px',
          padding: '0 10px',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        <button className="upbutton" onClick={downloadVideo} disabled={!blobUrl}>
          {!isRecordingDone ? '공유 영상 준비 중...' : '영상 저장하기'}
        </button>
        <button className="upbutton" onClick={shareVideo} disabled={!blobUrl}>
          {!isRecordingDone ? '공유 영상 준비 중...' : '영상 공유하기'}
        </button>
      </div>
    </div>
  );
};

export default Credit;