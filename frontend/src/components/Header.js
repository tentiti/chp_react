import React from 'react';

const Header = ({ title, needthird = true, onMenuClick }) => {
  return (
    <header style={{ left: '0', width: '100%', boxSizing: 'border-box', background: 'transparent', border: 'none' }}>
      <div className="titleArea">
        {/* 왼쪽의 백 버튼 */}
        <div style = {{width: '10%', height:'40%'}}>
          <img
            src="/static/icons/back_double.webp"
            alt="back"
            id="back-button"
            onClick={() => window.history.back()}
            style={{ cursor: 'pointer' }}
          />
        </div>
        
        {/* 가운데 제목 */}
        <div style={{ fontSize: '20px', color: '#412823', textAlign: 'center', flex: 1 }}>
          {title}
        </div>

        {/* 오른쪽 메뉴 버튼 */}
        <div style =  {{width: '10%', height:'40%'}}>
          {needthird && (
            <button
              className="ajax-link"
              id="headerthirdbutton"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={onMenuClick}
            >
              <img src="/static/icons/hamburger.webp" alt="menu" id="menu-button" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
