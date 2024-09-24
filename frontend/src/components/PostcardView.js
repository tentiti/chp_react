import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import RecordRTC from 'recordrtc';
import Credit from './Credit';
import { useScene } from './SceneContext';
import './PostcardView.css';


const PostcardView = () => {
  const audioContextRef = useRef(null);
  const audioSourceRef = useRef(null);
  const audioRef = useRef(null);


  //오디오 관련 코드
  const [audioContext, setAudioContext] = useState(null);
  const [audioSource, setAudioSource] = useState(null);

  useEffect(() => {
    // Initialize AudioContext
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    setAudioContext(ctx);

    return () => {
      // Cleanup
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

  //타이밍 관련
  const [isReadyToRecord, setIsReadyToRecord] = useState(false);

  const [isFrameVisible, setIsFrameVisible] = useState(true);


  // Clock 생성
  const clock = new THREE.Clock();

const resetAndPlayAnimations = () => {
  sceneData.mixer.current.forEach((modelData) => {
    const { model, mixer, action, categoryName } = modelData;

    action.reset();  // 애니메이션 리셋
    action.stop();
    action.play();   // 애니메이션 재생
  }); // 이 부분에서 괄호를 닫아야 합니다.
  
  // alert('resetAndPlayAnimations');
};

    
  

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

    resetAndPlayAnimations();  // 애니메이션을 리셋하고 재생
    // animate();
  
    const canvasElement = rendererRef.current.domElement;
    console.log(canvasElement); 
    if (!canvasElement.captureStream) {
      console.warn('captureStream is not supported in this browser.');
      return;
    }
  
    const canvasStream = canvasElement.captureStream(24);
    
    const combinedStream = new MediaStream([...canvasStream.getTracks(), ...destination.stream.getTracks()]);
  
    const recorder = new RecordRTC(combinedStream, {
      type: 'video',
      mimeType: 'video/mp4',
      bitsPerSecond: 8000000,
      video: {
        codec: 'H264',  
        width: 1920, // 해상도 설정 가능
        height: 1080,
        frameRate: 30 // iPhone에서 호환되는 프레임 레이트
      },
    });


    audioRef.current.play();

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
            title: `${postcard?.name}의 춤사위.mp4`,
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

// 모델의 위치를 바꾸고 크기를 줄이는 함수
  const moveAndScaleModels = (xOffset = 0, yOffset = 0, zOffset = 0, scaleFactor = 1) => {
    if (!sceneRef.current) return;

    // 씬에서 모든 모델(그룹 또는 메쉬)을 찾아 위치를 이동하고 크기를 조정합니다.
    sceneRef.current.children.forEach((object) => {
      if ((object.isMesh || object.isGroup) && !object.name.startsWith('text_')) {
        // 위치 변경
        object.position.x = xOffset;
        object.position.y = yOffset;
        object.position.z = zOffset;

        // 크기 변경
        object.scale.set(
          object.scale.x = scaleFactor,
          object.scale.y = scaleFactor,
          object.scale.z = scaleFactor
        );
      }
    });
  };

  useEffect(() => {
    const initThreeJS = async () => {

      // console.log('sceneData.scene:', sceneData.scene);
      console.log('canvasRef.current:', canvasRef.current); // canvasRef.current를 확인
      console.log('modelsRef.current:', sceneData.mixer); // canvasRef.current를 확인

      if (!sceneData.scene || !canvasRef.current || !postcard) return;

      sceneRef.current = new THREE.Scene();

      const ambientLight1 = new THREE.AmbientLight(0xffffff, 1.0);
      sceneRef.current.add(ambientLight1);

      const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1.0);
      directionalLight2.position.set(2, 2, 2);
      sceneRef.current.add(directionalLight2);

      // cameraRef.current.position.z = 5;

        // AmbientLight (전체적으로 부드러운 조명)
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
      sceneRef.current.add(ambientLight);

      // 여러 개의 PointLight (다양한 위치에서 강한 조명)
      const pointLight1 = new THREE.PointLight(0xffffff, 1, 100);
      pointLight1.position.set(10, 10, 10);
      sceneRef.current.add(pointLight1);

      const pointLight2 = new THREE.PointLight(0xffffff, 1, 100);
      pointLight2.position.set(-10, 10, 10);
      sceneRef.current.add(pointLight2);

      const pointLight3 = new THREE.PointLight(0xffffff, 1, 100);
      pointLight3.position.set(0, -10, 10);
      sceneRef.current.add(pointLight3);

      // DirectionalLight (태양처럼 넓게 퍼지는 조명)
      const directionalLight3 = new THREE.DirectionalLight(0xffffff, 1.0);
      directionalLight3.position.set(5, 10, 5);
      sceneRef.current.add(directionalLight3);

      // 중복 제거를 위한 Set
      const addedCategories = new Set();

      if (Array.isArray(sceneData.mixer.current) && sceneData.mixer.current.length > 0) {
        sceneData.mixer.current.forEach((modelData) => {
          const { model, mixer, action, categoryName } = modelData;

      // categoryName이 중복되지 않은 경우에만 모델 추가
      if (!addedCategories.has(categoryName)) {
        if (model instanceof THREE.Object3D) {
          if (!model.name) {
            model.name = `model_${categoryName}`;
          }

          // 모델의 텍스처 설정
          model.traverse((child) => {
            if (child.isMesh) {
              if (child.material.map) {
                child.material.needsUpdate = true;
              }
            }
          });

          // 모델을 씬에 추가
          sceneRef.current.add(model);
          console.log(`Added model: ${model.name}`);
        }

        if (mixer && action) {
          // alert('mixer');
          action.reset();  // 애니메이션 리셋
          action.stop();
          // action.play();   // 애니메이션 재생
        }

        addedCategories.add(categoryName);
      }
        });
      } else {
        console.warn('sceneData.mixer is not an array or it is empty');
      }

      const width = 1080;
      const height = 1920;

      rendererRef.current = new THREE.WebGLRenderer({ 
        canvas: canvasRef.current, 
        alpha: true, 
        antialias: true,  
        // powerPreference: "high-performance",
        preserveDrawingBuffer: true,
      });

      rendererRef.current.setSize(width, height);
      rendererRef.current.setClearColor(0x000000, 0);
      rendererRef.current.autoClear = true;
      rendererRef.currentoutputColorSpace = THREE.SRGBColorSpace;



      const frustumSize = 40;
      cameraRef.current = new THREE.OrthographicCamera(
        (frustumSize * 1080) / 1920 / -2,
        (frustumSize * 1080) / 1920 / 2,
        frustumSize / 2,
        frustumSize / -2,
        0.1,
        20
      );
      cameraRef.current.position.set(0, 0, 11);
      cameraRef.current.lookAt(0, 0, 0);
      cameraRef.current.updateProjectionMatrix(); // 프로젝션 매트릭스

      //배경 넣기 전 옮기기
      const modelPositionConfigs = {
        1: { xOffset: -2, yOffset: -2.5, zOffset: 1, scaleFactor: 0.95 },  // postcard number 1
        2: { xOffset: 1.5, yOffset: -0.2, zOffset: 1, scaleFactor: 0.95 },  // postcard number 2
        3: { xOffset: 2.5, yOffset: 1.5, zOffset: 1, scaleFactor: 0.95 },  // postcard number 3
        // Add more postcard numbers if needed
      }; 
      const { xOffset, yOffset, zOffset, scaleFactor } = modelPositionConfigs[postcard?.number] || {
        xOffset: 0,
        yOffset: 0,
        zOffset: 0,
        scaleFactor: 0.95,
      }; // postcard number가 없을 경우 기본값 사용
  
      moveAndScaleModels(xOffset, yOffset, zOffset, scaleFactor); // 모델의 위치 이동 및 크기 조정
      
      // console.log('추가객체', sceneRef.current.children); // 씬에 추가된 객체를 확인
      // console.log(rendererRef.current.domElement); // DOM element가 제대로 설정되어 있는지 확인


      // 배경 넣기 (배경 z 위치는 고정)
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
        bgMesh.renderOrder = 30; // 낮은 값일수록 먼저 렌더링됨
        bgMesh.name="text_bg"
        bgMesh.categoryName="background"
        bgMesh.position.z = 10;
        console.log('bgMesh');
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

        mesh.name = `text_${text}`;
        mesh.position.set(x, y, 1);
        mesh.renderOrder = 1; // 높은 값일수록 나중에 렌더링됨
        sceneRef.current.add(mesh);

        console.log(text);
        
        return mesh;
      };
      
      // Add texts
      const commentMesh = addText(postcard.comment, 0, -12.2, 94, true);
      const timestampMesh = addText(postcard.timestamp, 0, -14.2, 60);
      const nameMesh = addText(postcard.name, 5., -15.8, 80);

      setTextMeshes([commentMesh, timestampMesh, nameMesh]);


      animate(); // Start the animation loop
      

    };

    initThreeJS();

    return () => {
      // Clean up text meshes
      textMeshes.forEach(mesh => {
        if (mesh && mesh.geometry) mesh.geometry.dispose();
        if (mesh && mesh.material) mesh.material.dispose();
        if (mesh && mesh.parent) mesh.parent.remove(mesh);
      });
  
      // Three.js 관련 리소스 해제
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
        rendererRef.current.dispose();  // WebGL 컨텍스트 해제
      }
  
      if (audioContextRef.current) {
        audioContextRef.current.close();  // AudioContext 해제
      }
  
      // RecordRTC 해제
      if (recorderRef.current) {
        recorderRef.current.destroy();
        recorderRef.current = null;
      }
  
      // Blob URL 해제
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
  
      // 씬 데이터, 카메라, 렌더러 및 오디오 관련 객체 초기화
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
  
    // 24fps 기준으로 delta 값을 조정
    const fps = 24;
    delta = delta * (fps / 60);  // 60fps에서 24fps로 조정
  
    sceneData.mixer.current.forEach(mixer => {
      // mixer.mixer.update(0);
    });
  
    rendererRef.current.render(sceneRef.current, cameraRef.current);
  }, [sceneData.mixer, clock]);
  

  

  useEffect(() => {
    if (postcard) {
      // setTimeout(startRecording, 1000); //1초간 녹화
    }
  }, [postcard]);

  // useEffect(() => {
  //   const handleUnload = () => {
  //     textMeshes.forEach((mesh) => {
  //       if (mesh) {
  //         if (mesh.geometry) mesh.geometry.dispose();
  //         if (mesh.material && mesh.material.map) mesh.material.map.dispose();
  //         if (mesh.material) mesh.material.dispose();
  //         if (mesh.parent) mesh.parent.remove(mesh);
  //       }
  //     });
  
  //     if (rendererRef.current) {
  //       rendererRef.current.dispose();  // WebGL 컨텍스트 해제
  //     }
  
  //     if (sceneRef.current) {
  //       sceneRef.current.clear();  // Scene을 명시적으로 해제
  //     }
  
  //     if (audioContextRef.current) {
  //       audioContextRef.current.close();  // AudioContext 해제
  //     }
  
  //     if (blobUrl) {
  //       URL.revokeObjectURL(blobUrl);  // Blob URL 해제
  //     }
  //   };
  
  //   window.addEventListener('beforeunload', handleUnload);
  
  //   return () => {
  //     window.removeEventListener('beforeunload', handleUnload);
  //     handleUnload();  // 컴포넌트 언마운트 시에도 동일하게 해제 처리
  //   };
  // }, [textMeshes, blobUrl]);

  useEffect(() => {
    if (isReadyToRecord) {
      startRecording();
    }
  }, [isReadyToRecord]);

  useEffect(() => {
    if (isRecordingDone) {
      const animationInterval = setInterval(() => {
        resetAndPlayAnimations();
      }, 18750); //8.75초 이따 개선해야함

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
    // zIndex: '10000',
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
      {isInvitationVisible && <Credit onBack={handleBackClick} />}

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

      </div>
    </div>
  );
};

export default PostcardView;