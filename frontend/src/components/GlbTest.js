import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { useNavigate } from 'react-router-dom';
import GIF from 'gif.js';
import './CreateCharacter.css';
import Header from './Header';
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
    { name: 'Black', value: '#000000' },
  ];

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
    const selectedColor = COLORS.find((c) => c.value === color); // 선택된 색상 정보 가져오기
    setSelectedColors((prevColors) => ({
      ...prevColors,
      [categoryName]: selectedColor, // name과 value 모두 저장
    }));
  };
  
  
  const [initialCameraPosition, setInitialCameraPosition] = useState(null);


  //표정 그리기 관련
  const GRAYSCALE_COLORS = ['#F5F1F1', '#F7EFDA', '#F7E2CD', '#B18A82', '#694F4F', '#000000'];

  const [expressionDrawingColor, setExpressionDrawingColor] = useState('#FFFFFF'); // 초기 색상: 검은색
  const [expressionIsErasing, setExpressionIsErasing] = useState(false); // 지우개 여부
  const expressionCanvasRef = useRef(null); // 표정을 그리는 캔버스  

  // 캔버스를 특정 색으로 초기화하는 함수
  const clearCanvasWithColor = (color = '#FFFFFF') => {
    const canvas = expressionCanvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.beginPath();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 5;
    ctx.closePath();
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

      // OrbitControls 초기화
      // controlsRef.current = new OrbitControls(cameraRef.current, rendererRef.current.domElement);
      // controlsRef.current.enableDamping = true; // 부드러운 회전
      // controlsRef.current.dampingFactor = 0.25; // 감속 비율
      // controlsRef.current.enableZoom = true; // 줌 허용

    };

    initThreeJS();
    loadModel('/static/models/plushair.glb', 'Base', false, () => setLoadingStatus('Loaded Successfully'));

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
    console.log('Starting recording for background:', backgroundImageSrc); // 추가된 로그

    const canvas = document.createElement('canvas');
    canvas.width = 393;
    canvas.height = 491;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
  
    const duration = 15; // 15초 동안 녹화
    const fps = 60; // 프레임 속도는 60fps로 설정
    const totalFrames = duration * fps;
    let frameCount = 0;
  
    const backgroundImage = new Image();
    backgroundImage.src = backgroundImageSrc;
  
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
  
    // MP4 녹화 시작
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
        resolve(blob); // Blob을 반환하는 대신 resolve로 반환
      };
  
      mediaRecorder.start(); // MP4 녹화 시작
  
      setTimeout(() => {
        mediaRecorder.stop(); // 15초 후 녹화 중지
      }, duration * 1000);
  
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
          ); // 비율에 맞춰 배경 이미지 그리기
  
          // 모델 렌더링
          hiddenRendererRef.current.render(sceneRef.current, cameraRef.current);
  
          // 캐릭터를 x, y 좌표에 렌더링
          if (hiddenCanvasRef.current) {
            ctx.drawImage(hiddenCanvasRef.current, x, y, width, height);
          } else {
            console.error('hiddenCanvasRef.current is not defined or not a valid canvas element.');
          }
          
  
          frameCount++;
          requestAnimationFrame(captureFrame);
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

    const duration = 5; // 녹화 시간
    const fps = 30; // 초당 프레임
    const totalFrames = duration * fps;
    let frameCount = 0;

    resetAndStartAnimation();

    gif.on('finished', async (blob) => {
      const gifUploadUrl = await uploadGif(blob); // GIF 업로드 처리
      console.log('GIF Upload URL:', gifUploadUrl);

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
        gifUrl: gifUploadUrl,  // Use the returned gif URL directly
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
      console.log('Response status:', response.status);
      
      // If the response is not OK, log more details
      if (!response.ok) {
          const errorText = await response.text();  // Get error message from the response body
          throw new Error(`GIF upload failed: ${response.status} ${response.statusText}. Server response: ${errorText}`);
      }

      const data = await response.json();
      console.log('Upload response:', data);

      const filename = data.filename;
      console.log('GIF Filename:', filename);

      const gifUrl = `/api/uploads/${filename}`;
      console.log('Constructed GIF URL:', gifUrl);

      return gifUrl;

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
  
    // 터치 이벤트일 경우 터치 위치에서 좌표를 얻음, 아니면 마우스 좌표
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
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
      ctx.lineWidth = 20;
      ctx.strokeStyle = expressionDrawingColor;
    } else {
      // 그레이스케일 색상이 4, 5, 6번째일 때는 검정색으로 그리고 굵기는 5
      const grayscaleIndex = GRAYSCALE_COLORS.indexOf(expressionDrawingColor);
      if (grayscaleIndex >= 3 && grayscaleIndex <= 5) {
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#FFFFFF'; // 검정색으로 그리기
      } else {
        // 그 외의 경우 흰색으로 그리고 굵기는 5
        ctx.lineWidth = 5;
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
    const texture = new THREE.CanvasTexture(canvas);
  
    // Y축을 반전시키기 위해 flipY를 false로 설정
    texture.flipY = false;
    texture.needsUpdate = true;
  
    // 모델에 텍스처를 적용하는 로직
    modelsRef.current.forEach(({ model }) => {
      model.traverse((child) => {
        if (child.name === 'metarig') {
          const head = child.getObjectByName('head001');
          if (head) {
            const mesh3 = head;
            if (mesh3) {
              // UV 좌표가 없을 경우 기본 UV 좌표 생성
              if (mesh3.geometry && mesh3.geometry.attributes) {
                if (!mesh3.geometry.attributes.uv) {
                  const geometry = mesh3.geometry;
                  const uv = new Float32Array(geometry.attributes.position.count * 2);
  
                  // UV 좌표 생성 로직 (y축 반전 적용)
                  for (let i = 0; i < uv.length; i += 2) {
                    uv[i] = (i / 2) % 2;
                    uv[i + 1] = Math.floor((i / 2) / 2); // 반전된 y좌표
                  }
  
                  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
                  geometry.attributes.uv.needsUpdate = true;
                }
  
                // 텍스처 적용
                if (!mesh3.material) {
                  mesh3.material = new THREE.MeshBasicMaterial();
                }
  
                mesh3.material.map = texture;
                mesh3.material.needsUpdate = true;
              } else {
                console.warn("Geometry or geometry attributes are undefined for mesh3.");
              }
            }
          }
        }
      });
    });
  };

  

useEffect(() => {
  const canvas = expressionCanvasRef.current;

  if (canvas) {
    clearCanvasWithColor('#FFFFFF');  // 기본 흰색 배경 설정
    
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
    ctx.fillStyle = '#FFFFFF'; // 흰색으로 설정
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

    
    
  

  return (
    <div>
    <div style={{ overflow: 'auto' }} id="whatareYou?">
      {overlayVisible && (
        <div id="overlay" className="overlay">
          <div className="overlay-content">
            <img
              src="../static/stockimages/make_invitation.png"
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
            width: '100vw', 
            height: '100vh', 
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
        <img src="/static/stockimages/making.png" alt="Splash" style={{ position: 'Fixed', width: '100vw', height: '100vh', objectFit: 'cover', zIndex: '999999999' }} />
        <img src="/static/stockimages/loading-circle.gif" alt="Splash" style={{ width: '80px', position: 'Fixed', left:'calc(50vw - 36px)', top:'55vh',zIndex: '999999999' }} />
      </div>
        )}

    <div id="container" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 58px)', overflowX: 'hidden' }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100vw',
          height: '70vh',
          backgroundImage: 'url("/static/stockimages/paper.png")'
        }}
      />
      <canvas ref={hiddenCanvasRef} style={{ display: 'none' }} />

      <div className="controls" style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column-reverse' }}>
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
      <div className={`asset-grid ${selectedCategory === 'EXPRESSION' ? 'expanded' : ''}`} style={{ }}>
      {selectedCategory === 'EXPRESSION' ? (
        <>
      {/* 버튼과 캔버스를 가로로 배치하는 컨테이너 */}
      <div style={{ position:'sticky', display: 'flex', flexDirection:'row', justifyContent: 'space-around', alignItems: 'center', zIndex: '999999'}}>

      {/* 색상 선택 버튼 */}
      <div className="expression-color-selection" style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '10px', width:'75%' }}>
        {GRAYSCALE_COLORS.map((color, index) => (
          <button
            key={index}
            onClick={() => {
              setExpressionDrawingColor(color);
              clearCanvasWithColor(color);
            }}
            className="color-button"
            style={{
              display: 'flex',
              pointerEvents: 'auto',
              justifyContent: 'center',
              alignItems: 'center',
              border: 'none',
              background: 'none',
              padding: '0', // 버튼 내 기본 패딩 제거
              width: '40px', // 버튼의 크기를 원의 크기에 맞춤
              height: '40px',
              borderRadius: '50%', // 버튼 자체를 원형으로 만듦
              boxSizing: 'border-box', // 패딩과 크기 계산을 일관되게 처리
            }}
          >
            <div
              className="big-circle"
              style={{
                backgroundColor: color,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <div
                className="small-circle"
                style={{
                  backgroundColor: color
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
    </div>


    {/* 적용 버튼 */}
    <div className="apply-button" style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
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

      {/* 그리기 캔버스 */}
      <div
  style={{
    position: 'relative',
    width: 'calc(100vw - 30px)',  // 너비를 원하는 크기로 설정
    height: '190px',  // 고정된 높이
    overflow: 'hidden',  // 초과된 부분을 숨기기
  }}
>
  <canvas
    ref={expressionCanvasRef}
    style={{
      width: '100%',  // 부모 요소의 가로 너비에 맞춤
      height: '100%',  // 부모 요소의 세로 높이에 맞춤
      aspectRatio: '1 / 1',  // 정사각형 비율 유지
      display: 'block',  // 블록 요소로 설정하여 크기 제어
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
          onClick={() => {
            const modelPath = activeCategory.useColor
            ? `/static/models/${activeCategory.name.toLowerCase()}_${index + 1}_${selectedColors[activeCategory.name]?.name || 'Black'}.glb`
            : `/static/models/${activeCategory.name.toLowerCase()}_${index + 1}.glb`;
          
            console.log(modelPath);
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
                // console.log(color.value);
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
</div>

        );
      };

export default CreateCharacter;

