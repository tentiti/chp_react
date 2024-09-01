import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './components/Home';
import Invitation from './components/Invitation';
import CreateCharacter from './components/CreateCharacter';
import GlbTest from './components/GlbTest';
import PlaceSelection from './components/PlaceSelection';
import PostcardCreation from './components/PostcardCreation';

function App() {
  return (
    <Router>
      <Routes>
        {/* Home 컴포넌트는 기본 경로로 설정 */}
        <Route path="/" element={<Home />} />
        {/* Invitation 페이지 */}
        <Route path="/invitation" element={<Invitation />} />
        {/* CreateCharacter 페이지 */}
        <Route path="/createCharacter" element={<CreateCharacter />} />
        {/*GLBTest 페이지 */}
        <Route path="/GlbTest" element={<GlbTest />} />
        <Route path="/place-selection" element={<PlaceSelection />} />
        <Route path="/postcard" element={<PostcardCreation />} />
      </Routes>
    </Router>
  );
}

export default App;
