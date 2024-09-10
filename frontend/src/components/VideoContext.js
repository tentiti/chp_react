import React, { createContext, useState, useContext } from 'react';

const VideoContext = createContext();

export const VideoProvider = ({ children }) => {
  const [videoFiles, setVideoFiles] = useState([]);

  const addVideoFile = (file) => {
    setVideoFiles(prevFiles => [...prevFiles, file]);
  };

  return (
    <VideoContext.Provider value={{ videoFiles, addVideoFile }}>
      {children}
    </VideoContext.Provider>
  );
};

export const useVideo = () => {
  const context = useContext(VideoContext);
  if (!context) {
    throw new Error('useVideo must be used within a VideoProvider');
  }
  return context;
};