import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './components/Home';
import Invitation from './components/Invitation';
import CreateCharacter from './components/CreateCharacter';
import PlaceSelection from './components/PlaceSelection';
import PostcardCreation from './components/PostcardCreation';
import PostcardView from './components/PostcardView';
import PostcardShareView from './components/PostcardShareView';
import { VideoProvider } from './components/VideoContext'; // Context Provider import
import './App.css';

function App() {
  const [isFixedSize, setIsFixedSize] = useState(false);

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

  useEffect(() => {
    const deviceType = getDeviceType();

    if (deviceType === 'tablet' || deviceType === 'desktop') {
      setIsFixedSize(true);
    } else {
      setIsFixedSize(false);
    }
  }, []);

  return (
    <div className={isFixedSize ? 'fixed-size-container' : ''}>
      <VideoProvider>
        <Router>
          <Routes>
            {/* Home 컴포넌트는 기본 경로로 설정 */}
            <Route path="/" element={<Home />} />
            <Route path="/Home" element={<Home />} />
            <Route path="/undefined" element={<Home />} />
            {/* Invitation 페이지 */}
            <Route path="/invitation" element={<Invitation />} />
            {/* CreateCharacter 페이지 */}
            {/* <Route path="/createCharacter" element={<CreateCharacter />} /> */}
            {/*GLBTest 페이지 */}
            <Route path="/CreateCharacter" element={<CreateCharacter />} />
            <Route path="/place-selection" element={<PlaceSelection />} />
            <Route path="/postcardcreation" element={<PostcardCreation />} />
            {/* PostcardView를 위한 라우트 설정 */}
            <Route path="/postcardview/:id" element={<PostcardView />} />
            <Route path="/postcardshareview/:id" element={<PostcardShareView />} />
            {/* <Route path="/GlbViewer" element={<GlbViewer />} /> */}
          </Routes>
        </Router>
      </VideoProvider>
    </div>
  );
}

export default App;
