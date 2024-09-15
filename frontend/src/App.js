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

  useEffect(() => {
    const resizeWindow = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // 화면 크기가 390x844보다 클 때만 크기를 고정
      if (width > 390 && height > 844) {
        setIsFixedSize(true);
      } else {
        setIsFixedSize(false);
      }
    };

    // 페이지가 로드될 때와 창 크기가 변경될 때 호출
    window.addEventListener('resize', resizeWindow);
    resizeWindow(); // 초기 실행

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      window.removeEventListener('resize', resizeWindow);
    };
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
