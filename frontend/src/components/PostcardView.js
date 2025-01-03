import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import RecordRTC from 'recordrtc';
//import Credit from './Credit';
import { useScene } from './SceneContext';
import './PostcardView.css';
import Invitation from './Invitation';

//파일 금쪽이
// import { FFmpeg } from '@ffmpeg/ffmpeg';
// import { fetchFile } from '@ffmpeg/util';

const RECORDING_DURATION_MS = 18750; // 녹화 시간 상수

// 안드로이드 기기 확인 함수
const isAndroidDevice = () => /Android/i.test(navigator.userAgent);
// const isAndroidDevice = () => true;

/***
 * three.js 시작 및 세팅 관련 함수
 ***/
function preloadImage(src)
{
  return new Promise( (resolve)=>{
    const img = new Image();
    img.src = src;
    img.onload = resolve;
    img.onerror = (error) => {
      console.error('Error loading image:', error);
      resolve(); // 에러 발생 시에도 callback 호출하여 진행
    };
  } )
}

async function fetchPostcard(id)
{
  try {
    const response = await axios.get(`/api/postcard/${id}`, { cache: 'no-cache' });
    if(response.status === 200) return response.data;
    throw new Error(`Error fetching postcard : ${response.status}`);
  }
  catch(e) {
    throw new Error(`Error fetching postcard : ${e}`);
  }
}

function addLightToScene(scene)
{
  const ambientLight1 = new THREE.AmbientLight(0xffffff, 1.0);
  scene.add(ambientLight1);

  const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1.0);
  directionalLight2.position.set(2, 2, 2);
  scene.add(directionalLight2);

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
  scene.add(ambientLight);
}

function addModelToScene(scene, mixer)
{
  const addedCategories = new Set();
  mixer.current.forEach((modelData) => {
    const { model, mixer, action, categoryName } = modelData;
    if (addedCategories.has(categoryName)) return;
    addedCategories.add(categoryName);

    if (model instanceof THREE.Object3D) {
      if (!model.name) model.name = `model_${categoryName}`;
      model.traverse((child) => {
        if (child.isMesh && child.material.map) {
          child.material.needsUpdate = true;
        }
      });
      scene.add(model);
      console.log(`Added model: ${model.name}`);
    }

    if (mixer && action) {
      action.reset();
      action.stop();
      mixer.update(0);
    }
  });
}

const modelPositionConfigs = {
  1: { xOffset: -2, yOffset: -2.0, zOffset:2, scaleFactor: 0.95 },  
  2: { xOffset: 1.5, yOffset: -0.2, zOffset: 2, scaleFactor: 0.95 },  
  3: { xOffset: 2.8, yOffset: 1.5, zOffset: 2, scaleFactor: 0.95 },  
  default: { xOffset: 1, yOffset: 1, zOffset: 1, scaleFactor: 0.95 }, 
};
function moveAndScaleModels(target, {xOffset=0, yOffset=0, zOffset=0, scaleFactor=1}={})
{
  target.forEach((object) => {
    if (!(object.isMesh || object.isGroup) || object.name.startsWith('text_')) return;
    object.position.set(xOffset, yOffset, zOffset);
    object.scale.setScalar(scaleFactor);
  });
}

function initRenderer(canvas)
{
  const width = 720;
  const height = 1280;
  const renderer = new THREE.WebGLRenderer({ 
    canvas, 
    alpha: true, 
    antialias: true,  
    powerPreference: "high-performance",
    preserveDrawingBuffer: true,
  });

  renderer.setSize(width, height);
  renderer.setClearColor(0x000000, 0);
  renderer.autoClear = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  return renderer;
}

function initCamera()
{
  const frustumSize = 40;
  const camera = new THREE.OrthographicCamera(
    (frustumSize * 720) / 1280 / -2,
    (frustumSize * 720) / 1280 / 2,
    frustumSize / 2,
    frustumSize / -2,
    0.1,
    20
  );
  camera.position.set(0, 0, 11);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
  return camera;
}

function makeBackgroundMesh(bgUrl, renderer)
{
  const frustumSize = 40;
  const loader = new THREE.TextureLoader();
  return new Promise( (resolve)=>{
    loader.load(bgUrl, (bgTexture) => {
      bgTexture.colorSpace = THREE.SRGBColorSpace;
      bgTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
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

      resolve(bgMesh);
    });
  } );
}

function makeText(text, x, y, size = 50, breakLine=false)
{
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = 1024;
  canvas.height = 512;

  const fontSize = size * 0.375;
  ctx.font = `bold ${fontSize*1}px Cafe24Simplehae`;
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
  return mesh;
}

