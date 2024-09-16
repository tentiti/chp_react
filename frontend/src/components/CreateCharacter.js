import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { useNavigate } from 'react-router-dom';
import GIF from 'gif.js';
import './CreateCharacter.css';
import Header from './Header.js';
import { UseVideo } from './VideoContext.js'; // Context에서 가져옴

const CreateCharacter = () => {
  const [gifUrl, setGifUrl] = useState(null);
  const [videoFiles, setVideoFiles] = useState([]);
  const { addVideoFile } = UseVideo(); // UseVideo를 컴포넌트 내부에서 호출

  const navigate = useNavigate();

  //초대장 이미지 표시 관련
  const [showImage, setShowImage] = useState(false); // 이미지 표시 여부를 결정하는 상태
  const handleMenuClick = () => {
    setShowImage(true); // 메뉴 버튼 클릭 시 이미지 보이게 설정
  };
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

  // const CATEGORIES = [
  //   { name: 'HEAD', assets: ['head1.png', 'head2.png', 'head3.png', 'head4.png', 'head5.png', 'head6.png', 'head7.png', 'head8.png', 'head9.png', 'head10.png', 'head11.png', 'head12.png'], useColor: true }, // 12개
  //   { name: 'TOP', assets: ['top1.png', 'top2.png', 'top3.png', 'top4.png', 'top5.png', 'top6.png', 'top7.png', 'top8.png', 'top9.png', 'top10.png', 'top11.png', 'top12.png', 'top13.png', 'top14.png', 'top15.png', 'top16.png', 'top17.png', 'top18.png', 'top19.png', 'top20.png', 'top21.png', 'top22.png', 'top23.png', 'top24.png'], useColor: false }, // 24개
  //   { name: 'BOTTOM', assets: ['bottom1.png', 'bottom2.png', 'bottom3.png', 'bottom4.png', 'bottom5.png', 'bottom6.png', 'bottom7.png', 'bottom8.png', 'bottom9.png', 'bottom10.png', 'bottom11.png', 'bottom12.png', 'bottom13.png', 'bottom14.png', 'bottom15.png', 'bottom16.png', 'bottom17.png', 'bottom18.png', 'bottom19.png', 'bottom20.png', 'bottom21.png', 'bottom22.png'], useColor: false }, // 22개
  //   { name: 'SHOES', assets: ['shoes1.png', 'shoes2.png', 'shoes3.png', 'shoes4.png', 'shoes5.png', 'shoes6.png', 'shoes7.png', 'shoes8.png'], useColor: false }, // 8개
  //   { name: 'ACCESSORY', assets: ['accessory1.png', 'accessory2.png', 'accessory3.png', 'accessory4.png', 'accessory5.png', 'accessory6.png', 'accessory7.png', 'accessory8.png', 'accessory9.png', 'accessory10.png', 'accessory11.png', 'accessory12.png', 'accessory13.png', 'accessory14.png', 'accessory15.png', 'accessory16.png', 'accessory17.png', 'accessory18.png'], useColor: false }, // 18개
  //   { name: 'EXPRESSION', assets: [], useColor: false },
  // ];
  
  const CATEGORIES = [
    { name: 'HEAD', assets: ['head1.png', 'head2.png', 'head3.png'], useColor: true }, // 3개
    { name: 'TOP', assets: ['top1.png', 'top2.png', 'top3.png'], useColor: false }, // 3개
    { name: 'BOTTOM', assets: ['bottom1.png', 'bottom2.png', 'bottom3.png'], useColor: false }, // 3개
    { name: 'SHOES', assets: ['shoes1.png', 'shoes2.png', 'shoes3.png', 'shoes4.png', 'shoes4.png', 'shoes6.png', 'shoes7.png', 'shoes8.png', 'shoes9.png', ], useColor: false }, // 3개
    { name: 'ACCESSORY', assets: ['accessory1.png', 'accessory2.png', 'accessory3.png'], useColor: false }, // 3개
    { name: 'EXPRESSION', assets: [], useColor: false },
  ];

  const COLORS = [
    { name: 'Red', bigCircle: '#E88181', smallCircle: '#F5A0A0' },
    { name: 'Orange', bigCircle: '#D5CF78', smallCircle: '#E1E17B' },
    { name: 'Yellow', bigCircle: '#B078F9', smallCircle: '#CCA9FA' },
    { name: 'Green', bigCircle: '#F170BE', smallCircle: '#F8BAF1' },
    { name: 'Blue', bigCircle: '#66C7DD', smallCircle: '#A1EEFF' },
    { name: 'Indigo', bigCircle: '#83C0AA', smallCircle: '#96ECA9' },
    { name: 'Violet', bigCircle: '#9B7565', smallCircle: '#B18A82' },
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
        ctx.fillStyle = '#FFFFFF'; // 흰색으로 설정
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
    { color: '#F5F1F1', bigColor: '#EFE8E8', smallColor: '#F8F6F1' },
    { color: '#F7EFDA', bigColor: '#F6EABC', smallColor: '#FFF6D2' },
    { color: '#F7E2CD', bigColor: '#FFD4B3', smallColor: '#FFE5D2' },
    { color: '#B18A82', bigColor: '#CA9572', smallColor: '#DBA988' },
    { color: '#8B7A7A', bigColor: '#A36D4C', smallColor: '#C68862' },
    { color: '#FFBEBE', bigColor: '#6B4311', smallColor: '#925E1D' }
  ];
  
  const [expressionDrawingColor, setExpressionDrawingColor] = useState('#FFFFFF'); // 초기 색상: 검은색
  const [expressionIsErasing, setExpressionIsErasing] = useState(false); // 지우개 여부
  const expressionCanvasRef = useRef(null); // 표정을 그리는 캔버스  

  // 캔버스를 특정 색으로 초기화하는 함수
  // const clearCanvasWithColor = (color = '#FFFFFF') => {
  //   const canvas = expressionCanvasRef.current;
  //   const ctx = canvas.getContext('2d');
  //   ctx.fillStyle = color;
  //   ctx.fillRect(0, 0, canvas.width, canvas.height);
  //   ctx.beginPath();
  //   ctx.strokeStyle = '#000000';
  //   ctx.lineWidth = 5;
  //   ctx.closePath();
  // };

  const clearCanvasWithColor = (color = 'transparent') => {
    const canvas = expressionCanvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height); // 캔버스를 완전히 초기화
    if (color !== 'transparent') { // 투명 색상이 아닌 경우에만 색상 채우기
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, canvas.width, canvas.height); // 배경색을 채움
    }
    ctx.beginPath();  // 그리기 준비
  };
  
  


  const loadModel = useCallback((modelPath, categoryName, useColor = false, onLoad) => {
    const loader = new GLTFLoader();

    // 원피스가 선택되었는지 여부 확인
      if (categoryName === 'TOP' && modelPath.includes('dress')) {
      setIsDressSelected(true);  // 원피스 선택 시 하의 비활성화
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

              // 모델 내 구성 요소 콘솔에 출력
      // console.log('Model components:');
      // model.traverse((child) => {
      //   console.log(child);  // 각 구성 요소 출력
      // });

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
      cameraRef.current = new THREE.PerspectiveCamera(10, 1, 0.1, 1000);

      rendererRef.current = new THREE.WebGLRenderer({ 
        antialias: true, 
        canvas: canvasRef.current, 
        alpha: true,
        preserveDrawingBuffer: true 
      });

      rendererRef.currentoutputColorSpace = THREE.SRGBColorSpace;
      // rendererRef.gammaFactor = 2.2;
      // rendererRef.gammaOutput = true;

      rendererRef.current.setSize(400, 400);
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

      // OrbitControls 초기화
      // controlsRef.current = new OrbitControls(cameraRef.current, rendererRef.current.domElement);
      // controlsRef.current.enableDamping = true; // 부드러운 회전
      // controlsRef.current.dampingFactor = 0.25; // 감속 비율
      // controlsRef.current.enableZoom = true; // 줌 허용

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

      // // OrbitControls 업데이트
      // if (controlsRef.current) {
      //   controlsRef.current.update();
      // }
    
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


  const startRecordingWithBackgrounds = async () => {
    console.log("Recording started");
  
    const backgroundImages = [
      '/static/stockimages/bg1.png',
      '/static/stockimages/bg2.png',
      '/static/stockimages/bg3.png',
    ];
  
    const modelPositions = [
      { x: 67, y: 150, width: 147, height: 190 },
      { x: 168, y: 102, width: 147, height: 190 },
      { x: 196, y: 65, width: 147, height: 190 },
    ];
  
    try {
      resetAndStartAnimation();  // 애니메이션을 재생하는 함수 호출 추가

      // 비동기 방식으로 모든 배경의 MP4 녹화를 시작하고, 각각의 MP4 파일을 addVideoFile로 넘김
      const mp4Files = await Promise.all(backgroundImages.map((bgImage, index) =>
        startRecordingForBackground(bgImage, modelPositions[index])
      ));
  
      console.log("All recordings finished");
  
      // MP4 파일 모두 addVideoFile로 저장
      mp4Files.forEach((mp4Blob, index) => {
        const fileName = `animation_recording_${index + 1}.mp4`;
  
        // Blob이 생성되었는지 확인
        console.log(`MP4 Blob for background ${index + 1}:`, mp4Blob);
  
        if (mp4Blob && mp4Blob.size > 0) {
          console.log(`Blob size: ${mp4Blob.size} bytes`);
        } else {
          console.error('Blob is empty or not created correctly');
          return;  // Blob이 제대로 생성되지 않았다면 다운로드 진행하지 않음
        }
  
        // Blob을 addVideoFile로 저장
        addVideoFile(mp4Blob);
         // 자동으로 다운로드
        downloadRecordedVideo(mp4Blob, fileName);
      });
    } catch (error) {
      console.error("Error during recording:", error);
    } finally {
      setIsRecording(false); // 녹화 종료
      console.log("Recording stopped");
    }
  };
  
  const downloadRecordedVideo = (blob, filename = 'recording.mp4') => {
    const url = URL.createObjectURL(blob); // Blob을 URL로 변환
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;  // 다운로드할 파일 이름 설정
    document.body.appendChild(a);
    // a.click();
  
    // 다운로드 후 URL 객체 해제
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };
  
  const startRecordingForBackground = async (backgroundImageSrc, { x, y, width, height }) => {
    console.log('Starting recording for background:', backgroundImageSrc);
  
    const canvas = document.createElement('canvas');
    canvas.width = 393;
    canvas.height = 491;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
  
    const duration = 18.75; // 18.75초 동안 녹화
    const fps = 24; // 프레임 속도는 24fps로 설정
    const totalFrames = Math.round(duration * fps); // 총 프레임 수 계산
    const frameInterval = 1000 / fps; // 프레임 간 간격 (밀리초)
    let frameCount = 0;
  
    const backgroundImage = new Image();
    backgroundImage.src = backgroundImageSrc;
  
    backgroundImage.onload = () => {
      console.log(`Background image ${backgroundImageSrc} loaded successfully`);
    };
    
    backgroundImage.onerror = (error) => {
      console.error(`Failed to load background image ${backgroundImageSrc}`, error);
    };
  
    const loadImage = () => {
      return new Promise((resolve) => {
        backgroundImage.onload = () => resolve(backgroundImage);
      });
    };
  
    await loadImage(); // 배경 이미지가 로드될 때까지 대기
  
    // 배경 이미지 크기를 비율에 맞게 조정
    const { targetWidth, targetHeight, offsetX, offsetY } = getImageFitDimensions(
      backgroundImage.width,
      backgroundImage.height,
      canvas.width,
      canvas.height
    );
  
    // 녹화 형식을 동적으로 결정 (MP4 또는 WebM)
    let mimeType = '';
    if (MediaRecorder.isTypeSupported('video/webm')) {
      mimeType = 'video/webm';
    } else if (MediaRecorder.isTypeSupported('video/mp4')) {
      mimeType = 'video/mp4';
    } else {
      console.error('이 브라우저에서 지원하는 비디오 형식을 찾을 수 없습니다.');
      return;
    }
  
    // 녹화 시작
    const stream = canvas.captureStream(fps);
    const mediaRecorder = new MediaRecorder(stream, { mimeType });
  
    let chunks = [];
  
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };
  
    return new Promise((resolve) => {
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        // 파일 확장자 결정
        let fileExtension = mimeType.includes('mp4') ? 'mp4' : 'webm';
        const fileName = `animation_recording_${Date.now()}.${fileExtension}`;
        resolve(blob);
      };
  
      mediaRecorder.start();
  
      const startTime = Date.now();
  
      // 캡처 및 애니메이션 처리
      const captureFrame = () => {
        if (frameCount < totalFrames) {
          const delta = 1 / fps;
          modelsRef.current.forEach(({ mixer }) => mixer.update(delta));
  
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(
            backgroundImage,
            0,
            0,
            backgroundImage.width,
            backgroundImage.height,
            offsetX,
            offsetY,
            targetWidth,
            targetHeight
          );
  
          // 모델 렌더링
          hiddenRendererRef.current.render(sceneRef.current, cameraRef.current);
  
          // 캐릭터를 x, y 좌표에 렌더링
          if (hiddenCanvasRef.current) {
            ctx.drawImage(hiddenCanvasRef.current, x, y, width, width);
          } else {
            console.error('hiddenCanvasRef.current is not defined or not a valid canvas element.');
          }
          
          frameCount++;
  
          // 다음 프레임을 위한 시간 계산
          const nextFrameTime = startTime + frameCount * frameInterval;
          const now = Date.now();
          const timeUntilNextFrame = Math.max(0, nextFrameTime - now);
  
          setTimeout(captureFrame, timeUntilNextFrame);
        } else {
          mediaRecorder.stop();
        }
      };
  
      captureFrame(); // 프레임 캡처 시작
    });
  };
  
  // 배경 이미지 크기 비율 맞추기 함수
  const getImageFitDimensions = (imgWidth, imgHeight, canvasWidth, canvasHeight) => {
    const imgAspectRatio = imgWidth / imgHeight;
    const canvasAspectRatio = canvasWidth / canvasHeight;
  
    let targetWidth, targetHeight, offsetX, offsetY;
  
    if (imgAspectRatio > canvasAspectRatio) {
      // 이미지가 더 넓음
      targetWidth = canvasWidth;
      targetHeight = canvasWidth / imgAspectRatio;
      offsetX = 0;
      offsetY = (canvasHeight - targetHeight) / 2;
    } else {
      // 이미지가 더 높음
      targetHeight = canvasHeight;
      targetWidth = canvasHeight * imgAspectRatio;
      offsetX = (canvasWidth - targetWidth) / 2;
      offsetY = 0;
    }
  
    return { targetWidth, targetHeight, offsetX, offsetY };
  };
  
  // GIF 생성 로직 (기존 코드 그대로 유지)
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

    const fps = 24; // 초당 프레임
    const totalFrames = 450;
    let frameCount = 0;

    resetAndStartAnimation();

    gif.on('finished', async (blob) => {
      let gifUploadUrl = await uploadGif(blob); // GIF 업로드 처리
      console.log('1 GIF Upload URL:', gifUploadUrl);
      // gifUploadUrl = gifUploadUrl.stillfilename
      resolve(gifUploadUrl);  // Resolve with the gifUploadUrl once the upload is complete
    });

    const captureFrame = () => {
      if (frameCount < totalFrames) {
        const delta = 1 / fps;
        modelsRef.current.forEach(({ mixer }) => mixer.update(delta));

        hiddenRendererRef.current.render(sceneRef.current, cameraRef.current);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(hiddenCanvasRef.current, 0, 0);

        gif.addFrame(ctx, { copy: true, delay: 1000 / fps });
        frameCount++;
        requestAnimationFrame(captureFrame);
      } else {
        gif.render();  // Trigger the 'finished' event when GIF is rendered
      }
    };

    captureFrame(); // Start capturing GIF frames
  });
};

