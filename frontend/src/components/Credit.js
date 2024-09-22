import React, { useRef, useEffect, useState, useCallback } from 'react';
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

  //타이밍 관련
  const [isReadyToRecord, setIsReadyToRecord] = useState(false);

  // Clock 생성
  const clock = new THREE.Clock();
  const resetAndPlayAnimations = () => {
    const models = sceneData.mixer.current;  // modelsRef.current를 가져옴
  
    if (!models || models.length === 0) {
      console.error("No models found");
      return;
    }
  
    models.forEach((modelData, index) => {
      console.log(`Processing model ${index}:`, modelData);
  
      const { mixer, action } = modelData;
  
      if (mixer && action) {
        action.reset();  // 애니메이션을 처음으로 리셋
        action.play();   // 애니메이션을 재시작
      } else {
        console.warn(`No mixer or action found for model ${index}`);
      }
    });
  };
  
  

  useEffect(() => {
    if (sceneData.mixer[0]) {
      resetAndPlayAnimations();
    }
  }, [sceneData.mixer, resetAndPlayAnimations]);

  const startRecording = () => {
    if (isRecording || !isReadyToRecord) return;  // 이미 녹화 중인 경우
  
    // alert('startRecording');
    setIsRecording(true); // 녹화 상태 설정
  
    // if (!audioRef.current || audioRef.current.readyState !== 4) return;
  
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      audioSourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
    }

    const destination = audioContextRef.current.createMediaStreamDestination();
    audioSourceRef.current.connect(destination);
    audioSourceRef.current.connect(audioContextRef.current.destination);
  
    const canvasElement = rendererRef.current.domElement;
    if (!canvasElement.captureStream) {
      console.warn('captureStream is not supported in this browser.');
      return;
    }
  
    const canvasStream = canvasElement.captureStream(24);
    const combinedStream = new MediaStream([...canvasStream.getTracks(), ...destination.stream.getTracks()]);
  
    const recorder = new RecordRTC(combinedStream, {
      type: 'video',
      mimeType: 'video/mp4',
      bitsPerSecond: 4000000,
      video: {
        codec: 'H264',  
        width: 1920, // 해상도 설정 가능
        height: 1080,
        frameRate: 30 // iPhone에서 호환되는 프레임 레이트
      },
    });


    audioRef.current.play();

    resetAndPlayAnimations();  // 애니메이션을 리셋하고 재생

    recorder.startRecording();
    recorderRef.current = recorder;
  
    setTimeout(() => {
      // alert('Attempting to stop recording');
      stopRecording();
    }, 18750);  // 3.75초 후 녹화 종료 시도
  };
  
  const stopRecording = () => {
    if (!recorderRef.current) {
      console.warn('Recorder reference is not set');
      return;
    }
  
    // Stop recording and create a blob in the desired format
    recorderRef.current.stopRecording(() => {
      const blob = recorderRef.current.getBlob();
      const mp4Blob = new Blob([blob], { type: 'video/mp4' }); // Explicitly force it as mp4
      const url = URL.createObjectURL(mp4Blob);
      setBlobUrl(url);
      setIsRecording(false); // 녹화 상태 해제
      setIsRecordingDone(true); // 녹화 완료 상태 설정
    });
  };

    // 녹화 종료 후 애니메이션 반복 재생 설정
    useEffect(() => {
      if (isRecordingDone) {
        resetAndPlayAnimations();  // 녹화가 끝난 즉시 애니메이션 재생
  
        const animationInterval = setInterval(() => {
          resetAndPlayAnimations();  // 18.75초마다 애니메이션 재실행
        }, 18750);
  
        return () => clearInterval(animationInterval);  // 컴포넌트 언마운트 시 인터벌 정리
      }
    }, [isRecordingDone]);
  

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

  // Function to share video using Web Share API
  const shareVideo = async () => {
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText('hello world!');
        console.log('Text copied to clipboard');
      } catch (error) {
        console.error('Failed to copy text:', error);
      }
    }

    if (navigator.canShare && blobUrl) {
      const response = await fetch(blobUrl);
      const blob = await response.blob();
      const file = new File([blob], `${postcard?.name}의 춤사위.mp4`, { type: 'video/mp4' }); // Explicitly force .mp4

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

      // sceneRef.current = new THREE.Scene();
      sceneRef.current = sceneData.scene;

      // // 장면에서 모든 모델을 찾습니다
      // const models = sceneRef.current.children.filter(child => child.type === "Group" || child.type === "Mesh");
  
      // // 첫 번째 모델을 제외한 나머지를 모두 제거합니다
      // for (let i = 0; i < models.length; i++) {
      //   sceneRef.current.remove(models[i]);
      // }
    

      sceneRef.current.add(sceneData.mixer);  // SceneContext에서 가져온 모델 추가
  

      const width = 1080;
      const height = 1920;

      rendererRef.current = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true, antialias: false,  powerPreference: "high-performance"  });
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

      //배경 넣기
      const loader = new THREE.TextureLoader();
      loader.load(`/static/stockimages/postcardfinal_${postcard?.number}.png`, (bgTexture) => {
        bgTexture.colorSpace = THREE.SRGBColorSpace;
        bgTexture.anisotropy = rendererRef.current.capabilities.getMaxAnisotropy();
        bgTexture.minFilter = THREE.LinearFilter;
        bgTexture.magFilter = THREE.LinearFilter;


        const bgMaterial = new THREE.MeshBasicMaterial({ map: bgTexture });
        const bgMesh = new THREE.Mesh(new THREE.PlaneGeometry(frustumSize * (720 / 1280), frustumSize), bgMaterial);
        bgMesh.material.depthTest = false;
        bgMesh.material.depthWrite = false;
        bgMesh.renderOrder = -1; // 낮은 값일수록 먼저 렌더링됨

        bgMesh.position.z = -1;
        sceneRef.current.add(bgMesh);
      });

      const addText = (text, x, y, size = 50, breakLine=false) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = 8192;
        canvas.height = 4096;
      
        const fontSize = size * 3;
        ctx.font = `bold ${fontSize}px Cafe24Simplehae`;
        ctx.fillStyle = 'rgba(65, 40, 35, 1)'; // 밝은 노란색으로 변경
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
      
        const maxLineLength = 38; // 줄 길이를 줄여 더 많은 줄 바꿈 유도
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
      
        words.forEach(word => {
          if ((currentLine + word).length <= maxLineLength) {
            currentLine += (currentLine ? ' ' : '') + word;
          } else {
            lines.push(currentLine);
            currentLine = word;
          }
        });
        lines.push(currentLine); // 마지막 줄 추가
      
        const lineHeight = fontSize * 2.2;
        const totalTextHeight = lines.length * lineHeight;
        const centerY = canvas.height / 2;
      
        // ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
      
        lines.forEach((line, index) => {
          const yPos = centerY - (totalTextHeight / 2) + index * (lineHeight-1);
          ctx.fillText(line, canvas.width / 2, yPos);
        });
      
        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.format = THREE.RGBAFormat;
      
        const aspectRatio = canvas.width / canvas.height;
        const geometry = new THREE.PlaneGeometry(10 * aspectRatio, 10); // 크기를 더 작게 조정
        const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(geometry, material);
      
        mesh.position.set(x, y, 1);
        sceneRef.current.add(mesh);

        console.log(text);
        
        return mesh;
      };
      
      // Add texts
      const commentMesh = addText(postcard.comment, 0, -12.2, 94, true);
      const timestampMesh = addText(postcard.timestamp, 0, -14.2, 60);
      const nameMesh = addText(postcard.name, 5., -15.8, 80);

      setTextMeshes([commentMesh, timestampMesh, nameMesh]);

      const animate = () => {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();

        const firstMixer = sceneData.mixer[0];  // 첫 번째 믹서를 선택

        if (firstMixer) {
          firstMixer.update(delta);  // SceneContext에서 가져온 mixer를 사용하여 애니메이션 업데이트
        }
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
      // setTimeout(startRecording, 1000); //1초간 녹화
    }
  }, [postcard]);

  useEffect(() => {
    const handleUnload = () => {

      textMeshes.forEach((mesh) => {
        if (mesh) {
          if (mesh.geometry) mesh.geometry.dispose();
          if (mesh.material && mesh.material.map) mesh.material.map.dispose();
          if (mesh.material) mesh.material.dispose();
          if (mesh.parent) mesh.parent.remove(mesh);
        }
      });
  
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
  
      if (sceneRef.current) {
        sceneRef.current.clear();
      }
  
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
  
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  
    window.addEventListener('beforeunload', handleUnload);
  
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [textMeshes, blobUrl]);

  useEffect(() => {
    if (isReadyToRecord) {
      startRecording();
    }
  }, [isReadyToRecord]);

  useEffect(() => {
    if (isRecordingDone) {
      const animationInterval = setInterval(() => {
        resetAndPlayAnimations();
      }, 8750); //8.75초 이따 개선해야함

      return () => clearInterval(animationInterval);
    }
  }, [isRecordingDone, resetAndPlayAnimations]);

  if (!postcard) return <div>Loading...</div>;

  const containerStyle = {
    position: 'absolute',
    top: '58px',
    left: 0,
    position: 'relative',
    width: '100%',
    aspectRatio: '9 / 16',
    maxHeight: 'calc(100vh - 178px)',
    overflow: 'hidden',
  };

  const canvasStyle = {
    position: 'fixed',
    top: '18px',
    left: 0,
    width: '100%',
    height: '100%',
    transform: `scale(${containerRef.current ? containerRef.current.clientWidth / 1080 : 1}, ${containerRef.current ? containerRef.current.clientHeight / 1920 : 1})`,
    transformOrigin: 'top left',
  };

  const recordReady = () => {
    audioRef.current.load();
    audioRef.current.oncanplaythrough = () => {
      setIsReadyToRecord(true);
    };
    // audioRef.current.play();
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
        <button className="upbutton" onClick={recordReady}>
          녹화하기
        </button>
        <button className="upbutton" onClick={downloadVideo} disabled={!blobUrl}>
          {!isRecordingDone ? '공유 영상 준비 중...' : '영상 저장하기'}
        </button>
        <button className="upbutton" onClick={shareVideo} disabled={!blobUrl}>
          {!isRecordingDone ? '공유 영상 준비 중...' : '영상 공유하기'}
        </button>
        {/* <button className="upbutton" onClick={resetAndPlayAnimations}>
          애니메이션 재시작
        </button> */}



      </div>
    </div>
  );
};

export default  React.memo(Credit);