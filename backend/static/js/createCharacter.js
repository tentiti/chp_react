//오버레이
document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('overlay');
  
    // setTimeout(() => {
    //   overlay.classList.add('hidden');
    // }, 3000); // 3초 후에 자동으로 사라짐
  
    overlay.addEventListener('click', () => {
      overlay.classList.add('hidden');
    });
  });
  


let scene, camera, renderer, mixer, basicModel, currentHat, controls, clock;
let animationActions = [], activeAction;

init();
animate();

function init() {
  // Scene, Camera, Renderer setup
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x777777);

  camera = new THREE.PerspectiveCamera(75, 393 / 393, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio); // Set pixel ratio for better performance
  renderer.setSize(393, 300);
  document.querySelector("#canvasContainer").appendChild(renderer.domElement);

  // Add lights
  const directionalLight = new THREE.DirectionalLight(0xffffff, 2); // Reduced intensity for performance
  directionalLight.position.set(5, 5, 5).normalize();
  scene.add(directionalLight);

  const ambientLight = new THREE.AmbientLight(0xffffff, 2); // Reduced intensity for performance
  scene.add(ambientLight);

  // Load basic model
  const loader = new THREE.GLTFLoader();
  loader.load('static/models/dance4.glb', function (gltf) {
    basicModel = gltf.scene;  // Access the scene property of the loaded object
    basicModel.position.set(0, 0, 0);

    // Modify materials to be less reflective
    basicModel.traverse(function (child) {
      if (child instanceof THREE.Mesh) {
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
    mixer = new THREE.AnimationMixer(basicModel);
    loadAnimation();
  }, undefined, function (error) {
    console.error('Error loading basic model:', error);
  });

  clock = new THREE.Clock();

  // OrbitControls setup
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.25;
  controls.screenSpacePanning = false;
  controls.maxPolarAngle = Math.PI / 2;

  // Event listeners
  const hat1Button = document.getElementById('hat1Button');
  if (hat1Button) {
    hat1Button.addEventListener('click', () => {
      loadAndApplyHat('static/models/box_profile_metal_sheet_4k.glb');
    });
  }

  const hat2Button = document.getElementById('hat2Button');
  if (hat2Button) {
    hat2Button.addEventListener('click', () => {
      loadAndApplyHat('static/models/danceone.glb');
    });
  }

  const animateButton = document.getElementById('animateButton');
  if (animateButton) {
    animateButton.addEventListener('click', playAnimation);
  }

  const backgroundUpload = document.getElementById('backgroundUpload');
  if (backgroundUpload) {
    backgroundUpload.addEventListener('change', handleBackgroundUpload);
  }

  const saveButton = document.getElementById('saveButton');
  if (saveButton) {
    saveButton.addEventListener('click', startRecording);
  }

  const shirtButton = document.getElementById('shirtButton');
  if (shirtButton) {
    shirtButton.addEventListener('click', () => {
      // Add logic to load and apply shirt
    });
  }

  const pantsButton = document.getElementById('pantsButton');
  if (pantsButton) {
    pantsButton.addEventListener('click', () => {
      // Add logic to load and apply pants
    });
  }

  const shoesButton = document.getElementById('shoesButton');
  if (shoesButton) {
    shoesButton.addEventListener('click', () => {
      // Add logic to load and apply shoes
    });
  }

  camera.position.set(0, -5, 10);
  camera.lookAt(scene.position);

  window.addEventListener('resize', onWindowResize, false);
}

function loadAnimation() {
  const loader = new THREE.FBXLoader();
  loader.load('static/models/new.fbx', function(object) {
    object.animations.forEach((clip) => {
      const action = mixer.clipAction(clip);
      action.clampWhenFinished = true;
      action.loop = THREE.LoopOnce;
      animationActions.push(action);
    });

    if (animationActions.length > 0) {
      activeAction = animationActions[0];
    }
  }, undefined, function(error) {
    console.error('Error loading animation:', error);
  });
}

function playAnimation() {
  if (mixer && activeAction) {
    activeAction.reset().play();
  }
}

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  if (mixer) {
    mixer.update(delta);
  }
  controls.update();
  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = 4 / 2;
  camera.updateProjectionMatrix();
  renderer.setSize(393, 393);
}

function loadAndApplyHat(hatPath) {
  const loader = new THREE.GLTFLoader();
  if (currentHat) {
    currentHat.parent.remove(currentHat);
    currentHat = null;
  }

  loader.load(hatPath, function (gltf) {
    currentHat = gltf.scene;
    currentHat.position.set(0, -5.1, -0.2);

    const headBone = basicModel.getObjectByName('mixamorigHead');
    if (headBone) {
      headBone.add(currentHat);
    } else {
      basicModel.add(currentHat);
    }
  }, undefined, function (error) {
    console.error('Error loading hat model:', error);
  });
}

function handleBackgroundUpload(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const texture = new THREE.TextureLoader().load(e.target.result);
      scene.background = texture;
    };
    reader.readAsDataURL(file);
  }
}

