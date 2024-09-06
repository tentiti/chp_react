import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { useNavigate } from 'react-router-dom';
import GIF from 'gif.js';
import './CreateCharacter.css';
import Header from './Header';

const API_URL = process.env.REACT_APP_API_URL;

const GlbTest = () => {
  const navigate = useNavigate();

  const [isSplashVisible, setIsSplashVisible] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(true);
  const canvasRef = useRef(null);
  const hiddenCanvasRef = useRef(null);
  const rendererRef = useRef(null);
  const hiddenRendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());
  const modelsRef = useRef([]);

  const [loadingStatus, setLoadingStatus] = useState('Loading...');
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedColors, setSelectedColors] = useState({
    HEAD: 'black',
    TOP: 'black',
    BOTTOM: 'black',
    SHOES: 'black',
    ACCESSORY: 'black',
  });
  const [isRecording, setIsRecording] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('HEAD'); // 초기값을 'HEAD'로 설정
  const CATEGORY_NAME_MAP = {
    HEAD: '머리',
    TOP: '상의',
    BOTTOM: '하의',
    SHOES: '신발',
    ACCESSORY: '소품',
    EXPRESSION: '표정',
  };

  const CATEGORIES = [
    { name: 'HEAD', assets: ['head1.png', 'head2.png', 'head3.png', 'head4.png','head5.png','head6.png', 'head7.png', 'head8.png','head9.png'], useColor: true },
    { name: 'TOP', assets: ['top1.png', 'top2.png', 'top3.png'], useColor: false },
    { name: 'BOTTOM', assets: ['bottom1.png', 'bottom2.png', 'bottom3.png'], useColor: false },
    { name: 'SHOES', assets: ['shoes1.png', 'shoes2.png', 'shoes3.png'], useColor: false },
    { name: 'ACCESSORY', assets: ['accessory1.png', 'accessory2.png', 'accessory3.png'], useColor: false },
    { name: 'EXPRESSION', assets: [], useColor: false },
  ];

  const COLORS = [
    { name: 'Red', value: '#F5A0A0' },
    { name: 'Orange', value: '#E1E17B' },
    { name: 'Yellow', value: '#CCA9FA' },
    { name: 'Green', value: '#8FDCDC' },
    { name: 'Blue', value: '#83C0AA' },
    { name: 'Indigo', value: '#9C746C' },
    { name: 'Violet', value: '#7A6565' },
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

  //표정 그리기 관련
  const GRAYSCALE_COLORS = ['#FFFFFF', '#E0E0E0', '#C0C0C0', '#808080', '#404040', '#000000'];

  const [expressionDrawingColor, setExpressionDrawingColor] = useState('#000000'); // 초기 색상: 검은색
  const [expressionIsErasing, setExpressionIsErasing] = useState(false); // 지우개 여부
  const expressionCanvasRef = useRef(null); // 표정을 그리는 캔버스  

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
      sceneRef.current.background = null;
      cameraRef.current = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);

      rendererRef.current = new THREE.WebGLRenderer({ 
        antialias: true, 
        canvas: canvasRef.current, 
        alpha: true,
        preserveDrawingBuffer: true 
      });

      rendererRef.current.setSize(400, 400);
      rendererRef.current.setClearColor(0x000000, 0);

      hiddenRendererRef.current = new THREE.WebGLRenderer({ 
        antialias: true, 
        canvas: hiddenCanvasRef.current, 
        alpha: true,
        preserveDrawingBuffer: true 
      });
      hiddenRendererRef.current.setSize(400, 400);
      hiddenRendererRef.current.setClearColor(0x000000, 0);

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
        rendererRef.current.clear(); 
        rendererRef.current.setClearColor(0xffffff, 0);
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    
      if (hiddenRendererRef.current && sceneRef.current && cameraRef.current) {
        hiddenRendererRef.current.clear();
        hiddenRendererRef.current.setClearColor(0xffffff, 0);
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

  const resetAndStartAnimation = () => {
    modelsRef.current.forEach(({ mixer, action }) => {
      if (mixer && action) {
        mixer.stopAllAction();
        action.reset();
        action.play();
      }
    });
  };

  const startRecording = () => {
    setIsRecording(true);
    setIsSplashVisible(true);
    resetAndStartAnimation();

    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const gif = new GIF({
      workers: 2,
      quality: 10,
      width: 400,
      height: 400,
      transparent: 'rgba(0,0,0,0)',
    });

    const duration = 3;
    const fps = 30;
    const totalFrames = duration * fps;
    let frameCount = 0;

    const captureFrame = () => {
      if (frameCount < totalFrames) {
        const delta = 1 / fps;
        modelsRef.current.forEach(({ mixer }) => {
          if (mixer) mixer.update(delta);
        });

        hiddenRendererRef.current.render(sceneRef.current, cameraRef.current);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(hiddenCanvasRef.current, 0, 0);

        gif.addFrame(ctx, { copy: true, delay: 1000 / fps });
        frameCount++;
        requestAnimationFrame(captureFrame);
      } else {
        gif.render();
      }
    };

    gif.on('finished', async (blob) => {
      setIsRecording(false);

      const gifUploadUrl = await uploadGif(blob);

      if (gifUploadUrl) {
        setIsSplashVisible(false);
        navigate('/place-selection', { state: { gifUrl: gifUploadUrl } });
      } else {
        console.error('Failed to upload GIF');
        setIsSplashVisible(false);
      }
    });

    captureFrame();
  };

  const uploadGif = async (gifBlob) => {
    const formData = new FormData();
    formData.append('file', gifBlob, 'transparent_animation.gif');
    
    try {
        const response = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('GIF upload failed');
        }

        const data = await response.json();
        console.log('Upload response:', data);

        const filename = data.filename;
        console.log('GIF Filename:', filename);

        const gifUrl = `${API_URL}/uploads/${filename}`;
        console.log('Constructed GIF URL:', gifUrl);

        return gifUrl;
    } catch (error) {
        console.error('Error uploading GIF:', error);
        return null;
    }
};

  const closeOverlay = () => {
    setOverlayVisible(false);
  };

  useEffect(() => {
    if (overlayVisible) {
      const timer = setTimeout(() => {
        closeOverlay();
      }, 3000);

      const handleClick = () => {
        closeOverlay();
      };

      document.addEventListener('click', handleClick);

      return () => {
        clearTimeout(timer);
        document.removeEventListener('click', handleClick);
      };
    }
    const initialCategory = CATEGORIES.find(category => category.name === 'HEAD');
    if (initialCategory) {
      selectCategory(initialCategory); // 초기 렌더링 시 'HEAD' 카테고리 로드
    }
  }, [overlayVisible]);

  // 표정
  let isDrawingExpression = false;

    const startExpressionDrawing = (e) => {
      isDrawingExpression = true;
      drawExpression(e); // 마우스 눌렀을 때 첫 번째 점 그리기
    };

    const drawExpression = (e) => {
      if (!isDrawingExpression) return;

      const ctx = expressionCanvasRef.current.getContext('2d');
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';

      if (expressionIsErasing) {
        ctx.strokeStyle = '#FFFFFF'; // 지우개 기능일 때 흰색으로 칠함
      } else {
        ctx.strokeStyle = expressionDrawingColor;
      }

      ctx.lineTo(e.clientX - expressionCanvasRef.current.offsetLeft, e.clientY - expressionCanvasRef.current.offsetTop);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(e.clientX - expressionCanvasRef.current.offsetLeft, e.clientY - expressionCanvasRef.current.offsetTop);
    };

    const finishExpressionDrawing = () => {
      isDrawingExpression = false;
      expressionCanvasRef.current.getContext('2d').beginPath(); // 경로 초기화
    };

    const applyExpressionTextureToModel = () => {
      const canvas = expressionCanvasRef.current;
      const texture = new THREE.CanvasTexture(canvas); // 캔버스를 텍스처로 변환
      texture.needsUpdate = true;
    
      modelsRef.current.forEach(({ model }) => {
        const headMesh = model.getObjectByName('mixamorighead');
        if (headMesh) {
          headMesh.material.map = texture; // 텍스처를 머리에 적용
          headMesh.material.needsUpdate = true;
        }
      });
    };
    
  

  return (
<div style={{ overflow: 'auto' }} id="whatareYou?">
  {overlayVisible && (
    <div id="overlay" className="overlay">
      <div className="overlay-content">
        <img
          src="../static/stockimages/make_invitation.png"
          alt="Invitation"
        />
        <div className="text-overlay">
          <span id="top">
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

  <Header title="춤 함께 추기" />

  {isSplashVisible && (
    <div id="splash-screen" className="splash-screen">
      <img src="https://placehold.co/390x800?text=gogetImage" alt="Splash" style={{ position: 'Fixed', width: '100vw', height: '100vh', objectFit: 'cover', zIndex: '999999999' }} />
    </div>
  )}

  <div id="container" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 58px)', overflowX: 'hidden' }}>
    <canvas
      ref={canvasRef}
      style={{
        width: '100vw',
        height: '100vw'
      }}
    />
    <canvas ref={hiddenCanvasRef} style={{ display: 'none' }} />

    <div className="controls" style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column-reverse' }}>
      <div id="botbottoms" style={{ display: 'flex', flexDirection: 'Column' }}>
        <div className="category-selection">
          {CATEGORIES.map((category) => (
            <button
              key={category.name}
              onClick={() => {
                setSelectedCategory(category.name); // 선택된 카테고리 업데이트
                selectCategory(category); // 기존 함수 호출
              }}
              className={`color-button ${selectedCategory === category.name ? 'selected' : ''}`} // 선택된 경우 클래스 추가
            >
              {CATEGORY_NAME_MAP[category.name]} {/* 한글 카테고리 이름 표시 */}
            </button>
          ))}
        </div>

        <div className="create-character-container">
          <button className="create-character" onClick={startRecording}>
            캐릭터 생성하기
          </button>
        </div>
      </div>

      {/* Asset Grid (표정 카테고리를 선택했을 때와 그렇지 않을 때) */}
      <div className="asset-grid">
  {selectedCategory === 'EXPRESSION' ? (
    <>
      {/* 색상 선택 버튼 */}
      <div className="expression-color-selection" style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '10px' }}>
        {GRAYSCALE_COLORS.map((color, index) => (
          <button
            key={index}
            onClick={() => setExpressionDrawingColor(color)}
            className="color-button"
            style={{ border: 'none', background: 'none' }}
          >
            <div
              className="big-circle"
              style={{
                backgroundColor: color,
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <div
                className="small-circle"
                style={{
                  backgroundColor: color,
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                }}
              />
            </div>
          </button>
        ))}
      </div>

      {/* 연필/지우개 토글 버튼 */}
      <div className="expression-tool-selection" style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '10px' }}>
        <button
          onClick={() => setExpressionIsErasing(!expressionIsErasing)}
          style={{
            width: '80px',
            height: '40px',
            borderRadius: '8px',
            backgroundColor: '#000',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {expressionIsErasing ? '지우개' : '연필'}
        </button>
      </div>

      {/* 적용 버튼 */}
      <div className="apply-button" style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
        <button
          onClick={applyExpressionTextureToModel}
          style={{
            width: '80px',
            height: '40px',
            borderRadius: '8px',
            backgroundColor: '#000',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          적용
        </button>
      </div>

      {/* 그리기 캔버스 */}
      <canvas
        ref={expressionCanvasRef}
        width="200" height="200" // 캔버스 크기를 작게 조정
        style={{
          backgroundColor: '#fff',
          border: '1px solid black',
          marginTop: '10px',
          width: '200px',
          height: '200px',
        }}
        onMouseDown={startExpressionDrawing}
        onMouseMove={drawExpression}
        onMouseUp={finishExpressionDrawing}
      />
    </>
  ) : (
    <>
      {activeCategory && activeCategory.assets.map((asset, index) => (
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
      ))}
    </>
  )}
</div>


      {activeCategory && activeCategory.useColor && (
        <div className="color-selection">
          {COLORS.map((color, index) => (
            <button
              key={color.value}
              onClick={() => {
                selectColor(activeCategory.name, color.value);
                console.log(color.value);
              }}
              className="color-button"
            >
              <div className="big-circle" style={{ backgroundColor: color.value }} />
              <div className="small-circle" style={{ backgroundColor: color.value }} />
            </button>
          ))}
        </div>
      )}
    </div>
  </div>
</div>

        );
      };

export default GlbTest;
