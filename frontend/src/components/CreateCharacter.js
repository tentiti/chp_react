import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { useNavigate } from 'react-router-dom';
import GIF from 'gif.js';
import './CreateCharacter.css';
import Header from './Header.js';
import { UseVideo } from './VideoContext.js'; // Context에서 가져옴
import Invitation from './Invitation'; // Invitation 컴포넌트 임포트
import { isTablet, isDesktop } from 'react-device-detect';
import { useScene } from './SceneContext'; // SceneContext 사용


const CreateCharacter = ({isFixedSize}) => {

  const { updateSceneData } = useScene(); // SceneContext의 업데이트 함수 사용


  const [isInvitationVisible, setIsInvitationVisible] = useState(false); // Invitation의 가시성을 관리하는 상태
  const [isFloatingVisible, setIsFloatingVisible] = useState(true); // 플로팅 버튼 가시성 관리 상태

  // Invitation을 보이게 하는 함수 (메뉴 클릭 시 호출됨)
  const handleMenuClick = () => {
    setIsInvitationVisible(true);
    // setIsFloatingVisible(false); // Invitation을 보이면 플로팅 버튼을 숨김
  };

  // Invitation을 숨기고 원래 화면으로 돌아가는 함수 (뒤로가기 클릭 시 호출됨)
  const handleBackClick = () => {
    setIsInvitationVisible(false);
    // setIsFloatingVisible(true); // Invitation을 숨기고 플로팅 버튼을 다시 보이게 함
  };

  const [gifUrl, setGifUrl] = useState(null);
  const [videoFiles, setVideoFiles] = useState([]);
  const { addVideoFile } = UseVideo(); // UseVideo를 컴포넌트 내부에서 호출

  const navigate = useNavigate();

  //초대장 이미지 표시 관련
  const [showImage, setShowImage] = useState(false); // 이미지 표시 여부를 결정하는 상태
  // const handleMenuClick = () => {
  //   setShowImage(true); // 메뉴 버튼 클릭 시 이미지 보이게 설정
  // };
  const handleCloseImage = () => {
    setShowImage(false); // 화면을 클릭하면 이미지 사라지게 설정
  };

  const [isSplashVisible, setIsSplashVisible] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(true);



  const [isDressSelected, setIsDressSelected] = useState(false); // 원피스가 선택되었는지 여부
  const canvasRef = useRef(null);
  const hiddenCanvasRef = useRef(null);
  const rendererRef = useRef(null);
  const hiddenRendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());
  const modelsRef = useRef([]);
  const controlsRef = useRef(null); // OrbitControls를 위한 Ref 추가

  const [selectedColor, setSelectedColor] = useState('Black');
  const [selectedFaceColor, setSelectedFaceColor] = useState('#F5F1F1');


  // const [clickedIndex, setClickedIndex] = useState(null); // 클릭된 이미지의 인덱스를 저장하는 상태
  const [selectedIndices, setSelectedIndices] = useState({
    HEAD: null,
    TOP: null,
    BOTTOM: null,
    SHOES: null,
    ACCESSORY: null,
  });

  // 선택한 카테고리의 인덱스를 업데이트하는 함수
