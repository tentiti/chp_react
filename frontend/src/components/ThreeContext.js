import React, { createContext, useContext, useRef } from 'react';
import * as THREE from 'three';

const ThreeContext = createContext();

export const useThree = () => {
  return useContext(ThreeContext);
};

export const ThreeProvider = ({ children }) => {
  const sceneRef = useRef(new THREE.Scene());
  const cameraRef = useRef(new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000));
  const rendererRef = useRef(new THREE.WebGLRenderer({ antialias: true }));

  return (
    <ThreeContext.Provider value={{ sceneRef, cameraRef, rendererRef }}>
      {children}
    </ThreeContext.Provider>
  );
};
