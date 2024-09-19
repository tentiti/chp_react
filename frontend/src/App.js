import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './components/Home';
import Invitation from './components/Invitation';
import CreateCharacter from './components/CreateCharacter';
import PlaceSelection from './components/PlaceSelection';
import PostcardCreation from './components/PostcardCreation';
import PostcardView from './components/PostcardView';
import PostcardShareView from './components/PostcardShareView';
import ImageComponent from './components/ImageComponent.js';
import { VideoProvider } from './components/VideoContext'; // Context Provider import
import './App.css';

function App() {
  const [isFixedSize, setIsFixedSize] = useState(false);
  const [showSizeInfo, setShowSizeInfo] = useState(false);

  const getDeviceType = () => {
    const userAgent = navigator.userAgent.toLowerCase();

    if (/mobile/i.test(userAgent)) {
      return 'mobile';
    }
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
      return 'tablet';
    }
    return 'desktop';
  };

  const width = window.innerWidth;
  const height = window.innerHeight;
  const deviceType = getDeviceType();

  const checkWindowSize = () => {


    if ((deviceType === 'tablet' || deviceType === 'desktop') && (width < 390 || height < 780)) {
      setShowSizeInfo(true);
    } else {
      setShowSizeInfo(false);
    }
  };

  useEffect(() => {
    // Initial device type check
    const width = window.innerWidth;
    const height = window.innerHeight;
    const deviceType = getDeviceType();

    if ((deviceType === 'tablet' || deviceType === 'desktop') && (width > 450 || height <780)) {
      setIsFixedSize(true);
    } else {
      setIsFixedSize(false);
    }

    // Initial window size check
    checkWindowSize();

    // Add resize event listener
    window.addEventListener('resize', checkWindowSize);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('resize', checkWindowSize);
    };
  }, []);

  return (
    <div className={isFixedSize ? 'fixed-size-container' : ''}>
      {showSizeInfo ? (
        <div className="size-info-container">
          <img
            src="/static/stockimages/sizeinfo.png"
            alt="Size Information"
            className="size-info-image"
          />
        </div>
      ) : (
        <VideoProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/Home" element={<Home />} />
              <Route path="/undefined" element={<Home />} />
              <Route path="/invitation" element={<Invitation />} />
              <Route path="/CreateCharacter" element={<CreateCharacter />} />
              <Route path="/place-selection" element={<PlaceSelection />} />
              <Route path="/postcardcreation" element={<PostcardCreation />} />
              <Route path="/postcardview/:id" element={<PostcardView />} />
              <Route path="/postcardshareview/:id" element={<PostcardShareView />} />
            </Routes>
          </Router>
        </VideoProvider>
      )}
    </div>
  );
}

export default App;
