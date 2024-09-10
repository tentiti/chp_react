import React, { createContext, useState, useContext } from 'react';

// 1. Context 생성
const VideoContext = createContext();

// 2. Provider 컴포넌트
export const VideoProvider = ({ children }) => {
  const [videoFile, setVideoFile] = useState(null);

  return (
    <VideoContext.Provider value={{ videoFile, setVideoFile }}>
      {children}
    </VideoContext.Provider>
  );
};

// 3. useVideo 훅
export const useVideo = () => {
    const context = useContext(VideoContext);
    if (!context) {
      throw new Error('useVideo must be used within a VideoProvider');
    }
    return context;
  };