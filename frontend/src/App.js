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
  const [isFixedSize, setIsFixedSize] = useState(false);
  const [showSizeInfo, setShowSizeInfo] = useState(false);
  const [isResponsiveScale, setIsResponsiveScale] = useState(false);
  const [showInstaInfo, setShowInstaInfo] = useState(false);
  const [showKakaoInfo, setShowKakaoInfo] = useState(false); 
  const [isSizeChecked, setIsSizeChecked] = useState(false);
  const [scaleStyle, setScaleStyle] = useState({}); // 스케일링 상태 추가

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

  const checkWindowSize = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const deviceType = getDeviceType();

    console.log(`Width: ${width}, Height: ${height}, Device Type: ${deviceType}`);

    setShowSizeInfo((deviceType === 'tablet' || deviceType === 'desktop') && (width < 500 || height < 500));
    setIsFixedSize((deviceType === 'tablet' || deviceType === 'desktop') && (width >= 500 && height >= 500));
    setIsResponsiveScale((deviceType === 'tablet' || deviceType === 'desktop') && (width >= 500 && height >= 500));
    setShowInstaInfo(checkInstagramBrowser());
    setShowKakaoInfo(checkKakaoBrowser());
    setIsSizeChecked(true);

    // 스케일링 적용 상태 업데이트
    if (deviceType === 'tablet' || deviceType === 'desktop') {
      if (height >= 900) {
        setScaleStyle({
          transform: 'translate(-50%, -50%) scale(1.1538)',
        });
      } else {
        setScaleStyle({
          transform: `translate(-50%, -50%) scale(${height / 780})`,
        });
      }
    } else {
      setScaleStyle({});
    }
  }, []);

  useEffect(() => {
    checkWindowSize();
    window.addEventListener('resize', checkWindowSize);
    return () => window.removeEventListener('resize', checkWindowSize);
  }, [checkWindowSize]);

  if (!isSizeChecked) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div 
      className={isFixedSize ? 'fixed-size-container' : ''}
      style={scaleStyle} // 스타일 상태로 적용
    >
      {showSizeInfo ? (
        <div className="size-info-container">
          <img src="/static/stockimages/sizeinfo.png" alt="Size Information" className="size-info-image" />
        </div>
      ) : showInstaInfo ? (
        <div className="size-info-container">
          <img src="/static/stockimages/instainfo.png" alt="Instagram Browser Information" className="size-info-image" />
        </div>
      ) : showKakaoInfo ? (
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
                <Route path="/postcardview/:id" element={<PostcardView />} />
                <Route path="/CreateCharacter" element={<CreateCharacter isFixedSize={isFixedSize} />} />
                <Route path="/place-selection" element={<PlaceSelection />} />
                <Route path="/postcardcreation" element={<PostcardCreation />} />
                <Route path="/credit/:id" element={<Credit />} />
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
