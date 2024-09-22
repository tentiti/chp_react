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

  const [isHeadTextureApplied, setIsHeadTextureApplied] = useState(false);

  // 머리 텍스처가 적용되었는지 확인하는 함수
  const checkHeadTexture = () => {
    if (!sceneRef.current) return;

    let headMesh = null;

    // scene을 순회하면서 head_1이라는 이름의 메쉬를 찾음
    sceneRef.current.traverse((object) => {
      if (object.isMesh && object.name === 'head_1') {
        headMesh = object;
      }
    });

    // head_1이 존재하고, 해당 메쉬에 텍스처가 적용되었는지 확인
    if (headMesh && headMesh.material && headMesh.material.map) {
      console.log('head_1 텍스처가 적용됨:', headMesh.material.map);
      setIsHeadTextureApplied(true); // 텍스처가 적용되었으면 true로 설정
    } else {
      console.log('head_1 텍스처가 없음');
      setIsHeadTextureApplied(false); // 텍스처가 없으면 false로 설정
    }
  };



  //애니메이션 관련
  const clock = new THREE.Clock();  // Define the clock instance here

  //타이밍 관련
  const [isReadyToRecord, setIsReadyToRecord] = useState(false);

  const resetAndPlayAnimations = () => {
    if (!sceneRef.current) return;
  
    sceneRef.current.traverse((object) => {
      if (object.userData && object.userData.animationMixer) {
        const mixer = object.userData.animationMixer;
  
        // 모든 액션을 멈추고 초기화한 후 재생
        mixer.stopAllAction();
  
        mixer._actions.forEach((action) => {
          action.reset();  // 애니메이션의 시작 상태로 되돌림
          action.setLoop(THREE.LoopOnce);  // 애니메이션을 한 번만 실행하도록 설정
          action.clampWhenFinished = true;  // 애니메이션 종료 후 마지막 프레임 유지
          action.play();  // 애니메이션 재생
        });

        mixer.setTime(0);
      }
    });

    // sceneRef.current.traverse((child) => {
    //   if (child.material && child.material.map) {
    //     child.material.map.needsUpdate = true;
    //   }
    // });

    clock.start();
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

    // alert('audioContextRef.current');
    // audioRef.current.play().catch((err) => {
    //   console.error('Audio playback failed:', err);
    // });
  
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
        width: 1280, // 해상도 설정 가능
        height: 720,
        frameRate: 30 // iPhone에서 호환되는 프레임 레이트
      },
    });


    resetAndPlayAnimations();  // 애니메이션을 리셋하고 재생

    recorder.startRecording();
    recorderRef.current = recorder;
  
    setTimeout(() => {
      // alert('Attempting to stop recording');
      stopRecording();
    }, 1750);  // 3.75초 후 녹화 종료 시도
  };
  
  const stopRecording = () => {
    if (!recorderRef.current) {
      console.warn('Recorder reference is not set');
      return;
    }
  
    // alert('stopRecording');
    recorderRef.current.stopRecording(() => {
      const blob = recorderRef.current.getBlob();
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
      setIsRecording(false); // 녹화 상태 해제
      setIsRecordingDone(true); // 녹화 완료 상태 설정
    });

    audioRef.current.play();
    // resetAndPlayAnimations();
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
        // alert(
        //   '해시태그와 언급이 복사되었습니다. 함께 업로드 해주세요!\n아이폰이 아닐 경우 곧바로 공유가 어려울 수 있습니다. 필수 해시태그는 복사되었으니 함께 직접 업로드 해주세요.'
        // );

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

      rendererRef.current = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true, antialias: false,  powerPreference: "high-performance"  });
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

      // sceneRef.current.traverse((child) => {
      //   if (child.material && child.material.map) {
      //     child.material.map.needsUpdate = true;
      //   }
      // });

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

        const delta = clock.getDelta();  // 경과된 시간

        // scene 내의 모든 애니메이션 업데이트
        sceneRef.current.traverse((object) => {
          // if (object.material && object.material.map) {
          //   object.material.map.needsUpdate = true;  // 텍스처 갱신 강제
          // }
          if (object.userData && object.userData.animationMixer) {
            object.userData.animationMixer.update(delta);
          }
        })

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

  useEffect(() => {
    const handleUnload = () => {
      // 메모리 해제 로직
      // if (animationFrameRef.current) {
      //   cancelAnimationFrame(animationFrameRef.current);
      // }
  
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
    if (postcard) {
      // Prepare audio and check if it's ready to play
      audioRef.current.load();
      audioRef.current.oncanplaythrough = () => {
        setIsReadyToRecord(true);
      };
    }
  }, [postcard]);

  useEffect(() => {
    if (isReadyToRecord) {
      startRecording();
    }
  }, [isReadyToRecord]);

  useEffect(() => {
    let animationInterval;
  
    if (isRecordingDone) {
      console.log('Recording is done, starting animation loop every 8.75 seconds.');
  
      const runAnimation = () => {
        console.log('Resetting and playing animations.');
        resetAndPlayAnimations();
      };

      runAnimation(); // Immediately trigger it once after recording is done
  
      animationInterval = setInterval(runAnimation, 8750); // Replay every 8.75 seconds
    }
  
    return () => {
      if (animationInterval) {
        console.log('Clearing animation interval.');
        clearInterval(animationInterval);
      }
    };
  }, [isRecordingDone]);
  
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

export default  React.memo(Credit);