function useThree()
{
  const { sceneData } = useScene();
  const mixer = sceneData.mixer;
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const animateRef = useRef(null);

  const initThree = useCallback(
    (imageUrl, postcard, canvasRef)=>{
      // initialize three scene
      sceneRef.current = new THREE.Scene();
      addLightToScene(sceneRef.current);
      if(Array.isArray(mixer.current) && mixer.current.length > 0) addModelToScene(sceneRef.current, mixer);
      moveAndScaleModels(sceneRef.current.children, modelPositionConfigs[postcard?.number] || modelPositionConfigs.default)
      rendererRef.current = initRenderer(canvasRef.current);
      const camera = initCamera();
      sceneRef.current.add(camera);
      makeBackgroundMesh(`/static/stockimages/postcardfinal_${postcard?.number}.webp`, rendererRef.current).then( bg=>sceneRef.current.add(bg) );
      const commentMesh = makeText(postcard.comment, 0, -12.2, 94, true);
      const timestampMesh = makeText(postcard.timestamp, 0, -14, 60);
      const nameMesh = makeText(postcard.name, 6, -15.8, 80);
      sceneRef.current.add(commentMesh, timestampMesh, nameMesh);

      let prevTimestamp = Date.now();
      function animate(timestamp)
      {
        const frameDuration = (timestamp - prevTimestamp) / 1500;
        animateRef.current = requestAnimationFrame(animate);
        mixer.current.forEach(({ mixer }) => mixer.update(frameDuration));
        rendererRef.current.render(sceneRef.current, camera);
        prevTimestamp = timestamp;
      }
      animate();
    }
  , [mixer]);

  const disposeThree = useCallback(() => {
    cancelAnimationFrame(animateRef.current);
  
    // sceneRef가 있는지 확인
    if (sceneRef.current) {
      sceneRef.current.traverse((object) => {
        // object.geometry가 있는지 확인 후 dispose 호출
        if (object.geometry) {
          object.geometry.dispose();
        }
  
        // object.material이 있는지 확인 후 map 및 material dispose 호출
        if (object.material) {
          if (object.material.map) {
            object.material.map.dispose();
          }
          object.material.dispose();
        }
      });
    }
  
    // rendererRef가 있는지 확인 후 dispose 호출
    if (rendererRef.current) {
      rendererRef.current.dispose();
    }
  }, []);
  

  return {initThree, disposeThree};
}

function usePreload(canvasRef)
{
  const { id } = useParams();
  const [postcard, setPostcard] = useState(null);
  const {initThree, disposeThree} = useThree();
  useEffect( ()=>{
    let shouldLoad = true;
    (async ()=>{
      const postcardData = await fetchPostcard(id);

      if(!shouldLoad) return;
      const imageUrl = `/static/stockimages/postcardfinal_${postcardData?.number}.webp`;
      setPostcard(postcardData);
      await preloadImage(imageUrl);

      if(!shouldLoad) return;
      initThree(imageUrl, postcardData, canvasRef);
    })();
    return ()=>{
      shouldLoad = false;
      disposeThree();
    };
  }, [id, initThree, disposeThree, canvasRef] );
  return postcard;
}

/***
 * record 관련 함수
 ***/
function initializeAudio(audio)
{
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const audioSource = audioContext.createMediaElementSource(audio);
  const destination = audioContext.createMediaStreamDestination();
  audioSource.connect(destination);
  audioSource.connect(audioContext.destination); 

  return [audioContext, destination.stream];
}

function initializeCanvasStream(canvasElement)
{
  if (!canvasElement.captureStream) {
    console.warn('captureStream is not supported in this browser.');
    return null;
  }
  return canvasElement.captureStream(30);
}

function initializeRecorder(combinedStream){
  const recorder = new RecordRTC(combinedStream, {
    type: 'video',
    mimeType: 'video/mp4',
    video: {
      width: 1280,     // 해상도 설정: 너비 1280
      height: 720,     // 해상도 설정: 높이 720
    },
    bitsPerSecond: 2500000,  // 비트레이트를 2.5Mbps로 설정
  });
  recorder.onError = (error) => {
    console.error('Recording error:', error);
  };
  return recorder;
};

function useAnimationPlay()
{
  const { sceneData } = useScene();
  const mixer = sceneData.mixer;

  function resetAndPlayAnimations()
  {
    if(!mixer.current) return;
    mixer.current.forEach((modelData) => {
      const { action } = modelData;
      action.setLoop(THREE.LoopOnce);  // 애니메이션을 한 번만 재생
      action.clampWhenFinished = true; // 애니메이션이 끝난 후 멈추도록 설정
      action.reset();                  // 애니메이션을 처음부터 시작
      action.setEffectiveTimeScale(0.64);  // 애니메이션 속도를 0.8배로 설정
      action.play();                   // 애니메이션 실행
    });
  }
  return resetAndPlayAnimations;
}