const startRecording = async (setVideoFile) => {
  console.log("Start recording initiated");
  setIsRecording(true); // 녹화 시작

  try {
    // Wait for both GIF and MP4 recordings to finish
    const gifUploadUrl = await startGifRecording();  // Return the gif URL directly
    await startRecordingWithBackgrounds(setVideoFile);  // Handle MP4 recordings

    console.log("Recording completed", gifUploadUrl);

    // Access video files from context

    // After recording is done and GIF is uploaded, navigate to placeselection
    navigate('/place-selection', {
      state: {
        gifUrl: gifUploadUrl.stillfilename,  // Use the returned gif URL directly
        realgifUrl: gifUploadUrl.filename,
        videoFiles: videoFiles,  // Pass the video files from context
      },
    });

  } catch (error) {
    console.error("Error during recording:", error);
  }
};

  
// console.log(process.env.REACT_APP_API_URL); // Check if API_URL is correct


const uploadGif = async (gifBlob) => {
  const formData = new FormData();
  formData.append('file', gifBlob, 'transparent_animation.gif');
  
  try {
      const response = await fetch(`/api/upload`, {
          method: 'POST',
          body: formData,
      });

      // Log the response status for additional insight
      // console.log('Response status:', response.status);
      
      // If the response is not OK, log more details
      if (!response.ok) {
          const errorText = await response.text();  // Get error message from the response body
          throw new Error(`GIF upload failed: ${response.status} ${response.statusText}. Server response: ${errorText}`);
      }

      const data = await response.json();
      console.log('Upload response:', data);

      const filename = data.filename;
      // console.log('GIF Filename:', filename);

      const gifUrl = `/api/uploads/${filename}`;
      // console.log('Constructed GIF URL:', gifUrl);

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
        ctx.strokeStyle = '#FFFFFF'; // 검정색으로 그리기
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
  

  // const applyExpressionTextureToModel = () => {
  //   const canvas = expressionCanvasRef.current;
  //   const texture = new THREE.CanvasTexture(canvas);
  
  //   // Y축을 반전시키기 위해 flipY를 false로 설정
  //   texture.flipY = false;
  //   texture.needsUpdate = true;

  //   // 텍스처의 색상 공간을 sRGB로 설정
  //   rendererRef.outputColorSpace = THREE.SRGBColorSpace;
  //   texture.format = THREE.RGBAFormat;
    
  //   // 모델에 텍스처를 적용하는 로직
  //   modelsRef.current.forEach(({ model }) => {
  //     model.traverse((child) => {
  //       if (child.name === 'head_1') {
  //         const head = child;
  //         if (head) {
  //           const mesh3 = head;
  //           if (mesh3) {
  //             // UV 좌표가 없을 경우 기본 UV 좌표 생성
  //             if (mesh3.geometry && mesh3.geometry.attributes) {
  //               if (!mesh3.geometry.attributes.uv) {
  //                 const geometry = mesh3.geometry;
  //                 const uv = new Float32Array(geometry.attributes.position.count * 2);
  
  //                 // UV 좌표 생성 로직 (y축 반전 적용)
  //                 for (let i = 0; i < uv.length; i += 2) {
  //                   uv[i] = (i / 2) % 2;
  //                   uv[i + 1] = Math.floor((i / 2) / 2); // 반전된 y좌표
  //                 }
  
  //                 geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  //                 geometry.attributes.uv.needsUpdate = true;
  //               }
  
  //               // 텍스처 적용
  //               if (!mesh3.material) {
  //                 mesh3.material = new THREE.MeshBasicMaterial();
  //               }
  
  //               mesh3.material.map = texture;
  //               mesh3.material.needsUpdate = true;
  //             } else {
  //               console.warn("Geometry or geometry attributes are undefined for mesh3.");
  //             }
  //           }
  //         }
  //       }
  //     });
  //   });
  // };

  // const applyExpressionTextureToModel = () => {
  //   const canvas = expressionCanvasRef.current;
  //   // downloadExpressionAsPNG(canvas);
  //   const texture = new THREE.CanvasTexture(canvas);
  
  //   // Y축을 반전시키기 위해 flipY를 false로 설정
  //   texture.flipY = false;
  //   texture.needsUpdate = true;
  //   texture.minFilter = THREE.LinearFilter; // 텍스처 확대 시 선명하게 처리
  //   texture.magFilter = THREE.NearestFilter; // 텍스처 확대 시 블러링을 방지
  //   texture.format = THREE.RGBAFormat; // 알파 채널 사용 설정
  //   texture.premultipliedAlpha = false; // 알파 값이 곱해진 프리멀티플라이드 알파 사용
  //   texture.colorSpace = THREE.SRGBColorSpace; // 색 공간을 sRGB로 설정
  //   texture.generateMipmaps = false; // Mipmap 사용을 비활성화하여 텍스처를 직접 사용

  //   // 모델에 텍스처를 적용하는 로직
  //   modelsRef.current.forEach(({ model }) => {
  //     model.traverse((child) => {
  //       if (child.name === 'head_1') {  // head_1에 텍스처 적용
  //         const mesh = child;
  //         if (mesh) {
  //           const FACE_COLOR =  ['#FBFBFB', '#FBEE9D', '#E3B692', '#AF816C', '#78584A', '#FB9DA6'];

  //           console.log('Material Info:', mesh.material);
  //           const originalColor = new THREE.Color(FACE_COLOR[selectedHeadIndex]);
  //           // originalColor.convertSRGBToLinear();  // 감마 보정
  //           console.log('Original color:', originalColor, selectedHeadIndex);

  //           // 새로운 머티리얼 생성 및 적용
  //           mesh.material = new THREE.MeshStandardMaterial({
  //             transparent: true,  // 투명도 활성화
  //             color: originalColor,  // 원래 색상 유지
  //             // opacity: 0.3  // 50% 반투명
  //           });            


  //         //   if (mesh.material) {
  //         //     mesh.material.map = texture;
  //         //     mesh.material.color.convertSRGBToLinear();
  //         //     mesh.material.transparent = true;
  //         //     mesh.material.blending = THREE.NormalBlending; // Use custom blending for more control
  //         //     // mesh.material.blendSrc = THREE.SrcAlphaFactor; // Alpha blending source factor
  //         //     // mesh.material.blendDst = THREE.OneMinusSrcAlphaFactor; // Alpha blending destination factor
  //         //     // // mesh.material.blendEquation = THREE.AddEquation; // How the blending is calculated
    
  //         //     // Ensure that opacity and depth testing are correctly set
  //         //     mesh.material.opacity = 1.0;
  //         //     mesh.material.depthWrite = false; // Disable depth writing to avoid rendering issues
  //         //     mesh.material.depthTest = true; // Ensure depth test remains enabled for proper layer rendering
    
  //         //     mesh.material.needsUpdate = true;
  //         // } else {
  //         //     mesh.material = new THREE.MeshStandardMaterial({
  //         //       map: texture,
  //         //       transparent: true,
  //         //       blending: THREE.NormalBlending, // Custom blending ensures more vibrant colors
  //         //       blendSrc: THREE.SrcAlphaFactor,
  //         //       blendDst: THREE.OneMinusSrcAlphaFactor,
  //         //       blendEquation: THREE.AddEquation,
  //         //       opacity: 1.0,
  //         //       depthWrite: false,
  //         //       depthTest: true,
  //         //       premultipliedAlpha: false, // Ensure non-premultiplied alpha blending
  //         //     });
  //         //   }
  //         }
  //       }
  //     });
  //   });
  // };
  
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
              depthWrite: false,  // 깊이 쓰기 비활성화
              depthTest: true,  // 깊이 테스트 활성화
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


    
    
  

  return (
    <div style={{
      
    }}>
    <div style={{ 
      overflow: 'auto',
      backgroundImage: `url('/static/stockimages/background_paper.png')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      height: '100%',
      minHeight: '780px'
       }} id="whatareYou?">
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

      <Header title="춤 복장 선택하기" onMenuClick={handleMenuClick} />

      {showImage && (
        <div 
          style={{
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%', 
            backgroundColor: 'gray',
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            // backgroundImage: 'url("/static/stockimages/inviflat.png")',
          }}
          onClick={handleCloseImage} // 이미지를 클릭해도 사라지게 설정
        >
          <img src="/static/stockimages/inviflat.png" alt="invitation" style={{ maxWidth: '90%', maxHeight: '90%', zIndex: '999999'}} />
        </div>
      )}


       {/* 녹화 중일 때 보여줄 "녹화중입니다" 이미지 */}
      {isRecording && (
        <div id="splash-screen" className="splash-screen">
        <img src="/static/stockimages/making.png" alt="Splash" style={{ position: 'Fixed', width: '100%', height: '100%', objectFit: 'cover', top: '0', left:'0', zIndex: '999999999' }} />
        <img src="/static/stockimages/loading-circle.gif" alt="Splash" style={{ width: '80px', position: 'Fixed', left:'calc(50% - 42px)', top:'55%',zIndex: '999999999' }} />
        </div>
      )}

    <div id="container" style={{ 
      position:'relative',
      top:'58px',
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      alignItems: 'center',
      justifyContent: 'start',
      overflow: 'hidden' 
      }}>
      
      <canvas
        ref={canvasRef}
        style={{
          height: '40%',
          minHeight:'100px',
          flexGrow: 1,
        }}
      />
      <canvas ref={hiddenCanvasRef} style={{ display: 'none' }} />

      <div className="controls" style={{ 
        height:'100%',
        marginTop: '0', 
        display: 'flex', 
        flexDirection: 'column-reverse',
        backgroundColor: 'transparent'
         }}>
      
      <div id="botbottoms" style={{ display: 'flex', flexDirection: 'Column' }}>
      
        <div className="category-selection">
          {CATEGORIES.map((category) => (
            <button
              key={category.name}
              onClick={() => handleCategorySelection(category)}
              className={`color-button ${selectedCategory === category.name ? 'selected' : ''}`}
              disabled={category.name === 'BOTTOM' && isDressSelected}
            >
              {CATEGORY_NAME_MAP[category.name]}
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
      <div className={`asset-grid ${selectedCategory === 'EXPRESSION' ? 'expanded' : ''}`} style={{ 
        display: 'flex',
        flexDirection: 'column',
      }}>
      {selectedCategory === 'EXPRESSION' ? (
        <>

        {/* 버튼들을 가로로 배치하는 컨테이너 */}
        <div id="expressionTools" style={{ 
          position:'sticky', 

          width: '100%',
          height:'58px',

          display: 'flex', 
          flexDirection:'row', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          paddingLeft:'10px',
          boxSizing: 'border-box',
          zIndex: '999999',
          borderTop: '1px solid #E6E1DC',
          borderBottom: '1px solid #E6E1DC',
          }}
          >

          {/* 색상 선택 버튼 */}
          <div className="expression-color-selection" style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', // 'alignItens'를 'alignItems'로 수정
            width: '75%',
            height: '100%'
          }}>
        {GRAYSCALE_COLORS.map((colorObj, index) => (
          <button
          key={index}
          onClick={() => {
            setExpressionDrawingColor(colorObj.color);
            clearCanvasWithColor(colorObj.color);
            handleHeadSelection(index);
          }}
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            border: 'none',
            padding: '0',
            width: '32px',
            height: '32px',
            position: 'relative',
            boxSizing: 'border-box',
            background: 'none',
            filter: 'drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.5))',
          }}
        >
          <svg width="32" height="32" viewBox="0 0 35 33" fill="none" xmlns="http://www.w3.org/2000/svg" style={{position: 'absolute', top: 0, left: 0}}>
            <mask id={`mask-${index}`} maskUnits="userSpaceOnUse" x="0" y="0" width="35" height="33">
              <path d="M31.732 24.906C31.3723 25.5071 29.9437 27.7978 27.161 29.7447C22.4124 33.067 17.3387 32.7323 15.527 32.6887C9.3294 32.5388 4.97102 28.6501 3.13725 25.9566C1.24676 23.18 -2.05667 18.3511 2.45184 9.31604C6.10884 1.98759 10.1052 1.45598 13.6287 0.508273C20.5745 -1.35954 28.416 1.9484 32.7435 9.97204C35.264 14.6458 34.2974 20.6183 31.732 24.9057V24.906Z" fill="white"/>
            </mask>
            <g mask={`url(#mask-${index})`}>
              <rect width="35" height="33" fill={colorObj.bigColor} />
            </g>
          </svg>
          <svg
            width="23"
            height="23"
            viewBox="0 0 28 23"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-58%, -50%)',
            }}
          >
            <mask id={`small-mask-${index}`} maskUnits="userSpaceOnUse" x="0" y="0" width="28" height="23">
              <path d="M8.99724 2.29525C9.37989 2.01516 10.8738 0.96221 13.1275 0.476599C16.9729 -0.352017 20.0668 1.17971 21.1914 1.67968C25.0386 3.38958 26.7561 6.94617 27.2027 9.10064C27.663 11.3215 28.4736 15.1879 23.2868 19.6336C19.0796 23.2398 16.435 22.5281 13.978 22.1984C9.13463 21.5487 5.08135 17.4449 4.46305 11.3235C4.10306 7.75802 6.26882 4.29377 8.99724 2.29525Z" fill="white"/>
            </mask>
            <g mask={`url(#small-mask-${index})`}>
              <rect width="28" height="23" fill={colorObj.smallColor} />
            </g>
          </svg>
        </button>

        ))}
      </div>

        {/* 연필/지우개 토글 버튼 */}

        <div className="expression-tool-selection" style={{ 
          display: 'flex', 
          justifyContent: 'space-around', 
          alignItems: 'center',
          marginLeft: '10px',
          width: 'calc(25%)'}}
          >
          <button
            onClick={() => setExpressionIsErasing(!expressionIsErasing)}
            style={{
              width: '32px',           // 너비 32px
              height: '32px',          // 높이 32px
              borderRadius: '50%',     // 둥근 원 모양
              backgroundColor: '#000', // 배경색 검정
              backgroundImage: `url(${expressionIsErasing ? 'static/stockimages/eraser.png' : 'static/stockimages/pencil.png'})`, // 조건에 따라 배경 이미지 변경
              backgroundPosition: 'center',
              backgroundSize: '70%',
              backgroundRepeat: 'no-repeat',
              boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)', // 그림자 효과
              border: 'none',         // 테두리 없음
              cursor: 'pointer',      // 마우스 커서 변경
            }}
          />

          {/* 적용 버튼 */}
          <div className="apply-button" style={{ 
            display: 'flex', 
            justifyContent: 'center',
            alignItems:'center' 
            }}>
            <button
              onClick={applyExpressionTextureToModel}
              style={{
                width: '32px',           // 너비 32px
                height: '32px',          // 높이 32px
                borderRadius: '50%',     // 둥근 원 모양
                backgroundColor: '#000', // 배경색 검정
                backgroundImage: 'url(static/stockimages/apply.png)', // apply.png 이미지 사용
                backgroundPosition: 'center',
                backgroundSize: '70%',   // 이미지 크기를 50%로 설정
                backgroundRepeat: 'no-repeat',
                boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)', // 그림자 효과
                border: 'none',         // 테두리 없음
                cursor: 'pointer',      // 마우스 커서 변경
              }}
            />
          </div>

        </div>

      </div>

      <div
        style={{
          position: 'relative',
          width: '100%',  // 너비를 원하는 크기로 설정
          height: '280px',  // 고정된 높이
          overflow: 'hidden',  // 초과된 부분을 숨기기
        }}
      >
        {/* 배경 이미지 */}
        <img
          src="static/stockimages/facebackground.png"
          alt="Face Background"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none', // 이미지에 클릭이 되지 않게 설정
            zIndex: 1000,
          }}
        />

        {/* 표정 그리기용 캔버스 */}
        <canvas
          ref={expressionCanvasRef}
          width={400}  // 실제 캔버스의 해상도를 높임
          height={400} // 실제 캔버스의 해상도를 높임
          style={{
            width: '100vw',  // 너비를 원하는 크기로 설정
            height: '400px',  // 고정된 높이
            background: 'transparent', // 배경을 투명하게 설정
            zIndex: 2,  // 캔버스가 이미지 위에 렌더링되도록 설정
            display: 'block',
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
      {activeCategory && activeCategory.assets.map((asset, index) => (
      <div
        className="pictures"
        key={index}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          borderRadius: '18px',
          border: selectedIndices[activeCategory.name] === index ? '3px solid #E9A7A7' : 'none', // 선택된 항목에 경계선 추가
          backgroundColor: selectedIndices[activeCategory.name] === index ? '#FF0000' : 'transparent', // 선택된 항목에 배경색 추가
        }}
        onClick={() => {
          handleAssetSelection(activeCategory.name, index); // 카테고리별 선택된 인덱스 업데이트
          const modelPath = activeCategory.useColor
          ? `/static/models/${activeCategory.name.toLowerCase()}_${index + 1}_${selectedColors[activeCategory.name] || 'Black'}.glb`
          : `/static/models/${activeCategory.name.toLowerCase()}_${index + 1}.glb`;
        
          console.log(modelPath);
          loadModel(modelPath, activeCategory.name, activeCategory.useColor);
        }}
      >
        <img
          src={`/static/assetImages/${
            activeCategory.useColor
              ? `${activeCategory.name.toLowerCase()}_${index + 1}_${selectedColors[activeCategory.name]?.name || 'Black'}`
              : `${activeCategory.name.toLowerCase()}_${index + 1}`
          }.png`}
          alt={`Asset ${index}`}
          style={{
            width:'100%',
            height:'100%',
            borderRadius: '18px',
            boxSizing: 'content-box',
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
                key={color.name}
                onClick={() => selectColor(activeCategory.name, color.name)}
                className="color-button"
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  border: 'none',
                  padding: '0',
                  width: '32px',
                  height: '32px',
                  position: 'relative',
                  boxSizing: 'border-box',
                  background: 'none',
                  filter: 'drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25))',
                }}
              >
                <svg width="32" height="32" viewBox="0 0 35 33" fill="none" xmlns="http://www.w3.org/2000/svg" style={{position: 'absolute', top: 0, left: 0}}>
                  <mask id={`mask-${index}`} maskUnits="userSpaceOnUse" x="0" y="0" width="35" height="33">
                    <path d="M31.732 24.906C31.3723 25.5071 29.9437 27.7978 27.161 29.7447C22.4124 33.067 17.3387 32.7323 15.527 32.6887C9.3294 32.5388 4.97102 28.6501 3.13725 25.9566C1.24676 23.18 -2.05667 18.3511 2.45184 9.31604C6.10884 1.98759 10.1052 1.45598 13.6287 0.508273C20.5745 -1.35954 28.416 1.9484 32.7435 9.97204C35.264 14.6458 34.2974 20.6183 31.732 24.9057V24.906Z" fill="white"/>
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
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-58%, -50%)',
                  }}
                >
                  <mask id={`small-mask-${index}`} maskUnits="userSpaceOnUse" x="0" y="0" width="28" height="23">
                    <path d="M8.99724 2.29525C9.37989 2.01516 10.8738 0.96221 13.1275 0.476599C16.9729 -0.352017 20.0668 1.17971 21.1914 1.67968C25.0386 3.38958 26.7561 6.94617 27.2027 9.10064C27.663 11.3215 28.4736 15.1879 23.2868 19.6336C19.0796 23.2398 16.435 22.5281 13.978 22.1984C9.13463 21.5487 5.08135 17.4449 4.46305 11.3235C4.10306 7.75802 6.26882 4.29377 8.99724 2.29525Z" fill="white"/>
                  </mask>
                  <g mask={`url(#small-mask-${index})`}>
                    <rect width="28" height="23" fill={color.smallCircle} />
                  </g>
                </svg>
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

