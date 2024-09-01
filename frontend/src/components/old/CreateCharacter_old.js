import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import RecordRTC from 'recordrtc';

import './CreateCharacter.css';  // Assuming you saved your CSS in this file

const CreateCharacter = () => {
  const [overlayVisible, setOverlayVisible] = useState(true);
  const canvasContainerRef = useRef(null);
  const overlayRef = useRef(null);

  // Three.js related variables
  let scene, camera, renderer, mixer, basicModel, currentHat, controls, clock;
  let animationActions = [], activeAction;

  useEffect(() => {
    init();
    animate();

    const overlayElement = overlayRef.current;
    if (overlayElement) {
      overlayElement.addEventListener('click', () => {
        setOverlayVisible(false);
      });
    }

    return () => {
      if (overlayElement) {
        overlayElement.removeEventListener('click', () => {
          setOverlayVisible(false);
        });
      }
    };
  }, []);

  const init = () => {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x777777);
  
    // 카메라 위치를 조정
    camera = new THREE.PerspectiveCamera(75, 393 / 800, 0.1, 1000);
    camera.position.set(0, 2, 5); // 카메라 위치를 뒤로 이동
  
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(393, 800);
    canvasContainerRef.current.appendChild(renderer.domElement);
  
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(5, 5, 5).normalize();
    scene.add(directionalLight);
  
    const ambientLight = new THREE.AmbientLight(0xffffff, 4);
    scene.add(ambientLight);
  
    const loader = new GLTFLoader();
    loader.load('/static/models/danceone.glb', (gltf) => {
      basicModel = gltf.scene;
      basicModel.position.set(0, 0, 0);
    
      // 모델의 재질 설정
      basicModel.traverse((child) => {
        if (child.isMesh) {
          if (child.material) {
            child.material.shininess = 0;
            child.material.reflectivity = 0.1;
            child.material.metalness = 0;
            child.material.roughness = 1;
            child.material.needsUpdate = true;
          }
        }
      });
    
      scene.add(basicModel);
    
      // 카메라가 모델을 바라보도록 설정
      const boundingBox = new THREE.Box3().setFromObject(basicModel);
      const center = boundingBox.getCenter(new THREE.Vector3());
      camera.lookAt(center);
    }, undefined, (error) => {
      console.error('Error loading basic model:', error);
    });
    
  
    clock = new THREE.Clock();
  
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI / 2;
  
    window.addEventListener('resize', onWindowResize, false);
  };
  

  const loadAnimation = () => {
    const loader = new FBXLoader();
    loader.load('/static/models/new.fbx', (object) => {
      object.animations.forEach((clip) => {
        const action = mixer.clipAction(clip);
        action.clampWhenFinished = true;
        action.loop = THREE.LoopOnce;
        animationActions.push(action);
      });

      if (animationActions.length > 0) {
        activeAction = animationActions[0];
      }
    }, undefined, (error) => {
      console.error('Error loading animation:', error);
    });
  };

  const playAnimation = () => {
    if (mixer && activeAction) {
      activeAction.reset().play();
    }
  };

  const animate = () => {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    if (mixer) {
      mixer.update(delta);
    }
    controls.update();
    renderer.render(scene, camera);
  };

  const onWindowResize = () => {
    camera.aspect = 1 / 1;
    camera.updateProjectionMatrix();
    renderer.setSize(393, 393);
  };

  const loadAndApplyHat = (hatPath) => {
    const loader = new GLTFLoader();
    if (currentHat) {
      currentHat.parent.remove(currentHat);
      currentHat = null;
    }

    loader.load(hatPath, (gltf) => {
      currentHat = gltf.scene;
      currentHat.position.set(0, -5.1, -0.2);

      const headBone = basicModel.getObjectByName('mixamorigHead');
      if (headBone) {
        headBone.add(currentHat);
      } else {
        basicModel.add(currentHat);
      }
    }, undefined, (error) => {
      console.error('Error loading hat model:', error);
    });
  };

  const startRecording = async () => {
    const canvas = renderer.domElement;
    let recorder;

    if (!canvas.captureStream && !canvas.mozCaptureStream) {
      console.error('Canvas capture is not supported on this browser.');
      return;
    }

    renderer.setSize(360, 640);

    const stream = canvas.captureStream ? canvas.captureStream(30) : canvas.mozCaptureStream(30);
    recorder = new RecordRTC(stream, {
      type: 'video',
      mimeType: 'video/mp4',
      bitsPerSecond: 800000  
    });

    recorder.startRecording();
    playAnimation();

    setTimeout(async () => {
      recorder.stopRecording(async function () {
        let blob = recorder.getBlob();
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
    }, 5000);
  };

  const handleBackgroundUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const texture = new THREE.TextureLoader().load(e.target.result);
        scene.background = texture;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div style={{ overflow: 'auto' }}>
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
                ‘우리’들의 댄스타임에 초대합니다!<br />
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

      <div id="container" style={{ display: 'flex', flexDirection: 'column', marginTop: '58px' , height:'100vh'}}>
      <div id="canvasContainer" ref={canvasContainerRef} style={{ zIndex: 10, position: 'fixed' }}></div>


        <div className="controls">
          <div className="color-selection">
            <button style={{ backgroundColor: '#ff0000' }}></button>
            <button style={{ backgroundColor: '#00ff00' }}></button>
            <button style={{ backgroundColor: '#0000ff' }}></button>
            <button style={{ backgroundColor: '#ffff00' }}></button>
            <button style={{ backgroundColor: '#ff00ff' }}></button>
            <button style={{ backgroundColor: '#00ffff' }}></button>
            <button style={{ backgroundColor: '#ff9900' }}></button>
            <button style={{ backgroundColor: '#99ff00' }}></button>
          </div>

          <div className="asset-grid">
            <img src="https://placehold.co/200x200" alt="Asset 1" />
            <img src="https://placehold.co/200x200" alt="Asset 1" />
            <img src="https://placehold.co/200x200" alt="Asset 1" />
            <img src="https://placehold.co/200x200" alt="Asset 1" />
            <img src="https://placehold.co/200x200" alt="Asset 1" />
            <img src="https://placehold.co/200x200" alt="Asset 1" />
            <img src="https://placehold.co/200x200" alt="Asset 1" />
            <img src="https://placehold.co/200x200" alt="Asset 1" />
            <img src="https://placehold.co/200x200" alt="Asset 1" />
            <img src="https://placehold.co/200x200" alt="Asset 1" />
          </div>

          <div id="bottombuttons">
            <div className="category-selection">
              <button onClick={() => loadAndApplyHat('static/models/box_profile_metal_sheet_4k.glb')}>hat1</button>
              <button onClick={() => loadAndApplyHat('static/models/danceone.glb')}>shat2</button>
              <button onClick={playAnimation}>animate</button>
              <button>dd</button>
              <button>소품</button>
              <button>얼굴</button>
            </div>

            <button className="create-character" id="saveButton" onClick={startRecording}>
              캐릭터 생성하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCharacter;
