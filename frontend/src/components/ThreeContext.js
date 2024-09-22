import React, { createContext, useContext, useRef } from 'react';
import * as THREE from 'three';

const SceneContext = createContext();

export const useThree = () => {
  return useContext(SceneContext);
};

export const SceneProvider = ({ children }) => {
  const sceneRef = useRef(new THREE.Scene());
  const cameraRef = useRef(new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000));
  const rendererRef = useRef(new THREE.WebGLRenderer({ antialias: true }));

  return (
    <SceneContext.Provider value={{ sceneRef, cameraRef, rendererRef }}>
      {children}
    </SceneContext.Provider>
  );
};