const handleAssetSelection = (category, index) => {
  setSelectedIndices((prevSelectedIndices) => ({
    ...prevSelectedIndices,
    [category]: index,  // 해당 카테고리의 선택된 인덱스를 업데이트
  }));
};

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
    { name: 'HEAD', assets: ['head1.png', 'head2.png', 'head3.png', 'head4.png', 'head5.png', 'head6.png', 'head7.png', 'head8.png', 'head9.png', 'head10.png', 'head11.png', 'head12.png'], useColor: true }, // 12개
    { name: 'TOP', assets: ['top1.png', 'top2.png', 'top3.png', 'top4.png', 'top5.png', 'top6.png', 'top7.png', 'top8.png', 'top9.png', 'top10.png', 'top11.png', 'top12.png', 'top13.png', 'top14.png', 'top15.png', 'top16.png', 'top17.png', 'top18.png', 'top19.png', 'top20.png', 'top21.png', 'top22.png', 'top23.png', 'top24.png'], useColor: false }, // 24개
    { name: 'BOTTOM', assets: ['bottom1.png', 'bottom2.png', 'bottom3.png', 'bottom4.png', 'bottom5.png', 'bottom6.png', 'bottom7.png', 'bottom8.png', 'bottom9.png', 'bottom10.png', 'bottom11.png', 'bottom12.png', 'bottom13.png', 'bottom14.png', 'bottom15.png', 'bottom16.png', 'bottom17.png', 'bottom18.png', 'bottom19.png', 'bottom20.png', 'bottom21.png', 'bottom22.png'], useColor: false }, // 22개
    { name: 'SHOES', assets: ['shoes1.png', 'shoes2.png', 'shoes3.png', 'shoes4.png', 'shoes5.png', 'shoes6.png', 'shoes7.png', 'shoes8.png','shoes9.png','shoes10.png','shoes11.png','shoes12.png'], useColor: false }, // 8개
    { name: 'ACCESSORY', assets: ['accessory1.png', 'accessory2.png', 'accessory3.png', 'accessory4.png', 'accessory5.png', 'accessory6.png', 'accessory7.png', 'accessory8.png', 'accessory9.png', 'accessory10.png', 'accessory11.png', 'accessory12.png', 'accessory13.png', 'accessory14.png', 'accessory15.png', 'accessory16.png', 'accessory17.png', 'accessory18.png'], useColor: false }, // 18개
    { name: 'EXPRESSION', assets: [], useColor: false },
  ];

  const COLORS = [
    { name: 'Red', bigCircle: '#E88181', smallCircle: '#F5A0A0' },
    { name: 'Yellow', bigCircle: '#D5CF78', smallCircle: '#E1E17B' },
    { name: 'Purple', bigCircle: '#B078F9', smallCircle: '#CCA9FA' },
    { name: 'Pink', bigCircle: '#F170BE', smallCircle: '#F8BAF1' },
    { name: 'Blue', bigCircle: '#66C7DD', smallCircle: '#A1EEFF' },
    { name: 'Green', bigCircle: '#83C0AA', smallCircle: '#96ECA9' },
    { name: 'Brown', bigCircle: '#9B7565', smallCircle: '#B18A82' },
    { name: 'Black', bigCircle: '#554343', smallCircle: '#694F4F' },
  ];

  const [selectedHeadIndex, setSelectedHeadIndex] = useState(0); // 선택된 얼굴 색 인덱스 상태 추가

  const selectCategory = useCallback((category) => {
    setActiveCategory(category);
    
    // 표정 카테고리를 선택했을 때 캔버스 초기화
    if (category.name === 'EXPRESSION') {
      const canvas = expressionCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#rgb(244, 241, 241)'; // 흰색으로 설정
        ctx.fillRect(0, 0, canvas.width, canvas.height); // 캔버스 전체를 흰색으로 채움
      }
    }
  }, []);

  const selectColor = (categoryName, color) => {
    // 선택된 카테고리와 색상 정보를 콘솔에 출력 (디버깅용)
    console.log('Selected category:', categoryName);
    console.log('Selected color:', color);
  
    // alert로 정보 표시 (필요한 경우)
    // alert(`Category: ${categoryName}, Color: ${color}`);
  
    setSelectedColors((prevColors) => ({
      ...prevColors,
      [categoryName]: color, // color 객체 전체를 저장
    }));

    // alert(JSON.stringify(selectedColors));
  };
  
  
  const [initialCameraPosition, setInitialCameraPosition] = useState(null);

  //표정 그리기 관련
  const GRAYSCALE_COLORS = [
    { color: '#FFF2F2', bigColor: '#EFE8E8', smallColor: '#F8F6F1' },
    { color: '#EADABC', bigColor: '#F6EABC', smallColor: '#FFF6D2' },
    { color: '#FFD4B3', bigColor: '#FFD4B3', smallColor: '#FFE5D2' },
    { color: '#CA9572', bigColor: '#CA9572', smallColor: '#DBA988' },
    { color: '#A36D4C', bigColor: '#A36D4C', smallColor: '#C68862' },
    { color: '#6B4311', bigColor: '#6B4311', smallColor: '#925E1D' }
  ];
  
  const [expressionDrawingColor, setExpressionDrawingColor] = useState('#FFFFFF'); // 초기 색상: 검은색
  const [expressionIsErasing, setExpressionIsErasing] = useState(false); // 지우개 여부
  const expressionCanvasRef = useRef(null); // 표정을 그리는 캔버스  

  const clearCanvasWithColor = (color = 'transparent') => {
    const canvasContainer = document.querySelector('#facedrawingContainer');
    canvasContainer.style.backgroundColor = color; // 배경색을 색상으로 설정
    const canvas = expressionCanvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height); // 캔버스를 완전히 초기화
    if (color !== 'transparent') { // 투명 색상이 아닌 경우에만 색상 채우기
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, canvas.width, canvas.height); // 배경색을 채움
    }
    ctx.beginPath();  // 그리기 준비
  };

  const mixersRef = useRef([]);

  const loadModel = useCallback((modelPath, categoryName, useColor = false, onLoad) => {
    const loader = new GLTFLoader();

    let storedExpressionTexture = null;

    // HEAD 카테고리일 때, 기존 텍스처를 빼온다
    if (categoryName === 'HEAD') {
      modelsRef.current.forEach(({ model }) => {
        model.traverse((child) => {
          if (child.name === 'head_1') {
            if (child.material.map) {
              storedExpressionTexture = child.material.map; // 기존 텍스처 저장
            }
          }
        });
      });
    }

    
    

    // 원피스가 선택되었는지 여부 확인 및 하의 비활성화 및 제거
    if (categoryName === 'TOP' && ['19', '20', '21', '22', '23', '24'].some(num => modelPath.includes(num))) {
      setIsDressSelected(true);  // 원피스 또는 지정된 숫자가 포함된 경우 하의 비활성화

      // 기존 하의 모델을 찾아서 삭제
      modelsRef.current = modelsRef.current.filter((item) => {
        if (item.categoryName === 'BOTTOM') {
          sceneRef.current.remove(item.model);  // 하의 모델을 씬에서 제거
          return false;  // 해당 모델을 modelsRef에서 제거
        }
        return true;
      });
    } else if (categoryName === 'TOP') {
      setIsDressSelected(false); // 다른 상의를 선택하면 하의 활성화
    }
  
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

        if (categoryName === 'Base') {
          gltf.scene.traverse((child) => {
            if (child.isMesh) {
              child.renderOrder = 1000;
            }
          });
        } else {
          gltf.scene.traverse((child) => {
            if (child.isMesh) {
              child.renderOrder = 100;
            }
          });
        }

        model.traverse((child) => {
          if (child.isMesh && child.name === 'HEAD') {
            child.material.depthTest = false;  // 깊이 테스트 비활성화
            child.material.depthWrite = false;  // 깊이 쓰기 비활성화
            child.material.needsUpdate = true;
          }
        });

        // if (categoryName === 'HEAD'){
        //   const scale = 1.06;
        //   model.position.set(0, -0.3, 0); // 필요시 위치 조정
        //   model.scale.set(scale, scale, scale); // 필요시 크기 조정
        // }

        if (categoryName === 'HEAD' && storedExpressionTexture) {
          model.traverse((child) => {
            if (child.name === 'head_1') {
              const mesh = child;
              if (mesh) {
                mesh.material.map = storedExpressionTexture; // 저장한 텍스처를 다시 적용
                mesh.material.needsUpdate = true;
                mesh.material.polygonOffset = true;
                mesh.material.polygonOffsetFactor = -0.1;
              }
            }
          });
        }

        const mixer = new THREE.AnimationMixer(model);
        let action = null;

        if (gltf.animations.length > 0) {
          console.log('Animations:', gltf.animations);  // 애니메이션 클립을 출력해 확인
          action = mixer.clipAction(gltf.animations[0]);
          action.setLoop(THREE.LoopRepeat);
          action.clampWhenFinished = true;
          // action.paused = true;
          action.play();
          const frameDuration = 1 / 24;  // For 24fps animation
          mixer.update(frameDuration);  // Move animation forward by 1 frame
          action.paused = true;
        }

        mixersRef.current.push(mixer); 

        // console.log({ model, mixer, action, categoryName });

        modelsRef.current.push({ model, mixer, action, categoryName });
        // updateCameraView();

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

    // cameraRef.current.position.set(center.x, center.y, center.z + cameraZ);
    cameraRef.current.position.set(0, 1, 50);
    // cameraRef.current.lookAt(center);
    cameraRef.current.lookAt(new THREE.Vector3(0, 3.2, 0));
    cameraRef.current.updateProjectionMatrix();
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const initThreeJS = () => {
      sceneRef.current = new THREE.Scene();
      sceneRef.current.background = null;
      
      rendererRef.current = new THREE.WebGLRenderer({ 
        antialias: true, 
        canvas: canvasRef.current, 
        alpha: true,
        preserveDrawingBuffer: true 
      });

      rendererRef.currentoutputColorSpace = THREE.SRGBColorSpace;

      const canvasParent = canvasRef.current.parentNode;
      console.log(window.innerWidth, window.innerHeight);
      // cameraRef.current = new THREE.PerspectiveCamera(10, 1, 0.1, 1000);

      // 캔버스 크기에 따라 orthographic 카메라 설정
      const aspect = (canvasParent.innerWidth) / (canvasParent.innerHeight);
      const frustumSize = 5; // 카메라 시야 크기, 필요에 따라 조정

      cameraRef.current = new THREE.OrthographicCamera(
        (frustumSize ) / -2, // left
        (frustumSize ) / 2,  // right
        frustumSize / 2,             // top
        frustumSize / -2,            // bottom
        0.1,                         // near
        1000                         // far
      );

      rendererRef.current.setSize(canvasParent.clientWidth, canvasParent.clientHeight * 0.42); // 창 크기에 맞춰 초기화
      
      rendererRef.current.setClearColor(0x000000, 0);

      hiddenRendererRef.current = new THREE.WebGLRenderer({ 
        antialias: true, 
        canvas: hiddenCanvasRef.current, 
        alpha: true,
        preserveDrawingBuffer: true 
      });
      hiddenRendererRef.current.setSize(400, 400);

        // 카메라 업데이트 후 정사각형 비율로 맞추기
      cameraRef.current.aspect = 1; // 정사각형 비율 (aspect 1:1)
      cameraRef.current.updateProjectionMatrix();

      hiddenRendererRef.current.setClearColor(0x000000, 0);

      const ambientLight1 = new THREE.AmbientLight(0xffffff, 1.0);
      sceneRef.current.add(ambientLight1);

      const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1.0);
      directionalLight2.position.set(2, 2, 2);
      sceneRef.current.add(directionalLight2);

      cameraRef.current.position.z = 5;

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

    };

    initThreeJS();
    loadModel('/static/models/animation_1.glb', 'Base', false, () => setLoadingStatus('Loaded Successfully'));
    
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
      // if (rendererRef.current) {
      //   rendererRef.current.dispose();
      // }
      // if (hiddenRendererRef.current) {
      //   hiddenRendererRef.current.dispose();
      // }
      // modelsRef.current.forEach(({ model }) => {
      //   if (model) {
      //     model.traverse((child) => {
      //       if (child instanceof THREE.Mesh) {
      //         child.geometry.dispose();
      //         if (child.material.isMaterial) {
      //           child.material.dispose();
      //         }
      //       }
      //     });
      //   }
      // });
    };
    
  }, [loadModel, updateCameraView]);

  const resetAndStartAnimation = () => {
    modelsRef.current.forEach(({ mixer, action }) => {
      if (mixer && action) {
        action.setLoop(THREE.LoopOnce);  // 애니메이션을 한 번만 재생
        action.clampWhenFinished = true; // 애니메이션이 끝난 후 멈추도록 설정
        action.reset();                  // 애니메이션을 처음부터 시작
        action.play();                   // 애니메이션 실행
      }
    });
  };

  const startGifRecording = () => {
    return new Promise((resolve) => {
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
  
      const originalFps = 24;  // 원래 애니메이션 재생 속도
      const totalFrames = 450; // 450프레임 녹화
      const frameDuration = 1 / originalFps;  // 24fps 기준 프레임당 시간
      let frameCount = 0;
  
      // 애니메이션을 2배 빠르게 재생
      resetAndStartAnimation();
      modelsRef.current.forEach(({ mixer }) => {
        mixer.timeScale = 1;  // 애니메이션 속도를 2배로
      });

  
      // GIF 렌더링이 끝난 후 처리
      // gif.on('finished', async (blob) => {
      //   let gifUploadUrl = await uploadGif(blob);
      //   resolve(gifUploadUrl);  // 업로드 후 URL 반환
      // });
  
      gif.on('finished', async (blob) => {
        console.log('gif created');
        // 서버에 GIF 업로드
        let gifUploadUrl = await uploadGif(blob);
        
        // // Blob 데이터를 사용해 GIF 파일을 로컬에 다운로드
        // const downloadUrl = URL.createObjectURL(blob);
        // const a = document.createElement('a');
        // a.href = downloadUrl;
        // a.download = 'animation.gif'; // 파일명 지정
        // document.body.appendChild(a);
        // a.click(); // 다운로드 트리거
        // document.body.removeChild(a); // 링크 제거
        // URL.revokeObjectURL(downloadUrl); // 메모리 해제
      
        // 업로드 후 URL 반환
        resolve(gifUploadUrl);
      });
      
      // 빠르게 렌더링 및 캡처하는 루프
      let delta = 0;
      while (frameCount < totalFrames) {
        // 애니메이션 프레임 업데이트 (2배 빠른 속도)
        modelsRef.current.forEach(({ mixer }) => mixer.update(frameDuration));
  
        // 캔버스에 그리기
        hiddenRendererRef.current.render(sceneRef.current, cameraRef.current);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(hiddenCanvasRef.current, 0, 0);
  
        // GIF에 프레임 추가 (24fps로 보이도록 딜레이 설정)
        gif.addFrame(ctx, { copy: true, delay: 1000 / originalFps });

        if (frameCount === 0) {
                // 첫 번째 프레임을 PNG로 저장 (선택 사항)
          hiddenRendererRef.current.render(sceneRef.current, cameraRef.current);
          const pngBlob = canvas.toDataURL('image/png');
          // console.log("First frame as PNG:", pngBlob);
          addVideoFile(pngBlob);  // VideoContext에 첫 프레임 저장
        }
  
        frameCount++;
        delta += frameDuration;
      }
  
      // GIF 렌더링 시작
      gif.render();
    });
  };
  
  
  

  const startRecording = async (setVideoFile) => {
    setIsRecording(true); // 녹화 시작
    //모델링 정보 넘기기
    updateSceneData({
      scene: sceneRef.current, 
      camera: cameraRef.current, 
      renderer: rendererRef.current,
      mixer: modelsRef,
    });

  //녹화 카메라  
  cameraRef.current = new THREE.OrthographicCamera(
    -5, // left
    5,  // right
    5,  // top
    -5, // bottom
    0.1, // near
    1000 // far
  );
   // 짧은 지연 후 녹화 시작
   await new Promise((resolve) => setTimeout(resolve, 30));


  
  // 100ms 지연을 위해 Promise와 setTimeout을 사용
  await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms 대기

  cameraRef.current.position.set(0, 1, 50);  // 기본 카메라 위치로 되돌리기
  cameraRef.current.lookAt(new THREE.Vector3(0, 3.2, 0));
  cameraRef.current.updateProjectionMatrix();

  
  console.log("Start recording initiated");
  // setIsRecording(true); // 녹화 시작

  try {
    // Wait for both GIF and MP4 recordings to finish
    const gifUploadUrl = await startGifRecording();  // Return the gif URL directly
    // await startRecordingWithBackgrounds(setVideoFile);  // Handle MP4 recordings

    console.log("Recording completed", gifUploadUrl);

    // Access video files from context

    // After recording is done and GIF is uploaded, navigate to placeselection
    navigate('/place-selection', {
      state: {
        gifUrl: gifUploadUrl.stillfilename,  // Use the returned gif URL directly
        realgifUrl: gifUploadUrl.filename,
      },
    });

  } catch (error) {
    console.error("Error during recording:", error);
  }
};