function useRecord(canvasRef, isReadyToRecord = true)
{
  const audioRef = useRef(null);
  const recorderRef = useRef(null);
  const timeoutRef = useRef(null);

  const [audioContext, setAudioContext] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingDone, setIsRecordingDone] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState(null);

  const resetAndPlayAnimations = useAnimationPlay();
  
  function startRecording()
  {
    if(!isReadyToRecord) return;

    setIsRecording(true);
    let [_tempAudioContext, destinationStream] = initializeAudio(audioRef.current);
    setAudioContext(_tempAudioContext);

    resetAndPlayAnimations(); // 애니메이션 리셋 및 재생

    const canvasStream = initializeCanvasStream(canvasRef.current);
    if(canvasStream === null) {
      setIsRecording(false);
      return;
    }
    const combinedStream = new MediaStream([
      ...canvasStream.getTracks(),
      ...destinationStream.getTracks(),
    ]);
  
    // 레코더 초기화 및 녹화 시작
    const recorder = initializeRecorder(combinedStream);
    recorder.startRecording();
    recorderRef.current = recorder;
  
    audioRef.current.play(); // 오디오 재생
  
    // 일정 시간 후 녹화 중지
    timeoutRef.current = setTimeout(stopRecording, RECORDING_DURATION_MS);
  }
  function stopRecording()
  {
    if (!recorderRef.current) {
      console.warn('Recorder reference is not set');
      return;
    }
  
    recorderRef.current.stopRecording(async () => {
      const blob = recorderRef.current.getBlob();
      setRecordingBlob(blob);
      setIsRecording(false);
      setIsRecordingDone(true);
      if (recorderRef.current) {
        recorderRef.current.destroy();
      }
      
    });
  }

  useEffect( ()=>{
    return ()=>{
      if(audioContext === null) return;
      if(audioContext.state !== "closed") audioContext.close();
    }
  }, [audioContext] );

  useEffect( ()=>{
    return ()=>{
      clearTimeout(timeoutRef.current);
    }
  }, [] );

  return {audioRef, startRecording, stopRecording, isRecording, isRecordingDone, recordingBlob};
}

