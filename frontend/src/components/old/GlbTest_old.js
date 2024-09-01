import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const GlbTest = () => {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('Loading...');
  const [error, setError] = useState(null);
  const modelsRef = useRef([]);

  const loadModel = useCallback((modelPath, onLoad) => {
    const loader = new GLTFLoader();

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

          // 애니메이션을 즉시 시작하지 않음
          // 애니메이션을 나중에 시작할 수 있도록 멈춘 상태로 둠
          action.paused = true;
        }

        modelsRef.current.push({ model, mixer, action });

        // Adjust camera to fit all models
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

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      sceneRef.current.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(2, 2, 2);
      sceneRef.current.add(directionalLight);

      cameraRef.current.position.z = 5;
    };

    initThreeJS();
    loadModel('/static/models/body__animated_test.glb', () => setLoadingStatus('Loaded Successfully'));

    const animate = () => {
      requestAnimationFrame(animate);

      const delta = clockRef.current.getDelta();
      modelsRef.current.forEach(({ mixer }) => mixer.update(delta));

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [loadModel, updateCameraView]);

  const toggleAnimation = () => {
    const newIsPlaying = !isPlaying;
    setIsPlaying(newIsPlaying);
    modelsRef.current.forEach(({ action }) => {
      if (action) {
        action.paused = !newIsPlaying;
        if (newIsPlaying) {
          action.play();
        } else {
          action.stop();
        }
      }
    });
  };

  const loadAdditionalModel = (modelPath) => {
    loadModel(modelPath, () => {
      setLoadingStatus(`Model ${modelPath} Loaded`);
      updateCameraView();
    });
  };

  return (
    <div>
      <canvas ref={canvasRef} style={{ width: '400px', height: '400px', border: '1px solid black' }} />
      <div style={{ marginTop: '10px' }}>
        <p>Status: {loadingStatus}</p>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
      <button 
        onClick={toggleAnimation}
        disabled={loadingStatus !== 'Loaded Successfully'}
        style={{
          marginTop: '10px',
          padding: '5px 10px',
          fontSize: '14px',
          marginRight: '10px'
        }}
      >
        {isPlaying ? 'Pause Animations' : 'Start Animations'}
      </button>
      <button 
        onClick={() => loadAdditionalModel('/static/models/body__animated_test_top.glb')}
        style={{
          marginTop: '10px',
          padding: '5px 10px',
          fontSize: '14px',
          marginRight: '10px'
        }}
      >
        Load Model 1
      </button>
      <button 
        onClick={() => loadAdditionalModel('/static/models/body__animated_test_bottom.glb')}
        style={{
          marginTop: '10px',
          padding: '5px 10px',
          fontSize: '14px',
          marginRight: '10px'
        }}
      >
        Load Model 2
      </button>
      <button 
        onClick={() => loadAdditionalModel('/static/models/body__animated_test_accessory.glb')}
        style={{
          marginTop: '10px',
          padding: '5px 10px',
          fontSize: '14px'
        }}
      >
        Load Model 3
      </button>
    </div>
  );
};

export default GlbTest;
