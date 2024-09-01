import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import gifshot from 'gifshot'; // GIF 생성 라이브러리

import RecordRTC from 'recordrtc';
import { useNavigate } from 'react-router-dom'; // 수정된 부분
import './CreateCharacter.css';  // Assuming you saved your CSS in this file

const GlbTest = () => {
  const navigate = useNavigate(); // 수정된 부분
  
  // 오버레이 관련
  const [overlayVisible, setOverlayVisible] = useState(true);
  const overlayRef = useRef(null);

  // 꾸미기 관련
  const canvasRef = useRef(null);
  const hiddenCanvasRef = useRef(null);
  const rendererRef = useRef(null);
  const hiddenRendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());
  const modelsRef = useRef([]);
  const drawingCanvasRef = useRef(null);
  const recordingTimerRef = useRef(null);

  const [loadingStatus, setLoadingStatus] = useState('Loading...');
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedColors, setSelectedColors] = useState({
    HEAD: 'black',
    TOP: 'black',
    BOTTOM: 'black',
    SHOES: 'black',
    ACCESSORY: 'black',
  });
  const [recordingBlob, setRecordingBlob] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef(null);

  // 카테고리 및 색상 선택
  const CATEGORIES = [
    { name: 'HEAD', assets: ['/static/images/head1.png', '/static/images/head2.png', '/static/images/head3.png'], useColor: true },
    { name: 'TOP', assets: ['/static/images/top1.png', '/static/images/top2.png', '/static/images/top3.png'], useColor: false },
    { name: 'BOTTOM', assets: ['/static/images/bottom1.png', '/static/images/bottom2.png', '/static/images/bottom3.png'], useColor: false },
    { name: 'SHOES', assets: ['/static/images/shoes1.png', '/static/images/shoes2.png', '/static/images/shoes3.png'], useColor: false },
    { name: 'ACCESSORY', assets: ['/static/images/accessory1.png', '/static/images/accessory2.png', '/static/images/accessory3.png'], useColor: false },
    { name: 'EXPRESSION', assets: [], useColor: false },
  ];

  const COLORS = [
    { name: 'Red', value: 'red' },
    { name: 'Orange', value: 'orange' },
    { name: 'Yellow', value: 'yellow' },
    { name: 'Green', value: 'green' },
    { name: 'Blue', value: 'blue' },
    { name: 'Indigo', value: 'indigo' },
    { name: 'Violet', value: 'violet' },
    { name: 'Black', value: 'black' },
  ];

  const selectCategory = (category) => {
    setActiveCategory(category);
  };

  const selectColor = (categoryName, color) => {
    setSelectedColors((prevColors) => ({
      ...prevColors,
      [categoryName]: color,
    }));
  };

  const loadModel = useCallback((modelPath, categoryName, useColor = false, onLoad) => {
    const loader = new GLTFLoader();

    modelsRef.current = modelsRef.current.filter((item) => {
      if (item.categoryName === categoryName) {
        sceneRef.current.remove(item.model);
        return false;
      }
      return true;
    });

    loader.load(
      modelPath,
      (gltf) => {
        const model = gltf.scene;
        sceneRef.current.add(model);

        const mixer = new THREE.AnimationMixer(model);
        let action = null;

        if (gltf.animations.length > 0) {
          action = mixer.clipAction(gltf.animations[0]);
          action.setLoop(THREE.LoopRepeat);
          action.clampWhenFinished = true;
          action.paused = true;
        }

        modelsRef.current.push({ model, mixer, action, categoryName });
        updateCameraView();

        if (onLoad) onLoad();
        setLoadingStatus('Loaded Successfully');
      },
      (xhr) => {
        if (xhr.lengthComputable) {
          const percentComplete = (xhr.loaded / xhr.total) * 100;
          setLoadingStatus(`${Math.round(percentComplete)}% loaded`);
        }
      },
      (error) => {
        console.error('Error loading GLB file:', error);
        setError(`Failed to load model: ${error.message}`);
        setLoadingStatus('Load Failed');
      }
    );
  }, []);

  const updateCameraView = useCallback(() => {
    if (modelsRef.current.length === 0) return;

    const box = new THREE.Box3();
    modelsRef.current.forEach(({ model }) => {
      box.expandByObject(model);
    });

    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = cameraRef.current.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
    cameraZ *= 1.5;

    cameraRef.current.position.set(center.x, center.y, center.z + cameraZ);
    cameraRef.current.lookAt(center);
    cameraRef.current.updateProjectionMatrix();
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const initThreeJS = () => {
      sceneRef.current = new THREE.Scene();
      cameraRef.current = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);

      rendererRef.current = new THREE.WebGLRenderer({ antialias: true, canvas: canvasRef.current });
      rendererRef.current.setSize(400, 400);
      rendererRef.current.setClearColor(0xcccccc);

      hiddenRendererRef.current = new THREE.WebGLRenderer({ antialias: true, canvas: hiddenCanvasRef.current });
      hiddenRendererRef.current.setSize(360, 640);
      hiddenRendererRef.current.setClearColor(0xcccccc);

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      sceneRef.current.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(2, 2, 2);
      sceneRef.current.add(directionalLight);

      cameraRef.current.position.z = 5;
    };

    initThreeJS();
    loadModel('/static/models/body__animated_test.glb', 'Base', false, () => setLoadingStatus('Loaded Successfully'));

    const animate = () => {
      requestAnimationFrame(animate);

      const delta = clockRef.current.getDelta();
      modelsRef.current.forEach(({ mixer }) => mixer.update(delta));

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      if (hiddenRendererRef.current && sceneRef.current && cameraRef.current) {
        hiddenRendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      if (hiddenRendererRef.current) {
        hiddenRendererRef.current.dispose();
      }
    };
  }, [loadModel, updateCameraView]);

  const toggleAnimation = (isPlaying) => {
    modelsRef.current.forEach(({ action }) => {
      if (action) {
        if (isPlaying) {
          action.play();
        } else {
          action.stop();
        }
      }
    });
  };

  const startDrawing = (e) => {
    draw(e);
  };

  const draw = (e) => {
    const canvas = drawingCanvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000000';

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const stopDrawing = () => {
    const canvas = drawingCanvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
  };

  const resetAndStartAnimation = () => {
    modelsRef.current.forEach(({ mixer, action }) => {
      if (mixer && action) {
        mixer.stopAllAction();
        action.reset();
        action.play();
      }
    });
  };

  const startRecording = async () => {
    const canvas = hiddenRendererRef.current.domElement;
  
    if (!canvas.captureStream && !canvas.mozCaptureStream) {
      console.error('Canvas capture is not supported on this browser.');
      return;
    }
  
    // 애니메이션 리셋 및 시작
    resetAndStartAnimation();
  
    // 애니메이션이 시작되고 첫 프레임이 렌더링될 시간을 줌
    await new Promise(resolve => setTimeout(resolve, 100));
  
    const stream = canvas.captureStream ? canvas.captureStream(30) : canvas.mozCaptureStream(30);
    const newRecorder = new RecordRTC(stream, {
      type: 'video',
      mimeType: 'video/mp4',
      bitsPerSecond: 800000  
    });
  
    newRecorder.startRecording();
    recorderRef.current = newRecorder;
    setIsRecording(true);
  
    recordingTimerRef.current = setTimeout(() => {
      stopRecording();
    }, 3000);
  };

const stopRecording = () => {
  if (recordingTimerRef.current) {
    clearTimeout(recordingTimerRef.current);
  }

  if (recorderRef.current) {
    recorderRef.current.stopRecording(async function () {
      const blob = recorderRef.current.getBlob();
      setRecordingBlob(blob);
      setIsRecording(false);

      // 애니메이션 정지
      modelsRef.current.forEach(({ mixer }) => {
        if (mixer) {
          mixer.stopAllAction();
        }
      });

      const file = new File([blob], 'animation.mp4', { type: 'video/mp4' });

      const comment = prompt("Enter your comment:");
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/upload', {
          method: 'POST',
          body: formData
        });
        if (!response.ok) {
          throw new Error('Failed to upload video');
        }
        const data = await response.json();

        const commentData = {
          video_name: data.filename,
          comment: comment,
          datetime: new Date().toISOString()
        };
        const commentResponse = await fetch('/comment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(commentData)
        });
        if (!commentResponse.ok) {
          throw new Error('Failed to upload comment');
        }
      } catch (error) {
        console.error('Error during upload:', error);
      }
    });
  }
};

  const shareRecording = async () => {
    if (!recordingBlob) return;

    await navigator.clipboard.writeText('Hello World!');
    alert('"Hello World!" has been copied to your clipboard.');

    const file = new File([recordingBlob], 'animation.mp4', { type: 'video/mp4' });

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
      }
    } else {
      const url = URL.createObjectURL(recordingBlob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'animation.mp4';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      console.log('Video downloaded successfully!');
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  //gif 생성 및 업로드
  const handleSalmonButtonClick = async () => {
    startAnimationRecording(); // 애니메이션 시작

    // GIF 생성 후 서버 업로드
    await generateAndUploadGif();

    // 스플래시 화면으로 이동
    navigate('/splash'); // 수정된 부분
  };

  const startAnimationRecording = () => {
    resetAndStartAnimation();
  };

  const generateAndUploadGif = async () => {
    const frames = [];
    const duration = 3; // GIF의 총 길이 (초 단위)
    const frameRate = 10; // GIF의 프레임 속도
    const totalFrames = duration * frameRate;
  
    for (let i = 0; i < totalFrames; i++) {
      const delta = clockRef.current.getDelta();
      
      // 애니메이션을 업데이트
      modelsRef.current.forEach(({ mixer }) => {
        if (mixer) mixer.update(delta);
      });
  
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      const frame = rendererRef.current.domElement.toDataURL();
      frames.push(frame);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  
    gifshot.createGIF(
      { images: frames, gifWidth: 400, gifHeight: 400, background: 'rgba(0,0,0,0)' },
      async (obj) => {
        if (!obj.error) {
          const base64Data = obj.image.split(',')[1]; // base64 데이터만 추출
          const binaryData = atob(base64Data);
          const byteArray = new Uint8Array(binaryData.length);
  
          for (let i = 0; i < binaryData.length; i++) {
            byteArray[i] = binaryData.charCodeAt(i);
          }
  
          const gifBlob = new Blob([byteArray], { type: 'image/gif' });
  
          // 자동 다운로드 코드
          const url = URL.createObjectURL(gifBlob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = 'animation.gif';
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
  
          // 서버에 업로드 (필요한 경우)
          await uploadGif(gifBlob);
        }
      }
    );
  };
  

  const uploadGif = async (gifBlob) => {
    const formData = new FormData();
    formData.append('file', gifBlob, 'animation.gif');

    try {
      const response = await fetch('/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('GIF upload failed');
      }
    } catch (error) {
      console.error('Error uploading GIF:', error);
    }
  };

  const buttonStyles = (isActive, bgColor = 'green') => ({
    marginTop: '10px',
    padding: '5px 10px',
    fontSize: '14px',
    backgroundColor: isActive ? 'red' : bgColor,
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer'
  });

  // 오버레이 관련
  const closeOverlay = () => {
    setOverlayVisible(false);
  };

  useEffect(() => {
    if (overlayVisible) {
      // 3초 후 자동으로 오버레이 닫기
      const timer = setTimeout(() => {
        closeOverlay();
      }, 300);

      // 클릭 이벤트 리스너 추가
      const handleClick = () => {
        closeOverlay();
      };

      document.addEventListener('click', handleClick);

      // 컴포넌트가 언마운트되거나 overlayVisible이 변경될 때 정리
      return () => {
        clearTimeout(timer);
        document.removeEventListener('click', handleClick);
      };
    }
  }, [overlayVisible]);

  return (
    <div style={{ overflow: 'auto' }} id="whatareYou?">
    {overlayVisible && (
      <div id="overlay" className="overlay" ref={overlayRef}>
        <div className="overlay-content">
          <img
            src="../static/stockimages/make_invitation.png"
            alt="Invitation"
          />
          <div className="text-overlay">
            <span id='top'>
              우리가 만든 춤판,<br />
              만들 새바람
            </span>

            <span id="middle">
              To. 모든 여러분들<br /><br />
              정신 없고 복잡한 세상 속에서 안녕하셨나요?<br />
              꽉 찬 달처럼, 세상을 한 번 뒤집을 때가 무르익었어요!<br />
              '우리'들의 댄스타임에 초대합니다!<br />
              각자가 원하는 모습으로 함께 춤을 추어요!<br />
              10월 중반. 바람이 부는 날 생명 평화의 나무 밑에서 만나요.<br />
              우리들만의 약속입니다!
            </span>

            <span id="bottom">
              김화순 개인전 : 전시 제목 블라블라 라고 합니다.<br />
              일시 : 2024. 10. 12. - 10. 29.<br />
              위치 : 자하미술관
            </span>
          </div>
        </div>
      </div>
    )}

  <header>
    <div className="titleArea">
    <div>
        <img
          src="/static/icons/back_double.png"
          alt="back"
          id="back-button"
          onClick={() => window.history.back()}
        />
      </div>
      <div style={{ fontSize: '20px', color: '#412823'}}>춤 함께 추기</div>
      <div></div>
    </div>
  </header>
      
  <div id="container" style={{ display: 'flex', flexDirection: 'column', marginTop: '58px' , height:'100vh', overflowX:'hidden'}}>

    <canvas ref={canvasRef} style={{ width: '100vw', height: '100vw', border: '1px solid black' }} />
    <canvas ref={hiddenCanvasRef} style={{ display: 'none' }} />

    <div className="controls" style={{ position:'fixed', bottom:'0px'}} >
      {activeCategory && activeCategory.useColor && (
        <div className="color-selection">
          {COLORS.map((color) => (
            <button
              key={color.value}
              onClick={() => selectColor(activeCategory.name, color.value)}
              style={{
                backgroundColor: color.value,
                border: selectedColors[activeCategory.name] === color.value ? '3px solid black' : '1px solid black',
                cursor: 'pointer'
              }}
            />
          ))}
        </div>
      )}

      <div className="asset-grid" style={{marginTop: '60px'}}>
        {activeCategory && activeCategory.name === 'EXPRESSION' ? (
          <canvas
            ref={drawingCanvasRef}
            width={360}
            height={360}
            style={{ border: '1px solid black' }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
        ) : (
          activeCategory && activeCategory.assets.map((asset, index) => (
            <div
              className="pictures"
              key={index}
              onClick={() => {
                const modelPath = activeCategory.useColor
                  ? `/static/models/${activeCategory.name.toLowerCase()}_${index + 1}_${selectedColors[activeCategory.name]}.glb`
                  : `/static/models/${activeCategory.name.toLowerCase()}_${index + 1}.glb`;
                loadModel(modelPath, activeCategory.name, activeCategory.useColor);
              }}
            >
              <img
                src={`https://placehold.co/200x200?text=${asset}`} 
                alt={`Asset ${index}`}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  borderRadius: '18px',
                }}
              />
            </div>
          ))
        )}
      </div>

      <div id="bottombuttons">
        <div className="category-selection">
          {CATEGORIES.map((category) => (
            <button
              key={category.name}
              onClick={() => selectCategory(category)}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div id="botbottoms" style={{display:'flex', flexDirection:'Row'}}>
          <button className="create-character"
            onClick={toggleRecording}
            style={buttonStyles(isRecording)}
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </button>
          <button className="create-character"
            onClick={shareRecording}
            style={buttonStyles(false, 'blue')}
            disabled={!recordingBlob}
          >
            Share Recording
          </button>

          <button className="create-character"
            onClick={handleSalmonButtonClick}
            style={buttonStyles(false, 'salmon')}
            disabled={!recordingBlob}
          >
            Create GIF and Go to Splash
          </button>
        </div>

    </div>
  </div>
  </div>
  </div>
  );
};

export default GlbTest;