const PostcardView = ({isFixedSize}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const postcard = usePreload(canvasRef);
  const [ isReadyToRecord, setIsReadyToRecord ] = useState(true);
  const { audioRef, startRecording, isRecording, isRecordingDone, recordingBlob } = useRecord(canvasRef, isReadyToRecord);
  const resetAndPlayAnimations = useAnimationPlay();
  const [ hasShared, setHasShared ] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();

  const [isInvitationVisible, setIsInvitationVisible] = useState(false);
  const handleMenuClick = () => setIsInvitationVisible(true);
  const handleBackClick = () => setIsInvitationVisible(false);
  
  // 변환된 Mp4 파일 url
  const [isDownloadReady, setIsDownloadReady] = useState(false); // 다운로드 버튼 활성화 상태
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null); // 업로드된 파일 URL 저장

  const uploadVideoToServer = async (videoBlob) => {
    
    if (!isAndroidDevice()) {
      setIsDownloadReady(true); // 업로드 완료 후 버튼 활성화
      return; 
    }
 
    if (uploadedFileUrl) return;
    try {
      const formData = new FormData();
      formData.append('file', videoBlob, 'video.mp4');
  
      const response = await axios.post('/api/upload-video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
  
      if (response.status === 200) {
        const { file_url } = response.data;
        console.log(`동영상이 성공적으로 업로드 및 변환되었습니다! 다운로드 링크: ${file_url}`);
        setUploadedFileUrl(file_url); // 업로드된 URL 상태에 저장
        setIsDownloadReady(true); // 업로드 완료 후 버튼 활성화
    
        return file_url;
      }
    } catch (error) {
      console.error('동영상 업로드 중 오류 발생:', error);
    }
  };

  // 다운로드 및 공유 버튼에서 업로드된 파일 URL 또는 로컬 recordingBlob을 사용
  const downloadVideo = async() => {
    if (uploadedFileUrl) {
      console.log('변환된 영상을 가져옵니다...');
      try {
        console.log(uploadedFileUrl);
        const response = await axios.get(uploadedFileUrl, { responseType: 'blob' });
        const blob = response.data; // Blob 데이터는 response.data에 저장됨
        const blobUrl = URL.createObjectURL(blob);
        const extension = recordingBlob.type === 'video/mp4' ? 'mp4' : 'webm';

        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `${postcard?.name}의 춤사위_변환.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    
        URL.revokeObjectURL(blobUrl); // 사용 후 메모리에서 해제
      } catch (error) {
        console.error('파일 다운로드 오류:', error);
      }
    }
     else if (recordingBlob) {
      // 다른 기기에서는 로컬 recordingBlob 사용
      const a = document.createElement('a');
      const blobUrl = URL.createObjectURL(recordingBlob);
      a.href = blobUrl;
      a.download = `${postcard?.name}의 춤사위.mp4`;
      a.click();
      URL.revokeObjectURL(blobUrl);
    }
  };

  const shareVideo = async (alertNeeded = true) => {
    if (hasShared || (!uploadedFileUrl && isAndroidDevice()) || (!recordingBlob && !isAndroidDevice())) return;
    setHasShared(true);
  
    if (alertNeeded) {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText('@k.imhwasoon @kkot.pida.gallery');
        console.log('Text copied to clipboard');
      }
    }
  
    try {
      // 안드로이드 기기에서 업로드된 파일을 다운로드하여 Blob으로 변환
      if (uploadedFileUrl) {
        const response = await axios.get(uploadedFileUrl, { responseType: 'blob' });
        const blob = response.data; // Blob 데이터는 response.data에 저장됨\
  
        const file = new File([blob], `${postcard?.name}의 춤사위_변환.mp4`, { type: 'video/mp4' });
  
        // 파일을 공유할 수 있는지 확인 후 공유
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'My Animation',
            text: 'Check out this animation I created!',
          });
          console.log('Video shared successfully');
        } else {
          alert('이 장치에서는 파일 공유가 지원되지 않습니다. 다운로드하여 수동으로 공유해 주세요.');
        }
      } else if (recordingBlob) {
        // 다른 기기에서는 로컬 recordingBlob을 사용하여 공유
        const file = new File([recordingBlob], `${postcard?.name}의 춤사위.mp4`, { type: 'video/mp4' });
  
        alert('해시태그가 복사되었습니다. 인스타그램 공유 (불가시 저장 후 수동 공유)시 텍스트를 붙여 넣어 주세요!');
  
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'My Animation',
            text: 'Check out this animation I created!',
          });
          console.log('Video shared successfully');
        } else {
          console.error('Sharing not supported on this device for files');
        }
      }
    } catch (error) {
      console.error('Error sharing video:', error);
    } finally {
      setHasShared(false); // 상태 초기화
    }
  };
  

  useEffect(() => {
    if (isRecordingDone) {
      resetAndPlayAnimations();
      const animationInterval = setInterval(() => {
        resetAndPlayAnimations();
      }, 18750); 
      uploadVideoToServer(recordingBlob); // 업로드 호출
      
      return () => clearInterval(animationInterval);
    }
  }, [isRecordingDone, resetAndPlayAnimations]);

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
    transform: isFixedSize? `translate(0, -25.8%) scale(${
      containerRef.current ? 
      Math.min(containerRef.current.clientWidth / 720, containerRef.current.clientHeight / 1280) : 1
    })` : `translate(0, -38px) scale(${
      containerRef.current ? 
      Math.min(window.innerWidth / 720, (window.innerHeight - 78) / 1280) : 1
    })`,
    transformOrigin: isFixedSize? 'center center': 'top center',
  };

  const recordReady = () => {
    if(!isReadyToRecord) return;
    startRecording();
  };

  const downloadOrShareVideo = () => {
    // User Agent를 사용하여 iOS 장치인지 확인
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  
    if (isIOS) {
      // iOS에서는 공유 기능 호출
      alert('비디오 저장 버튼을 누르면 사진첩에 춤사위가 저장됩니다.');
      shareVideo(false);
    } else {
      // 그 외 장치에서는 비디오 다운로드
      downloadVideo();
    }
  };

  return (
    <div style={{ 
      backgroundImage: `url('/static/stockimages/background_paper.webp')`, 
      backgroundSize: 'contain',
      width: '100vw', 
      height: '100%', 
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

      <audio ref={audioRef} src="/static/test.mp3" loop ></audio>

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
          left: '0',
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
          <button className="upbutton" onClick={recordReady} disabled={!isReadyToRecord || isRecordingDone}>
            춤사위 만들기
          </button>

          {/* 두 번째 버튼: 특정 페이지로 이동 */}
          <button className="upbutton" onClick={() => window.location.href = `/postcardsafeview/${id}`}>
            춤사위가 보이지 않나요? <br></br>수동 녹화하기
          </button>
        </>
      )}

      {(isRecording || isRecordingDone) && !isDownloadReady && (
           <button className="upbutton" disabled={true} >
                  영상 준비 중..
          </button>
      )}

      { isDownloadReady && (
        <>
          <button className="upbutton" onClick={downloadOrShareVideo} disabled={!isDownloadReady}>
            저장하기
          </button>
          <button className="upbutton" onClick={shareVideo} disabled={!isDownloadReady}>
           인스타그램 공유하기
          </button>
        </>
      )}

      </div>
    </div>
  );

};

export default PostcardView;
