import React, { useEffect, useRef } from 'react';
import { useThree } from './ThreeContext';

const GlbViewer = () => {
  const { sceneRef, cameraRef, rendererRef } = useThree();
  const mountRef = useRef(null);

  useEffect(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;

    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      mountRef.current.removeChild(renderer.domElement);
    };
  }, [sceneRef, cameraRef, rendererRef]);

  return <div ref={mountRef} style={{ width: '100vw', height: '100vh' }} />;
};

export default GlbViewer;
