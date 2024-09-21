import React, { useEffect, useState, useCallback } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './components/Home';
import Invitation from './components/Invitation';
import CreateCharacter from './components/CreateCharacter';
import PlaceSelection from './components/PlaceSelection';
import PostcardCreation from './components/PostcardCreation';
import PostcardView from './components/PostcardView';
import PostcardShareView from './components/PostcardShareView';
import Credit from './components/Credit';
import { VideoProvider } from './components/VideoContext';
import { SceneProvider } from './components/SceneContext'; // SceneProvider import

import './App.css';

function App() {
  const [isFixedSize, setIsFixedSize] = useState(false);
  const [showSizeInfo, setShowSizeInfo] = useState(false);
  const [isSizeChecked, setIsSizeChecked] = useState(false);

  const getDeviceType = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/mobile/i.test(userAgent)) return 'mobile';
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) return 'tablet';
    return 'desktop';
  };

  const checkWindowSize = useCallback(() => {  // useCallback to memoize the function
    const width = window.innerWidth;
    const height = window.innerHeight;
    const deviceType = getDeviceType();

    console.log(`Width: ${width}, Height: ${height}, Device Type: ${deviceType}`);

    setIsFixedSize(deviceType === 'tablet' || deviceType === 'desktop');
    setShowSizeInfo((deviceType === 'tablet' || deviceType === 'desktop') && (width < 390 || height < 780));
    setIsSizeChecked(true);
  }, []);  // No dependencies for now

  useEffect(() => {
    checkWindowSize();
    window.addEventListener('resize', checkWindowSize);
    return () => window.removeEventListener('resize', checkWindowSize);
  }, [checkWindowSize]);  // Dependency added

  if (!isSizeChecked) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className={isFixedSize ? 'fixed-size-container' : ''}>
      {showSizeInfo ? (
        <div className="size-info-container">
          <img src="/static/stockimages/sizeinfo.png" alt="Size Information" className="size-info-image" />
        </div>
      ) : (
        <SceneProvider>
          <VideoProvider>
            <Router>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/Home" element={<Home />} />
                <Route path="/undefined" element={<Home />} />
                <Route path="/invitation" element={<Invitation />} />
                <Route path="/Credit" element={<Credit />} />
                <Route path="/CreateCharacter" element={<CreateCharacter isFixedSize={isFixedSize} />} />
                <Route path="/place-selection" element={<PlaceSelection />} />
                <Route path="/postcardcreation" element={<PostcardCreation />} />
                <Route path="/postcardview/:id" element={<PostcardView />} />
                <Route path="/postcardshareview/:id" element={<PostcardShareView />} />
              </Routes>
            </Router>
          </VideoProvider>
        </SceneProvider>
      )}
    </div>
  );
}

export default App;
