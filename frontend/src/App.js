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
  const [isResponsiveScale, setIsResponsiveScale] = useState(false);
  const [showInstaInfo, setShowInstaInfo] = useState(false); // 추가된 상태
  const [showKakaoInfo, setShowKakaoInfo] = useState(false); // 추가된 상태 
  const [isSizeChecked, setIsSizeChecked] = useState(false);

  const getDeviceType = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/mobile/i.test(userAgent)) return 'mobile';
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) return 'tablet';
    return 'desktop';
  };

  const checkInstagramBrowser = () => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    return userAgent.includes("Instagram");
  };

  const checkKakaoBrowser = () => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    return userAgent.includes("Kakao");
  };

  const checkWindowSize = useCallback(() => {  // useCallback to memoize the function
    const width = window.innerWidth;
    const height = window.innerHeight;
    const deviceType = getDeviceType();

    console.log(`Width: ${width}, Height: ${height}, Device Type: ${deviceType}`);

    // 축소안내
    setShowSizeInfo((deviceType === 'tablet' || deviceType === 'desktop') && (width < 500 || height < 500));

    // 고정사이즈
    setIsFixedSize((deviceType === 'tablet' || deviceType === 'desktop') && (width >= 700 && height >= 900));
    

    setIsResponsiveScale((deviceType === 'tablet' || deviceType === 'desktop') && (width >= 500 && height >= 500));
    setShowInstaInfo(checkInstagramBrowser()); // 인스타그램 브라우저 감지 후 상태 업데이트
    setShowKakaoInfo(checkKakaoBrowser()); // 카카오 브라우저 감지 후 상태 업데이트
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
      ) : showInstaInfo ? ( // 인스타그램 안내 정보 추가
        <div className="size-info-container">
          <img src="/static/stockimages/instainfo.png" alt="Instagram Browser Information" className="size-info-image" />
        </div>
      ) : showKakaoInfo ? ( // 카카오 안내 정보 추가
        <div className="size-info-container">
          <img src="/static/stockimages/kakaoinfo.png" alt="Kakao Browser Information" className="size-info-image" />
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
                <Route path="/credit/:id" element={<PostcardView />} />
                <Route path="/CreateCharacter" element={<CreateCharacter isFixedSize={isFixedSize} />} />
                <Route path="/place-selection" element={<PlaceSelection />} />
                <Route path="/postcardcreation" element={<PostcardCreation />} />
                <Route path="/postcardview/:id" element={<Credit />} />
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
