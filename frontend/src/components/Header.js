// Header.js
import React from 'react';

const Header = ({ title, needthird = true, onMenuClick }) => {
  return (
    <header style={{ width: '100%', boxSizing: 'border-box', background:'transparent'}}>
      <div className="titleArea">
        <div>
          <img
            src="/static/icons/back_double.png"
            alt="back"
            id="back-button"
            onClick={() => window.history.back()}
          />
        </div>
        <div style={{ fontSize: '20px', color: '#412823' }}>{title}</div>
        <div>
        {needthird && (
          
            <button 
              className="ajax-link" 
              id="headerthirdbutton" 
              style={{ marginLeft: 'auto', background: 'none', border: 'none' }}
              onClick={onMenuClick} // 클릭 이벤트 핸들러 추가
            >
              <img src="/static/icons/hamburger.png" alt="menu" id="menu-button" />
            </button>
          
        )}
        </div>
      </div>
    </header>
  );
};

export default Header;