async function startRecording() {
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
      bitsPerSecond: 800000  // Adjusted bitrate
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
  
          // 버튼을 '캐릭터 공유하기'로 변경
          const saveButton = document.getElementById('saveButton');
          if (saveButton) {
            saveButton.textContent = '캐릭터 공유하기';
            saveButton.onclick = async () => {
              // 해시태그 클립보드에 복사
              const hashtag = "#이제댄스타임 #어쩌구저쩌구 @어떤계정멘션";
              const tempInput = document.createElement('textarea');
              tempInput.value = hashtag;
              document.body.appendChild(tempInput);
              tempInput.select();
              tempInput.setSelectionRange(0, 99999); // For mobile devices
              document.execCommand("copy");
              document.body.removeChild(tempInput);
  
            //   alert("해시태그가 클립보드에 복사되었습니다!");
  
              // 클립보드 복사 후 Web Share API 호출
              if (navigator.canShare && navigator.canShare({ files: [file] })) {
                alert("이 비디오를 공유하시겠습니까?");
                try {
                  await navigator.share({
                    files: [file]
                  });
                } catch (error) {
                  if (error.name === 'NotAllowedError') {
                    alert('사용자가 공유 요청을 거부했거나, 현재 환경에서 공유가 허용되지 않습니다.');
                  } else {
                    alert('Error sharing video: ' + error.message);
                  }
                  console.error('Error sharing video:', error);
                }
              } else {
                alert("이 브라우저는 파일 공유를 지원하지 않습니다.");
              }
            };
          }
  
        } catch (error) {
          console.error('Error during upload:', error);
        }
      });
    }, 5000);
  }
  

//얼굴 
function showFaceDrawingCanvas() {
    // asset-grid 숨기기
    const assetGrid = document.querySelector('.asset-grid');
    assetGrid.style.display = 'none';
  
    // 캔버스 생성
    const canvas = document.createElement('canvas');
    canvas.id = 'faceCanvas';
    canvas.width =390;  // asset-grid의 너비에 맞춤
    canvas.height = 205; // asset-grid의 높이에 맞춤
  
    // 캔버스에 스타일 적용
    canvas.style.margin = '0 auto';
    canvas.style.backgroundColor = 'white';
    canvas.style.borderRadius = '10px';
    canvas.style.boxSizing = 'border-box';
    canvas.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.1)';
    canvas.style.position = 'relative';
    canvas.style.zIndex = '1001';
  
    // asset-grid 자리에 캔버스 추가
    assetGrid.parentNode.insertBefore(canvas, assetGrid);
  
    // 기본적인 그리기 기능 추가
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'red';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  
    // 블랙 컬러로 설정
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2; // 선의 두께를 설정 (필요에 따라 조정 가능)
  
    let drawing = false;
  
    // 공통 함수: 시작 지점 설정
    function startDrawing(x, y) {
      drawing = true;
      ctx.beginPath(); // 새로운 경로 시작
      ctx.moveTo(x, y); // 경로 시작점 설정
    }
  
    // 공통 함수: 그림 그리기
    function draw(x, y) {
      if (drawing) {
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }
  
    // 공통 함수: 그리기 종료
    function stopDrawing() {
      drawing = false;
    }
  
    // 마우스 이벤트 처리
    canvas.addEventListener('mousedown', (event) => startDrawing(event.offsetX, event.offsetY));
    canvas.addEventListener('mousemove', (event) => draw(event.offsetX, event.offsetY));
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing); // 캔버스를 벗어나면 그리기 종료
  
    // 터치 이벤트 처리
    canvas.addEventListener('touchstart', (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.touches[0].clientX - rect.left;
      const y = event.touches[0].clientY - rect.top;
      startDrawing(x, y);
    });
  
    canvas.addEventListener('touchmove', (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.touches[0].clientX - rect.left;
      const y = event.touches[0].clientY - rect.top;
      draw(x, y);
      event.preventDefault(); // 터치 스크롤 방지
    });
  
    canvas.addEventListener('touchend', stopDrawing);
  
    // 완료 버튼 생성
    const finishButton = document.createElement('button');
    finishButton.innerText = '완료';
    finishButton.style.display = 'block';
    finishButton.style.margin = '10px auto';
    finishButton.style.zIndex = '1002';
    assetGrid.parentNode.insertBefore(finishButton, assetGrid.nextSibling);
  
    // 완료 버튼 클릭 시 텍스처 적용
    finishButton.addEventListener('click', () => {
      applyCanvasTextureToFace(canvas);
      // 캔버스와 버튼 제거 및 asset-grid 다시 보이게 하기
      canvas.remove();
      finishButton.remove();
      assetGrid.style.display = 'grid';
    });
  }
  

  
  function applyCanvasTextureToFace(canvas) {
    // 캔버스의 내용을 텍스처로 변환
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
  
    // 모델의 얼굴 부분을 찾아 텍스처 적용
    const faceMesh = basicModel.getObjectByName('mixamorigHead'); // 얼굴 부분의 이름이 'mixamorigHead'라고 가정
    if (faceMesh && faceMesh.material) {
      faceMesh.material.map = texture;
      faceMesh.material.needsUpdate = true;
    }
  }
  
  // faceButton 클릭 시 이벤트 리스너 추가
  document.getElementById('faceButton').addEventListener('click', showFaceDrawingCanvas);
  

function logModelStructure(object, indent = '') {
    console.log(indent + object.name + ' (' + object.type + ')');
    object.children.forEach(function(child) {
        logModelStructure(child, indent + '  ');
    });
}

// 모델 로드 후 이 함수를 호출하여 구조를 확인합니다
logModelStructure(basicModel);

//주소창
window.onload = function() {
    setTimeout(function() {
      window.scrollTo({ top: 300, behavior: 'smooth' });
    }, 1000);
  };