const uploadGif = async (gifBlob) => {
  const formData = new FormData();
  formData.append('file', gifBlob, 'transparent_animation.gif');
  
  try {
      const response = await fetch(`/api/upload`, {
          method: 'POST',
          body: formData,
      });

      if (!response.ok) {
          const errorText = await response.text();  // Get error message from the response body
          throw new Error(`GIF upload failed: ${response.status} ${response.statusText}. Server response: ${errorText}`);
      }

      const data = await response.json();
      console.log('Upload response:', data);

      const filename = data.filename;

      const gifUrl = `/api/uploads/${filename}`;

      return data;

  } catch (error) {
      // Differentiate between fetch failures and other errors
      if (error.name === 'TypeError') {
          console.error('Network or CORS issue, unable to reach server:', error.message);
      } else {
          console.error('Error uploading GIF:', error.message);
      }

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
      }, 30000);

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

  const getCanvasCoords = (e) => {
    const canvas = expressionCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
  
    // devicePixelRatio를 사용하여 좌표 보정
    const scaleX = canvas.width / rect.width;    // 수평 스케일링 비율
    const scaleY = canvas.height / rect.height;  // 수직 스케일링 비율
  
    // 터치 이벤트일 경우 터치 위치에서 좌표를 얻음, 아니면 마우스 좌표
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  
    return {
      x: (clientX - rect.left) * scaleX,  // 스케일링 비율 적용
      y: (clientY - rect.top) * scaleY    // 스케일링 비율 적용
    };
  };
  

  const startExpressionDrawing = (e) => {
    e.preventDefault(); // 기본 터치 동작 방지
    isDrawingExpression = true;
    const coords = getCanvasCoords(e);
    drawExpressionAt(coords.x, coords.y); // 시작할 때 바로 첫 점을 그림
  };

  const drawExpression = (e) => {
    e.preventDefault(); // 기본 터치 동작 방지
    if (!isDrawingExpression) return;
  
    const coords = getCanvasCoords(e);
    drawExpressionAt(coords.x, coords.y);
  };
  
  const finishExpressionDrawing = () => {
    isDrawingExpression = false;
    const ctx = expressionCanvasRef.current.getContext('2d');
    ctx.beginPath(); // 새로운 경로를 시작
  };
  
  const drawExpressionAt = (x, y) => {
    const ctx = expressionCanvasRef.current.getContext('2d');
    ctx.lineCap = 'round';
  
    if (expressionIsErasing) {
      // 지우개 모드일 때는 선택된 색상으로 그리고 굵기는 20
      ctx.lineWidth = 30;
      ctx.strokeStyle = expressionDrawingColor;
    } else {
      // 그레이스케일 색상이 4, 5, 6번째일 때는 검정색으로 그리고 굵기는 5
      const grayscaleIndex = GRAYSCALE_COLORS.findIndex(colorObj => colorObj.color === expressionDrawingColor);
      if (grayscaleIndex >= 3 && grayscaleIndex <= 5) {
        ctx.lineWidth = 10;
        ctx.strokeStyle = '#000000'; // 검정색으로 그리기
      } else {
        // 그 외의 경우 흰색으로 그리고 굵기는 5
        ctx.lineWidth = 10;
        ctx.strokeStyle = '#000000'; // 흰색으로 그리기
      }
    }
  
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  
  const applyExpressionTextureToModel = () => {
    const canvas = expressionCanvasRef.current;
    const context = canvas.getContext('2d');
  
    // 캔버스에서 검정(#000000) 또는 흰색(#FFFFFF) 부분을 선택적으로 처리
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
  
    // 특정 범위 안에 있는 색상을 투명하게 처리하는 범위 설정 (검정/흰색)
    const threshold = 10; // 색상 판단 허용 오차
  
    // 펜 색상에 따른 로직 분기
    const isLightBackground = selectedHeadIndex <= 2; // 밝은 배경(검정색 펜)
    const isDarkBackground = selectedHeadIndex >= 3; // 어두운 배경(흰색 펜)
  
    // 발광 맵을 위한 데이터 생성 (emissiveMap을 적용하기 위해)
    const emissiveImageData = context.createImageData(canvas.width, canvas.height);
    const emissiveData = emissiveImageData.data;
  
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
  
      // 검정색에 가까운지 판단
      const isAlmostBlack = (r < threshold && g < threshold && b < threshold);
      // 흰색에 가까운지 판단
      const isAlmostWhite = (r > 255 - threshold && g > 255 - threshold && b > 255 - threshold);
  
      // 밝은 배경일 때: 검정색(#000000)만 남기고 나머지는 배경색을 유지
      if (isLightBackground) {
        if (isAlmostBlack) {
          // 검정색 선만 유지
          data[i + 3] = 255; // 알파 채널을 불투명하게
        } else {
          // 나머지 배경은 원래의 알파 값(255)로 유지하여 배경색 보존
          data[i + 3] = 255;
        }
        // 발광 맵에선 검정색이 발광하지 않으므로 발광 채널 0으로 설정
        emissiveData[i + 3] = 0;
      }
  
      // 어두운 배경일 때: 흰색(#FFFFFF)만 남기고 나머지는 배경색을 유지
      if (isDarkBackground) {
        if (isAlmostWhite) {
          // 흰색 선만 유지
          data[i + 3] = 255; // 알파 채널을 불투명하게
  
          // 흰색 선을 발광시키기 위해 emissiveMap에 흰색 부분을 추가
          emissiveData[i] = 255; // R
          emissiveData[i + 1] = 255; // G
          emissiveData[i + 2] = 255; // B
          emissiveData[i + 3] = 255; // 알파 채널 (불투명)
        } else {
          // 나머지 부분은 배경색만 유지
          data[i + 3] = 255;
  
          // 발광하지 않도록 emissiveMap의 알파 채널을 0으로 설정
          emissiveData[i + 3] = 0;
        }
      }
    }
  
    context.putImageData(imageData, 0, 0);
    const emissiveCanvas = document.createElement('canvas');
    emissiveCanvas.width = canvas.width;
    emissiveCanvas.height = canvas.height;
    const emissiveContext = emissiveCanvas.getContext('2d');
    emissiveContext.putImageData(emissiveImageData, 0, 0);
  
    // 캔버스를 텍스처로 변환
    const texture = new THREE.CanvasTexture(canvas);
    const emissiveMap = new THREE.CanvasTexture(emissiveCanvas); // 발광 맵으로 사용
  
    // 텍스처 설정
    texture.flipY = false;  // Y축 반전 방지
    texture.needsUpdate = true;  // 텍스처 갱신 필요
    emissiveMap.flipY = false;  // Y축 반전 방지
    emissiveMap.needsUpdate = true;  // 텍스처 갱신 필요
    texture.minFilter = THREE.LinearFilter;  // 텍스처 확대 시 선명하게 처리
    texture.magFilter = THREE.NearestFilter;  // 텍스처 확대 시 블러링 방지
    emissiveMap.minFilter = THREE.LinearFilter;  // 텍스처 확대 시 선명하게 처리
    emissiveMap.magFilter = THREE.NearestFilter;  // 텍스처 확대 시 블러링 방지
    texture.format = THREE.RGBAFormat;  // 알파 채널 사용
    texture.premultipliedAlpha = false;  // 프리멀티플라이드 알파 비활성화
    texture.colorSpace = THREE.SRGBColorSpace;  // 색 공간을 sRGB로 설정
    texture.generateMipmaps = false;  // Mipmap 비활성화
    emissiveMap.generateMipmaps = false;  // Mipmap 비활성화
  
    // 모델에 텍스처 적용하는 로직
    modelsRef.current.forEach(({ model }) => {
      model.traverse((child) => {
        if (child.name === 'head_1') {  // head_1에 텍스처 적용
          const mesh = child;
          if (mesh) {
            const FACE_COLOR = ['#FBFBFB', '#FBEE9D', '#E3B692', '#AF816C', '#78584A', '#FB9DA6'];
  
            // 원래 컬러 적용
            const originalColor = new THREE.Color(FACE_COLOR[selectedHeadIndex]);
            // 밝기를 균일하게 조정하는 방식
            originalColor.addScalar(0.2);  // 모든 RGB 채널에 0.2씩 더해 색을 밝게 만듦

            // 새로운 머티리얼 생성 및 적용
            mesh.material = new THREE.MeshStandardMaterial({
              // transparent: true,
              color: originalColor,  // 얼굴 전체를 originalColor로 채움
              map: texture,  // 텍스처를 적용 (투명한 부분을 제외하고 덧씌움)
              emissiveMap: emissiveMap,  // 발광 맵 적용 (흰색 부분만 발광)
              emissive: new THREE.Color(0xFFFFFF),  // 발광 색상
              emissiveIntensity: 1.0,  // 발광 강도
              opacity: 1.0,  // 불투명하게 설정
              depthWrite: false,  // 깊이 쓰기 비
              depthTest: true,  // 깊이 테스트 활
              transparent: true,  // 투명도 활성화
            });
  
            mesh.material.needsUpdate = true;
          }
        }
      });
    });
  };
  
