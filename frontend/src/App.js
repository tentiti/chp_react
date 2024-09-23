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
import { SceneProvider } from './components/SceneContext';

import './App.css';

function App() {
  const [displayMode, setDisplayMode] = useState('loading');
  const [scale, setScale] = useState(1);
  const [showInstaInfo, setShowInstaInfo] = useState(false);
  const [showKakaoInfo, setShowKakaoInfo] = useState(false);

  const REFERENCE_WIDTH = 390;
  const REFERENCE_HEIGHT = 780;

  const getDeviceType = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/mobile/i.test(userAgent)) return 'mobile';
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) return 'tablet';
    return 'desktop';
  };

  const checkInstagramBrowser = () => {
    return navigator.userAgent.includes("Instagram");
  };

  const checkKakaoBrowser = () => {
    return navigator.userAgent.includes("Kakao");
  };

  const checkWindowSize = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const deviceType = getDeviceType();

    console.log(`Width: ${width}, Height: ${height}, Device Type: ${deviceType}`);

    if (deviceType === 'mobile') {
      setDisplayMode('mobile');
      setScale(1);
    } else if (width < 500 || height < 500) {
      setDisplayMode('sizeInfo');
    } else if (width >= 700 && height >= 900) {
      setDisplayMode('fixed');
      setScale(1.1538); // 450/390 = 1.1538
    } else {
      setDisplayMode('responsive');
      const widthScale = width / REFERENCE_WIDTH;
      const heightScale = height / REFERENCE_HEIGHT;
      setScale(Math.min(widthScale, heightScale, 1.1538)); // Max scale is 1.1538
    }

    setShowInstaInfo(checkInstagramBrowser());
    setShowKakaoInfo(checkKakaoBrowser());
  }, []);

  useEffect(() => {
    checkWindowSize();
    window.addEventListener('resize', checkWindowSize);
    return () => window.removeEventListener('resize', checkWindowSize);
  }, [checkWindowSize]);

  if (displayMode === 'loading') {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className={`app-container ${displayMode}`} style={{ '--scale': scale }}>
      {displayMode === 'sizeInfo' && (
        <div className="size-info-container">
          <img src="/static/stockimages/sizeinfo.png" alt="Size Information" className="size-info-image" />
        </div>
      )}
      {showInstaInfo && (
        <div className="size-info-container">
          <img src="/static/stockimages/instainfo.png" alt="Instagram Browser Information" className="size-info-image" />
        </div>
      )}
      {showKakaoInfo && (
        <div className="size-info-container">
          <img src="/static/stockimages/kakaoinfo.png" alt="Kakao Browser Information" className="size-info-image" />
        </div>
      )}
      {(displayMode === 'fixed' || displayMode === 'responsive' || displayMode === 'mobile') && (
        <div className="content">
          <SceneProvider>
            <VideoProvider>
              <Router>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/Home" element={<Home />} />
                  <Route path="/undefined" element={<Home />} />
                  <Route path="/invitation" element={<Invitation />} />
                  <Route path="/credit/:id" element={<PostcardView />} />
                  <Route path="/CreateCharacter" element={<CreateCharacter />} />
                  <Route path="/place-selection" element={<PlaceSelection />} />
                  <Route path="/postcardcreation" element={<PostcardCreation />} />
                  <Route path="/postcardview/:id" element={<Credit />} />
                  <Route path="/postcardshareview/:id" element={<PostcardShareView />} />
                </Routes>
              </Router>
            </VideoProvider>
          </SceneProvider>
        </div>
      )}
    </div>
  );
}

export default App;