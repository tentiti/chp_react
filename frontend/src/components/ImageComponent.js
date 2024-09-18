import React from 'react';

const backgrounds = [
  "/static/stockimages/bg1.png",
  "/static/stockimages/bg1.png",
  "/static/stockimages/bg2.png",
  "/static/stockimages/bg3.png",
];

const modelPositions = [
  { x: 67, y: 150, width: 147, height: 190 },
  { x: 67, y: 150, width: 147, height: 190 },
  { x: 168, y: 102, width: 147, height: 190 },
  { x: 196, y: 65, width: 147, height: 190 },
];

const BASE_WIDTH = 500; // 기준 너비
const BASE_HEIGHT = 500; // 기준 높이

const ImageComponent = ({ width, height, index, characterGif }) => {
  const background = backgrounds[index % backgrounds.length]; // index에 따라 배경 이미지 선택
  const modelPosition = modelPositions[index % modelPositions.length]; // index에 따라 모델 위치 선택

  // 비율 계산 (현재 크기에 맞게 비례적으로 위치와 크기 조정)
  const widthRatio = width / BASE_WIDTH;
  const heightRatio = height / BASE_HEIGHT;

  const containerStyle = {
    width: `${width}px`,
    height: `${height}px`,
    position: 'relative',
    backgroundImage: `url(${background})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };

  const modelStyle = {
    position: 'absolute',
    left: `${modelPosition.x * widthRatio}px`, // 비례식으로 좌표 조정
    top: `${modelPosition.y * heightRatio}px`,  // 비례식으로 좌표 조정
    width: `${modelPosition.width * widthRatio}px`,  // 비례식으로 크기 조정
    height: `${modelPosition.height * heightRatio}px`,  // 비례식으로 크기 조정
    backgroundImage: `url(${characterGif})`,  // GIF 캐릭터 추가
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
  };

  return (
    <div style={containerStyle}>
      <div style={modelStyle}></div>
    </div>
  );
};

export default ImageComponent;