useEffect(() => {
  const canvas = expressionCanvasRef.current;

  if (canvas) {
    clearCanvasWithColor('#F5F1F1');  // 기본 흰색 배경 설정
    
    // 터치 이벤트 리스너에 passive: false 옵션을 추가
    canvas.addEventListener('touchstart', startExpressionDrawing, { passive: false });
    canvas.addEventListener('touchmove', drawExpression, { passive: false });
    canvas.addEventListener('touchend', finishExpressionDrawing, { passive: false });

    // 컴포넌트 언마운트 시 이벤트 리스너를 제거
    return () => {
      canvas.removeEventListener('touchstart', startExpressionDrawing);
      canvas.removeEventListener('touchmove', drawExpression);
      canvas.removeEventListener('touchend', finishExpressionDrawing);
    };
  }
}, []);

const clearExpressionCanvas = useCallback(() => {
  const canvas = expressionCanvasRef.current;
  if (canvas) {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#F5F1F1'; // 흰색으로 설정
    ctx.fillRect(0, 0, canvas.width, canvas.height); // 캔버스 전체를 흰색으로 채움
  }
}, []);

  useEffect(() => {
    if (selectedCategory === 'EXPRESSION') {
      clearExpressionCanvas();
    }
  }, [selectedCategory, clearExpressionCanvas]);

  const handleCategorySelection = useCallback((category) => {
    setSelectedCategory(category.name);
    selectCategory(category);
  }, [selectCategory]);

  const handleHeadSelection = (index) => {
    setSelectedHeadIndex(index);  // 선택된 얼굴색 인덱스 상태 업데이트

    // 1. 베이직 모델 교체
    const modelPath = `/static/models/animation_${index + 1}.glb`;  // 해당 인덱스에 맞는 모델 로드
    loadModel(modelPath, 'Base', false);  // 모델 로드

    // 2. 표정 캔버스 배경 이미지 교체
    const faceBackground = `static/stockimages/facebackground_${index + 1}.png`;  // 해당 인덱스에 맞는 배경 이미지 선택
    const faceBackgroundImage = document.querySelector("#face-background");  // 배경 이미지를 가리키는 요소 선택
    if (faceBackgroundImage) {
      faceBackgroundImage.src = faceBackground;  // 표정 캔버스 배경 이미지 변경
    }
  };

  useEffect(() => {
    if (selectedCategory === 'EXPRESSION') {
      // 표정 그리기 모드일 때 카메라 위치와 줌을 조정
      cameraRef.current.position.set(0, 5.7, 3);  // 카메라 위치
      cameraRef.current.lookAt(new THREE.Vector3(0, 5.7, 3));  // 바라볼 좌표 설정
      cameraRef.current.zoom = 2.7;  // 줌인 (값이 클수록 더 가까이 보임)
      cameraRef.current.updateProjectionMatrix();  // 카메라 매트릭스 업데이트
    } else if (selectedCategory === 'HEAD') {
      // 머리 고르기 모드일 때 카메라 위치와 줌을 조정
      cameraRef.current.position.set(0, 5.6, 3);  // 카메라 위치
      cameraRef.current.lookAt(new THREE.Vector3(0, 5.6, 3));  // 바라볼 좌표 설정
      cameraRef.current.zoom = 2.2;  // 적당히 줌인
      cameraRef.current.updateProjectionMatrix();
    } else {
      // 다른 카테고리로 돌아갈 때 카메라 위치와 줌을 원래대로 되돌림
      cameraRef.current.position.set(0, 2.3, 3);  // 카메라 위치
      cameraRef.current.lookAt(new THREE.Vector3(0, 2.3, 3));  // 바라볼 좌표 설정
      cameraRef.current.zoom = 0.5;  // 기본 줌
      cameraRef.current.updateProjectionMatrix();
    }
  }, [selectedCategory]);
  

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {

        // 상태에 따른 controls의 최소 높이 계산 (기본값을 낮춤)
        let controlsHeight = 390; // 기본 최소 높이로 수정
        if (selectedCategory === 'HEAD') {
          controlsHeight = 450; // HEAD 상태일 때
        } else if (selectedCategory === 'EXPRESSION') {
          controlsHeight = 460; // EXPRESSION 상태일 때
        }

        let newHeight =780-controlsHeight;

        // alert(newHeight); 

        rendererRef.current.setSize(window.innerWidth, newHeight);
  
        // 캔버스 크기 설정
        canvasRef.current.style.width = `${Math.min(window.innerWidth, 390)}px`;
        canvasRef.current.style.height = `${newHeight}px`;
        canvasRef.current.style.top = '58px';
        canvasRef.current.style.left = '0';
        // 카메라 비율 업데이트
        cameraRef.current.aspect = window.innerWidth / newHeight;
        cameraRef.current.updateProjectionMatrix();

        const controls = document.querySelector('.controls');
        controls.style.height = `${controlsHeight}px`;
      }
    };
  
    window.addEventListener('resize', handleResize);
    handleResize(); // 초기 실행 시 크기 맞추기
  
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [selectedCategory]);

  useEffect(() => {
    // 초대장이 보일 때 강제로 리사이즈 이벤트 발생
    if (isInvitationVisible) {
      window.dispatchEvent(new Event('resize'));
    }
  }, [isInvitationVisible]);

  useEffect(() => {
    const img = document.querySelector('.invitation-container #invitation-background');
    if (img) {
      img.onload = () => {
        window.dispatchEvent(new Event('resize'));
      };
    }
  }, [isInvitationVisible]);

    // iOS에서 스크롤 문제 해결을 위해 뷰포트 높이를 동적으로 설정하는 함수
    const setViewportHeight = () => {
      const height = window.innerHeight; // 실제 높이 값을 가져옴
      document.documentElement.style.setProperty('--viewport-height', `${height}px`);
    };
  
    useEffect(() => {
      // 초기 로드 시 뷰포트 높이 설정
      setViewportHeight();
  
      // 창 크기 변경 시 뷰포트 높이 다시 설정
      window.addEventListener('resize', setViewportHeight);
  
      // 컴포넌트 언마운트 시 이벤트 리스너 제거
      return () => {
        window.removeEventListener('resize', setViewportHeight);
      };
    }, []);

    //스크롤 무시
    useEffect(() => {
      const allowScrollOnGrid = (event) => {
        const gridElement = document.querySelector('.controls');
        if (gridElement && gridElement.contains(event.target) && !event.target.contains( document.querySelector('canvas'))) {
          return; // 터치가 그리드 내부에서 발생하면 기본 스크롤 허용
        }
        event.preventDefault(); // 그 외의 경우 스크롤 막기
      };
    
      // touchmove 및 scroll 이벤트에 대한 핸들러 추가
      window.addEventListener('touchmove', allowScrollOnGrid, { passive: false });
      window.addEventListener('scroll', allowScrollOnGrid, { passive: false });
    
      return () => {
        window.removeEventListener('touchmove', allowScrollOnGrid);
        window.removeEventListener('scroll', allowScrollOnGrid);
      };
    }, []);
    
  
  return (
  <div
    id="oversize"
    style={{     
      overflow: 'hidden',
    }}
    
  >

    

  {/* Invitation이 보일 때 */}
  {isInvitationVisible && (
    <div
      className={`invitation-container ${
        isInvitationVisible ? "visible" : ""
      }`}
      style={{ zIndex: "1000" }}
    >
      <Invitation onBack={handleBackClick} /> {/* Invitation 컴포넌트 및 뒤로가기 핸들러 */}
    </div>
  )}

  <div
    style={{
      overflow: "auto",
      backgroundImage: `url('/static/stockimages/background_paper.png')`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      height:'100%',
      width: "100%",
      overflow: "hidden",
      // minHeight: '780px'
    }}
    id="whatareYou"
  >

  {/* 처음 초대장 */}
  {overlayVisible && (
    <div id="overlay" className="overlay">
      <div className="overlay-content">
        <img
          src="../static/stockimages/maker_invitation.png"
          alt="Invitation"
        />
      </div>
    </div>
  )}

  <Header 
    id="ccheader"
    title="춤 복장 선택하기" 
    onMenuClick={handleMenuClick} 
    style={{
      display: isInvitationVisible ? 'none !important' : 'block', // 초대장이 보이면 none
      zIndex: 100,
      backgroundColor: 'green',
      height: '58px',
      minHeight: '58px',
    }}
  />

  {/* 녹화 중일 때 보여줄 "녹화중입니다" 이미지 */}
  {isRecording && (
    <div id="splash-screen" className="splash-screen">
      <img
        src="/static/stockimages/making.png"
        alt="Splash"
        style={{
          position: "Fixed",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          top: "0",
          left: "0",
          zIndex: "999999999",
        }}
      />

      <img src="/static/stockimages/loading-circle.gif" alt="Logo" style={{
        position: "Fixed",
        top: "55%",
        left: "50%",
        width: '40px',
        height: '40px',
        transform: "translate(-50%, -50%)",
        zIndex: "999999999",
      }}/>

    </div>
  )}

    {/* 전체 컨테이너 */}
    <div
      id="container"
      style={{
        position: "relative",
        top: "58px",
        width: "100%",
        height: "calc(100% - 58px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "start",
        overflow: "hidden",
        // backgroundColor: "salmon",

        backgroundImage: `url('/static/stockimages/background_paper.png')`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      
        zIndex: "10",
      }}
    >
      <canvas id="ourcanvas" ref={canvasRef} style={{
        backgroundImage: `url('/static/stockimages/background_paper.png')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}/>
      <canvas ref={hiddenCanvasRef} style={{ display: "none" }} />

      <div className="controls" style={{
        left: 0,
      }}>
        <div id="botbottoms" style={{ display: "flex", flexDirection: "Column" }}>
          <div className="category-selection">
            {CATEGORIES.map((category, index) => (
              <button
                key={category.name || index}
                onClick={() => handleCategorySelection(category)} // Handles category selection on click
                className={`color-button ${
                  selectedCategory === category.name ? "selected" : ""
                }`}
                disabled={category.name === "BOTTOM" && isDressSelected} // Disable button based on conditions
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  padding: "0",
                  width: "44px",
                  height: "44px",
                  backgroundColor: "transparent", // Ensure background is transparent
                  cursor: "pointer",
                  position: "relative",
                  boxSizing: "border-box",
                  border: "none", // Remove border from button
                  outline: "none", // Removes pink outline on click
                  WebkitTapHighlightColor: "transparent", /* 클릭 시 하이라이트 제거 */
                  userSelect: "none", // 텍스트 선택 방지
                }}
              >
                <svg
                  width="44"
                  height="44"
                  viewBox="0 0 44 44"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  overflow="visible"
                >
                  <defs>
                    {/* Adjust drop shadow filter to prevent clipping */}
                    <filter
                      id="drop-shadow-path-filter"
                      x="-50%"
                      y="-50%"
                      width="200%"
                      height="200%"
                      filterUnits="userSpaceOnUse"
                    >
                      <feDropShadow
                        dx="0"
                        dy="4"
                        stdDeviation="4"
                        floodColor="rgba(0, 0, 0, 0.25)"
                      />
                    </filter>
                  </defs>

                  {/* Apply shadow directly to the path and scale it to fit the 44x44 size */}
                  <path
                    d="M31.732 24.906C31.3723 25.5071 29.9437 27.7978 27.161 29.7447C22.4124 33.067 17.3387 32.7323 15.527 32.6887C9.3294 32.5388 4.97102 28.6501 3.13725 25.9566C1.24676 23.18 -2.05667 18.3511 2.45184 9.31604C6.10884 1.98759 10.1052 1.45598 13.6287 0.508273C20.5745 -1.35954 28.416 1.9484 32.7435 9.97204C35.264 14.6458 34.2974 20.6183 31.732 24.9057V24.906Z"
                    fill={
                      selectedCategory === category.name
                        ? "#e9a7a7"
                        : "#bab9b3"
                    } // Fill color based on selection
                    filter="url(#drop-shadow-path-filter)" // Apply shadow directly to the path
                    stroke="#E6E1DC" // Border color following the path
                    strokeWidth="1" // Border thickness
                    transform="scale(1.25 1.25)" // Scale the path to fit within 44x44
                  />
                </svg>

                {/* Text label inside the button */}
                <span
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    color: "#f8f6f1",
                    fontSize: "12px",
                  }}
                >
                  {CATEGORY_NAME_MAP[category.name]} {/* Display category name */}
                </span>
              </button>
            ))}
          </div>

          <div className="create-character-container">
          <button className="create-character" onClick={() => startRecording(sceneRef.current, cameraRef.current, rendererRef.current)}>
            캐릭터 생성하기
          </button>
          </div>
        </div>

        {/* Asset Grid (표정 카테고리를 선택했을 때와 그렇지 않을 때) */}
        <div
          className={`asset-grid ${
            selectedCategory === "EXPRESSION" ? "expanded" : ""
          }`}
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          {selectedCategory === "EXPRESSION" ? (
            <>
              {/* 버튼들을 가로로 배치하는 컨테이너 */}
              <div id="expressionTools">
                {/* 색상 선택 버튼 */}
                <div
                  className="expression-color-selection"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center", // 'alignItens'를 'alignItems'로 수정
                    width: "75%",
                    height: "100%",
                  }}
                >
                  {GRAYSCALE_COLORS.map((colorObj, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setExpressionDrawingColor(colorObj.color);
                        clearCanvasWithColor(colorObj.color);
                        handleHeadSelection(index);
                        setSelectedFaceColor(colorObj.color);
                      }}
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        border: "none",
                        padding: "0",
                        width: "32px",
                        height: "32px",
                        position: "relative",
                        boxSizing: "border-box",
                        background: "none",
                        filter:
                          "drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.5))",
                      }}
                    >
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 35 33"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{ position: "absolute", top: 0, left: 0 }}
                      >
                        <mask
                          id={`mask-${index}`}
                          maskUnits="userSpaceOnUse"
                          x="0"
                          y="0"
                          width="35"
                          height="33"
                        >
                          <path
                            d="M31.732 24.906C31.3723 25.5071 29.9437 27.7978 27.161 29.7447C22.4124 33.067 17.3387 32.7323 15.527 32.6887C9.3294 32.5388 4.97102 28.6501 3.13725 25.9566C1.24676 23.18 -2.05667 18.3511 2.45184 9.31604C6.10884 1.98759 10.1052 1.45598 13.6287 0.508273C20.5745 -1.35954 28.416 1.9484 32.7435 9.97204C35.264 14.6458 34.2974 20.6183 31.732 24.9057V24.906Z"
                            fill="white"
                          />
                        </mask>
                        <g mask={`url(#mask-${index})`}>
                          <rect
                            width="35"
                            height="33"
                            fill={colorObj.bigColor}
                          />
                        </g>
                      </svg>
                      <svg
                        width="23"
                        height="23"
                        viewBox="0 0 28 23"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-58%, -50%)",
                        }}
                      >
                        <mask
                          id={`small-mask-${index}`}
                          maskUnits="userSpaceOnUse"
                          x="0"
                          y="0"
                          width="28"
                          height="23"
                        >
                          <path
                            d="M8.99724 2.29525C9.37989 2.01516 10.8738 0.96221 13.1275 0.476599C16.9729 -0.352017 20.0668 1.17971 21.1914 1.67968C25.0386 3.38958 26.7561 6.94617 27.2027 9.10064C27.663 11.3215 28.4736 15.1879 23.2868 19.6336C19.0796 23.2398 16.435 22.5281 13.978 22.1984C9.13463 21.5487 5.08135 17.4449 4.46305 11.3235C4.10306 7.75802 6.26882 4.29377 8.99724 2.29525Z"
                            fill="white"
                          />
                        </mask>
                        <g mask={`url(#small-mask-${index})`}>
                          <rect
                            width="28"
                            height="23"
                            fill={colorObj.smallColor}
                          />
                        </g>
                      </svg>

                      {selectedFaceColor === colorObj.color && (
                        <img
                          src="/static/stockimages/check.png"
                          alt="check"
                          style={{
                            position: "absolute",
                            width: "45%",
                            height: "45%",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                          }}
                        />
                      )}
                    </button>
                  ))}
                </div>

                {/* 연필/지우개 토글 버튼 */}
                <div
                  className="expression-tool-selection"
                  style={{
                    display: "flex",
                    justifyContent: "space-around",
                    alignItems: "center",
                    paddingLeft: "10px",
                    width: "25%",
                  }}
                >
                  <button
                    onClick={() =>
                      setExpressionIsErasing(!expressionIsErasing)
                    }
                    style={{
                      width: "32px", // 너비 32px
                      height: "32px", // 높이 32px
                      borderRadius: "50%", // 둥근 원 모양
                      backgroundColor: "#000", // 배경색 검정
                      backgroundImage: `url(${
                        expressionIsErasing
                          ? "static/stockimages/eraser.png"
                          : "static/stockimages/pencil.png"
                      })`, // 조건에 따라 배경 이미지 변경
                      backgroundPosition: "center",
                      backgroundSize: "70%",
                      backgroundRepeat: "no-repeat",
                      boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.45)", // 그림자 효과
                      border: "none", // 테두리 없음
                      cursor: "pointer", // 마우스 커서 변경
                    }}
                  />

                  {/* 적용 버튼 */}
                  <div
                    className="apply-button"
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <button
                      onClick={applyExpressionTextureToModel}
                      style={{
                        width: "32px", // 너비 32px
                        height: "32px", // 높이 32px
                        borderRadius: "50%", // 둥근 원 모양
                        backgroundColor: "#000", // 배경색 검정
                        backgroundImage:
                          "url(static/stockimages/apply.png)", // apply.png 이미지 사용
                        backgroundPosition: "center",
                        backgroundSize: "60%", // 이미지 크기를 50%로 설정
                        backgroundRepeat: "no-repeat",
                        boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.45)", // 그림자 효과
                        border: "none", // 테두리 없음
                        cursor: "pointer", // 마우스 커서 변경
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* 얼굴그리기 */}
              <div
                id="facedrawingContainer"
                style={{
                  position: "relative",
                  width: "100%", // 너비를 고정된 크기로 설정
                  aspectRatio: "800 / 586", // 가로 세로 비율을 이미지에 맞춤
                  overflow: "hidden", // 초과된 부분을 숨기기
                  background: "rgb(244, 241, 241)", // 배경을 투명하게 설정
                  height: '238px',
                  // display: "flex",
                  // justifyContent: "center",
                  // alignItems: "center",
                }}
              >
                {/* 배경 이미지 */}
                <img
                  src="static/stockimages/facebackground.png"
                  alt="Face Background"
                  style={{
                    position: "absolute",
                    left: "0",
                    width: "100%", // 고정된 900px 너비
                    height: "100%", // 고정된 900px 높이
                    objectFit: "contain", // 이미지 크기를 커버로 설정
                    pointerEvents: "none", // 이미지에 클릭이 되지 않게 설정
                    zIndex: 4,
                  }}
                />

                {/* 표정 그리기용 캔버스 */}
                <canvas
                  ref={expressionCanvasRef}
                  width={900}  // 실제 캔버스의 고정된 해상도
                  height={380} // 실제 캔버스의 고정된 해상도
                  style={{
                    position: "relative",
                    background: "blue", // 배경을 투명하게 설정clipPath: "inset(165px 550px 30px 80px)", // (80, 165)에서 (350, 350) 영역만 보이게 함
                    clipPath: "inset(165px 550px 30px 70px)", // (80, 165)에서 (350, 350) 영역만 보이게 함
                    // transform: "translate(0, 0)", // X축으로 -500px 이동하여 오른쪽을 보이게 함
                    zIndex: 2, // 캔버스가 이미지 위에 렌더링되도록 설정
                    // overflow: "hidden",
                    // transform: "scale(2)",
                    left: "calc(50% - 220px)",
                    top: "calc(50% - 240px)",
                    border: "10px solid red",
                  }}
                  // 마우스 이벤트
                  onMouseDown={startExpressionDrawing}
                  onMouseMove={drawExpression}
                  onMouseUp={finishExpressionDrawing}
                  // 터치 이벤트
                  onTouchStart={startExpressionDrawing}
                  onTouchMove={drawExpression}
                  onTouchEnd={finishExpressionDrawing}
                />
              </div>
            </>
          ) : (
            <>
              {activeCategory &&
                activeCategory.assets.map((asset, index) => (
                  <div id="makemescrollhere" style={{
                    key: {index},
                    overflowY: 'scroll !important',
                    WebkitOverflowScrolling: 'touch !important',
                  }}>
                                      <div
                    className="pictures"
                    key={index}
                    style={{
                      width: "100%",
                      aspectRatio: "1 / 1",
                      borderRadius: "18px",
                      backgroundColor:
                        selectedIndices[activeCategory.name] === index
                          ? "#E9A7A7"
                          : "#EDECE7", // 선택된 항목에 배경색 추가
                    }}
                    onClick={() => {
                      handleAssetSelection(activeCategory.name, index); // 카테고리별 선택된 인덱스 업데이트
                      const modelPath = activeCategory.useColor
                        ? `/static/models/${
                            activeCategory.name.toLowerCase()
                          }_${index + 1}_${
                            selectedColor || "Black"
                          }.glb`
                        : `/static/models/${
                            activeCategory.name.toLowerCase()
                          }_${index + 1}.glb`;

                      // console.log(modelPath);
                      loadModel(
                        modelPath,
                        activeCategory.name,
                        activeCategory.useColor
                      );
                    }}
                  >
                    <img
                      src={`/static/assetImages/${
                        activeCategory.useColor
                          ? `${activeCategory.name.toLowerCase()}_${
                              index + 1
                            }_${selectedColor}`
                          : `${activeCategory.name.toLowerCase()}_${
                              index + 1
                            }`
                      }.png`}
                      alt={`Asset ${index}`}
                      style={{
                        width: "100%",
                        aspectRatio: "1 / 1",
                        borderRadius: "18px",
                        boxSizing: "content-box",
                      }}
                    />
                  </div>
                  </div>

                ))}
            </>
          )}
        </div>

        {activeCategory && activeCategory.useColor && (
          <div className="color-selection">
            {COLORS.map((color, index) => (
              <button
                key={color.name}
                onClick={() => {
                  selectColor(activeCategory.name, color.name);
                  setSelectedColor(color.name);
                }}
                className="color-button"
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  border: "none",
                  padding: "0",
                  width: "32px",
                  height: "32px",
                  position: "relative",
                  boxSizing: "border-box",
                  background: "none",
                  filter:
                    "drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25))",
                }}
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 35 33"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ position: "absolute", top: 0, left: 0 }}
                >
                  <mask
                    id={`mask-${index}`}
                    maskUnits="userSpaceOnUse"
                    x="0"
                    y="0"
                    width="35"
                    height="33"
                  >
                    <path
                      d="M31.732 24.906C31.3723 25.5071 29.9437 27.7978 27.161 29.7447C22.4124 33.067 17.3387 32.7323 15.527 32.6887C9.3294 32.5388 4.97102 28.6501 3.13725 25.9566C1.24676 23.18 -2.05667 18.3511 2.45184 9.31604C6.10884 1.98759 10.1052 1.45598 13.6287 0.508273C20.5745 -1.35954 28.416 1.9484 32.7435 9.97204C35.264 14.6458 34.2974 20.6183 31.732 24.9057V24.906Z"
                      fill="white"
                    />
                  </mask>
                  <g mask={`url(#mask-${index})`}>
                    <rect width="35" height="33" fill={color.bigCircle} />
                  </g>
                </svg>
                <svg
                  width="23"
                  height="23"
                  viewBox="0 0 28 23"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-58%, -50%)",
                  }}
                >
                  <mask
                    id={`small-mask-${index}`}
                    maskUnits="userSpaceOnUse"
                    x="0"
                    y="0"
                    width="28"
                    height="23"
                  >
                    <path
                      d="M8.99724 2.29525C9.37989 2.01516 10.8738 0.96221 13.1275 0.476599C16.9729 -0.352017 20.0668 1.17971 21.1914 1.67968C25.0386 3.38958 26.7561 6.94617 27.2027 9.10064C27.663 11.3215 28.4736 15.1879 23.2868 19.6336C19.0796 23.2398 16.435 22.5281 13.978 22.1984C9.13463 21.5487 5.08135 17.4449 4.46305 11.3235C4.10306 7.75802 6.26882 4.29377 8.99724 2.29525Z"
                      fill="white"
                    />
                  </mask>
                  <g mask={`url(#small-mask-${index})`}>
                    <rect width="28" height="23" fill={color.smallCircle} />
                  </g>
                </svg>

                {selectedColor === color.name && (
                  <img
                    src="/static/stockimages/check.png"
                    alt="check"
                    style={{
                      position: "absolute",
                      width: "45%",
                      height: "auto",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                    }}
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
</div>
        );
      };

export default CreateCharacter;