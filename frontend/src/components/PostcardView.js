import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import RecordRTC from 'recordrtc';
import Credit from './Credit';
import { useScene } from './SceneContext';
import './PostcardView.css';
import Invitation from './Invitation';


const PostcardView = ({isFixedSize}) => {
  const audioContextRef = useRef(null);
  const audioSourceRef = useRef(null);
  const audioRef = useRef(null);
  const [isFallbackVisible, setIsFallbackVisible] = useState(false);  // Track fallback visibility

  const [audioContext, setAudioContext] = useState(null);
  const [audioSource, setAudioSource] = useState(null);

  const [hasShared, setHasShared] = useState(false);

  useEffect(() => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    setAudioContext(ctx);

    return () => {
      if (ctx && ctx.state !== 'closed') {
        ctx.close();
      }
    };
  }, []);

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

  const [isReadyToRecord, setIsReadyToRecord] = useState(false);

  const [isFrameVisible, setIsFrameVisible] = useState(true);

  const [isLoading, setIsLoading] = useState(true); // 배경 이미지 로딩 상태를 관리

  const clock = new THREE.Clock();

  const resetAndPlayAnimations = () => {
    if (sceneData.mixer.current){
      sceneData.mixer.current.forEach((modelData) => {
        const { model, mixer, action, categoryName } = modelData;
        action.reset();  
        action.stop();
        action.play();  
      });
    }
  };

  const startRecording = () => {
    if (isRecording || !isReadyToRecord) return;

    setIsRecording(true); 

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      audioSourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
    }

    const destination = audioContextRef.current.createMediaStreamDestination();
    audioSourceRef.current.connect(destination);
    audioSourceRef.current.connect(audioContextRef.current.destination);

    resetAndPlayAnimations();  

    const canvasElement = rendererRef.current.domElement;
    if (!canvasElement.captureStream) {
      console.warn('captureStream is not supported in this browser.');
      return;
    }

    const canvasStream = canvasElement.captureStream(30);
    const combinedStream = new MediaStream([...canvasStream.getTracks(), ...destination.stream.getTracks()]);

    const recorder = new RecordRTC(combinedStream, {
      type: 'video',
      mimeType: 'video/mp4',
      bitsPerSecond: 1500000,
      video: {
        codec: 'H264',  
        width: 1280, 
        height: 720,
        frameRate: 30 
      },
      audioBitsPerSecond: 128000,  // 오디오 비트레이트를 510kbps로 설정
    });

    audioRef.current.play();

    recorder.startRecording();
    recorderRef.current = recorder;

    setTimeout(() => {
      stopRecording();
    }, 18750);  
  };
  
  const stopRecording = () => {
    if (!recorderRef.current) {
      console.warn('Recorder reference is not set');
      return;
    }
  
    recorderRef.current.stopRecording(() => {
      const blob = recorderRef.current.getBlob();
  
      // MP4 Blob 생성
      const mp4Blob = new Blob([blob], { type: 'video/mp4' });
  
      // File 객체로 변환
      const file = new File([mp4Blob], `dance.mp4`, { 
        type: 'video/mp4',
        lastModified: new Date().getTime()
      });
  
      const url = URL.createObjectURL(file); // Blob URL 생성
      setBlobUrl(url); // Blob URL 설정
      setIsRecording(false);
      setIsRecordingDone(true);
    });
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
    if (hasShared || !blobUrl) return; // 이미 공유되었거나 Blob URL이 없으면 중단
    setHasShared(true);
  
    try {
      // 클립보드에 해시태그 복사
      if (navigator.clipboard) {
        await navigator.clipboard.writeText('@k.imhwasoon @kkot.pida.gallery');
        console.log('Text copied to clipboard');
      }
  
      alert('해시태그가 복사되었습니다. 인스타그램 공유 (불가시 저장 후 수동 공유)시 텍스트를 붙여 넣어 주세요!');
  
      // Blob URL을 사용하여 파일 공유
      if (!navigator.canShare || !blobUrl) {
        throw new Error('Sharing not supported or no video recorded');
      }
  
      // blobUrl을 통해 Blob 가져오기
      const response = await fetch(blobUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch the blob from URL: ${blobUrl}`);
      }
      
      const blob = await response.blob();
  
      // Blob을 File로 변환
      const file = new File([blob], `${postcard?.name}의 춤사위.mp4`, { type: 'video/mp4' });
      console.log(file)

      // 파일을 공유할 수 있는지 확인한 후 공유
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          // title: 'Postcard Video',
          files: [file],
        });
        console.log('Video shared successfully');
      } else {
        console.error('Sharing not supported on this device for files');
      }

    } catch (error) {
      console.error('Error sharing video:', error);
    } finally {
      // 에러 발생 여부에 관계없이 공유 상태 초기화
      setHasShared(false);
    }
  };
  
  

  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (!isRecording) {
        setIsFallbackVisible(true); 
      }
    }, 5000); 

    return () => clearTimeout(fallbackTimer); 
  }, [isRecording]);

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

  const preloadImage = (src, callback) => {
    const img = new Image();
    img.src = src;
    img.onload = callback; // 이미지가 로드된 후 callback 호출
    img.onerror = (error) => {
      console.error('Error loading image:', error);
      callback(); // 에러 발생 시에도 callback 호출하여 진행
    };
  };

  // 배경 이미지를 먼저 로드하고, 로드 완료 후 Three.js를 초기화
  useEffect(() => {
    if (!postcard) return;

    const imageUrl = `/static/stockimages/postcardfinal_${postcard?.number}.png`;

    // 이미지 프리로딩
    preloadImage(imageUrl, () => {
      setIsLoading(false); // 이미지 로드 완료 후 로딩 상태 해제
      initThreeJS(imageUrl); // Three.js 초기화
    });
  }, [postcard]);

  const moveAndScaleModels = (xOffset = 0, yOffset = 0, zOffset = 0, scaleFactor = 1) => {
    if (!sceneRef.current) return;

    sceneRef.current.children.forEach((object) => {
      if ((object.isMesh || object.isGroup) && !object.name.startsWith('text_')) {
        object.position.x = xOffset;
        object.position.y = yOffset;
        object.position.z = zOffset;
        object.scale.set(
          object.scale.x = scaleFactor,
          object.scale.y = scaleFactor,
          object.scale.z = scaleFactor
        );
      }
    });
  };

  const initThreeJS = async () => {
    if (!sceneData.mixer || !postcard) return <div>필요한 정보 로딩중...</div>;  

    sceneRef.current = new THREE.Scene();

    const ambientLight1 = new THREE.AmbientLight(0xffffff, 1.0);
    sceneRef.current.add(ambientLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight2.position.set(2, 2, 2);
    sceneRef.current.add(directionalLight2);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    sceneRef.current.add(ambientLight);

    const addedCategories = new Set();

    if (Array.isArray(sceneData.mixer.current) && sceneData.mixer.current.length > 0) {
      sceneData.mixer.current.forEach((modelData) => {
        const { model, mixer, action, categoryName } = modelData;

        if (!addedCategories.has(categoryName)) {
          if (model instanceof THREE.Object3D) {
            if (!model.name) {
              model.name = `model_${categoryName}`;
            }

            model.traverse((child) => {
              if (child.isMesh) {
                if (child.material.map) {
                  child.material.needsUpdate = true;
                }
              }
            });

            sceneRef.current.add(model);
            console.log(`Added model: ${model.name}`);
          }

          if (mixer && action) {
            action.reset();
            action.stop();
          }

          addedCategories.add(categoryName);
        }
      });
    } else {
      console.warn('sceneData.mixer is not an array or it is empty');
    }

    const width = 720;
    const height = 1280;

    rendererRef.current = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current, 
      alpha: true, 
      antialias: true,  
      powerPreference: "high-performance",
      preserveDrawingBuffer: true,
    });

    rendererRef.current.setSize(width, height);
    rendererRef.current.setClearColor(0x000000, 0);
    rendererRef.current.autoClear = true;
    rendererRef.current.outputColorSpace = THREE.SRGBColorSpace;

    const frustumSize = 40;
    cameraRef.current = new THREE.OrthographicCamera(
      (frustumSize * 720) / 1280 / -2,
      (frustumSize * 720) / 1280 / 2,
      frustumSize / 2,
      frustumSize / -2,
      0.1,
      20
    );
    cameraRef.current.position.set(0, 0, 11);
    cameraRef.current.lookAt(0, 0, 0);
    cameraRef.current.updateProjectionMatrix(); 

    const modelPositionConfigs = {
      1: { xOffset: -2, yOffset: -2.5, zOffset:2, scaleFactor: 0.95 },  
      2: { xOffset: 1.5, yOffset: -0.2, zOffset: 2, scaleFactor: 0.95 },  
      3: { xOffset: 2.5, yOffset: 1.5, zOffset: 2, scaleFactor: 0.95 },  
    }; 
    const { xOffset, yOffset, zOffset, scaleFactor } = modelPositionConfigs[postcard?.number] || {
      xOffset: 0,
      yOffset: 0,
      zOffset: 0,
      scaleFactor: 0.95,
    }; 

    moveAndScaleModels(xOffset, yOffset, zOffset, scaleFactor); 

    console.log(window.innerWidth / 720);
    console.log((window.innerHeight - 60) / 1280);
    
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
      bgMesh.renderOrder = -1;
      bgMesh.name="text_bg"
      bgMesh.categoryName="background"
      bgMesh.position.z = 1;
      sceneRef.current.add(bgMesh);
    });

    const addText = (text, x, y, size = 50, breakLine=false) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = 1024;
      canvas.height = 512;

      const fontSize = size * 0.375;
      // ctx.font = `bold ${fontSize*1}px Cafe24Simplehae`;
      ctx.font = `${fontSize*1}px Cafe24Simplehae`;
      ctx.fillStyle = 'rgba(65, 40, 35, 1)'; 
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
    
      const maxLineLength = 38; 
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
      lines.push(currentLine); 
    
      const lineHeight = fontSize * 2.2;
      const totalTextHeight = lines.length * lineHeight;
      const centerY = canvas.height / 2;
    
      lines.forEach((line, index) => {
        const yPos = centerY - (totalTextHeight / 2) + index * (lineHeight-1);
        ctx.fillText(line, canvas.width / 2, yPos);
      });
    
      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.format = THREE.RGBAFormat;
    
      const aspectRatio = canvas.width / canvas.height;
      const geometry = new THREE.PlaneGeometry(10 * aspectRatio, 10); 
      const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(geometry, material);

      mesh.name = `text_${text}`;
      if (breakLine && text.length <= maxLineLength) {
        y += 0.8;
      }
      mesh.position.set(x, y, 5);
      mesh.renderOrder = 2;
      sceneRef.current.add(mesh);

      return mesh;
    };
    
    const commentMesh = addText(postcard.comment, 0, -12.2, 94, true);
    const timestampMesh = addText(postcard.timestamp, 0, -14, 60);
    const nameMesh = addText(postcard.name, 6, -15.8, 80);

    setTextMeshes([commentMesh, timestampMesh, nameMesh]);

    animate(); 
  };

  useEffect(() => {
    


    if (sceneData && sceneData.mixer && Array.isArray(sceneData.mixer.current)) {
      initThreeJS();
    }

    return () => {
      textMeshes.forEach(mesh => {
        if (mesh && mesh.geometry) mesh.geometry.dispose();
        if (mesh && mesh.material) mesh.material.dispose();
        if (mesh && mesh.parent) mesh.parent.remove(mesh);
      });

      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            if (object.material.map) object.material.map.dispose();
            object.material.dispose();
          }
        });
      }

      if (rendererRef.current) {
        rendererRef.current.dispose();
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
      }

      if (recorderRef.current) {
        recorderRef.current.destroy();
        recorderRef.current = null;
      }

      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }

      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      audioContextRef.current = null;
    };
  },  [sceneData.scene, sceneData.mixer, postcard, canvasRef.current]);

  

  const animate = useCallback(() => {
    if (!sceneRef.current || !cameraRef.current || !rendererRef.current) return;
    
    requestAnimationFrame(animate);
  
    let delta = clock.getDelta();
  
    const fps = 24;
    delta = delta * (fps / 60);  
  
    sceneData.mixer.current.forEach(mixer => {
    });
  
    rendererRef.current.render(sceneRef.current, cameraRef.current);
  }, [sceneData.mixer, clock]);

  useEffect(() => {
    if (postcard) {
    }
  }, [postcard]);

  useEffect(() => {
    if (isReadyToRecord) {
      startRecording();
    }
  }, [isReadyToRecord]);

  useEffect(() => {
    if (isRecordingDone) {
      resetAndPlayAnimations();
      const animationInterval = setInterval(() => {
        resetAndPlayAnimations();
      }, 18750);

      return () => clearInterval(animationInterval);
    }
  }, [isRecordingDone, resetAndPlayAnimations]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      // Clean up 3D resources on page unload
      textMeshes.forEach(mesh => {
        if (mesh && mesh.geometry) mesh.geometry.dispose();
        if (mesh && mesh.material) mesh.material.dispose();
        if (mesh && mesh.parent) mesh.parent.remove(mesh);
      });

      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            if (object.material.map) object.material.map.dispose();
            object.material.dispose();
          }
        });
      }

      if (rendererRef.current) {
        rendererRef.current.dispose();
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
      }

      if (recorderRef.current) {
        recorderRef.current.destroy();
        recorderRef.current = null;
      }

      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }

      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      audioContextRef.current = null;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [blobUrl, textMeshes]);

  const containerStyle = {
    position: 'absoulute',
    top: '58px',
    left: 0,
    width: '100%',
    aspectRatio: '9 / 16',
    maxHeight: 'calc(100vh - 118px)',
    overflow: 'visible',

    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
  };

  const canvasStyle = {
    position: 'fixed',
    top: isFixedSize? '58px' : '58px',
    transform: isFixedSize? `translate(0, -26.5%) scale(${
      containerRef.current ? 
      Math.min(containerRef.current.clientWidth / 720, containerRef.current.clientHeight / 1280) : 1
    })` : `translate(0, -3%) scale(${
      containerRef.current ? 
      Math.min(window.innerWidth / 720, (window.innerHeight - 78) / 1280) : 1
    })`,
    transformOrigin: isFixedSize? 'center center': 'top center',
  };

  const recordReady = () => {
    audioRef.current.load();
    audioRef.current.oncanplaythrough = () => {
      setIsReadyToRecord(true);
    };
  };

  return (
    <div style={{ 
      backgroundImage: `url('/static/stockimages/background_paper.webp')`, 
      backgroundSize: 'contain',
      width: '100vw', 
      height: '100vh', 
      zIndex: '900',
      overflow: 'hidden' ,
      overflowY: 'hidden',  
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
          <img src="/static/icons/home.webp" alt="home" style={{ width: '20px', height: '20px' }} />
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
          <img src="/static/icons/hamburger.webp" alt="menu" id="menu-button" style={{width:'30px', height:'30px'}}/>
        </div>
      </header>

      <audio ref={audioRef} src="/static/test.mp3" loop></audio>

      <div ref={containerRef} style={containerStyle}>
        <canvas ref={canvasRef} style={canvasStyle} />
      </div>

      <img
        src="/static/stockimages/promotion.webp"
        alt="Promotion"
        style={{
          position: 'fixed',
          right: '5%',
          bottom: '38px',
          width: '70%',
          height: 'auto',
          zIndex: '1199900',
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

      {!isRecording && !isRecordingDone && (
        <>
          {/* 첫 번째 버튼: '춤사위 만들기' 또는 상태에 따라 다른 텍스트로 변경됨 */}
          <button className="upbutton" onClick={recordReady} disabled={isRecordingDone}>
            춤사위 만들기
          </button>

          {/* 두 번째 버튼: 특정 페이지로 이동 */}
          <button className="upbutton" onClick={() => window.location.href = `/postcardshareview/${id}`}>
            춤사위가 보이지 않나요? <br></br>수동 녹화하기
          </button>
        </>
      )}

      {isRecording && !isRecordingDone &&(
           <button className="upbutton" disabled={true} >
                  영상 녹화 중..
          </button>
      )}

      {isRecordingDone && (
        <>
          <button className="upbutton" onClick={downloadVideo} disabled={!blobUrl}>
            저장하기
          </button>
          <button className="upbutton" onClick={shareVideo} disabled={!blobUrl}>
           인스타그램 공유하기
          </button>
        </>
      )}

      </div>
    </div>
  );

};

export default PostcardView;
