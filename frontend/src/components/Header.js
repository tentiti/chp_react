// Header.js
import React from 'react';

const Header = ({ title }) => {
  return (
    <header>
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
        <div></div>
      </div>
    </header>
  );
};

export default Header;
