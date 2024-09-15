import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from './Header';
import './CreateCharacter.css';
import './placeselection.css';

const backgrounds = [
    "/static/stockimages/trans_bg1.png",
    "/static/stockimages/trans_bg2.png",
    "/static/stockimages/trans_bg3.png",
];

const modelPositions = [
    { x: 67, y: 150, width: 147, height: 190 },
    { x: 168, y: 102, width: 147, height: 190 },
    { x: 196, y: 65, width: 147, height: 190 },
];

const descriptions = [
    {
        title: "달밤",
        date: "2020.08.",
        text: "작품설명, 바꾸고자 하는 것, 아름다운 표현들 등등등 그렇다는 것...",
        image: "static/stockimages/work1.jpg",
    },
    {
        title: "저녁 풍경",
        date: "2021.06.",
        text: "작품설명, 바꾸고자 하는 것, 아름다운 표현들 등등등 그렇다는 것...",
        image: "static/stockimages/work2.jpeg",
    },
    {
        title: "아침의 시작",
        date: "2022.01.",
        text: "작품설명, 바꾸고자 하는 것, 아름다운 표현들 등등등 그렇다는 것...",
        image: "static/stockimages/work3.jpeg",
    }
];

const PlaceSelection = () => {

    const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

    useEffect(() => {
        // 화면 크기 업데이트 함수
        const handleResize = () => {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        };

        // 윈도우 리사이즈 이벤트 리스너 등록
        window.addEventListener('resize', handleResize);

        // 컴포넌트 언마운트 시 이벤트 리스너 제거
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // 높이 제한 계산
    const shouldLimitHeight = (windowSize.width > 390 && windowSize.height > 1024) ;


    const location = useLocation();
    const navigate = useNavigate();
    const { gifUrl, realgifUrl, videoFiles } = location.state || {};
    
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);
    const containerRef = useRef(null);

    const handleNext = () => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % backgrounds.length);
    };
    
    const handlePrevious = () => {
        setCurrentIndex((prevIndex) => (prevIndex - 1 + backgrounds.length) % backgrounds.length);
    };

    const handleScroll = () => {
        if (containerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
            setIsScrolledToBottom(scrollTop + clientHeight >= scrollHeight - 10);
        }
    };

    useEffect(() => {
        const currentContainer = containerRef.current;
        if (currentContainer) {
            currentContainer.addEventListener('scroll', handleScroll);
        }
        return () => {
            if (currentContainer) {
                currentContainer.removeEventListener('scroll', handleScroll);
            }
        };
    }, []);

    const scrollToBottom = () => {
        containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' });
    };
      
    const scrollToTop = () => {
        containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSelectPlace = () => {
        console.log('Selected background:', currentIndex+1);
        navigate('/postcardcreation', { state: { selectedBackground: currentIndex+1, gifUrl, realgifUrl, videoFiles } });
    };
    
    const currentModelPosition = modelPositions[currentIndex] || modelPositions[0];
    const currentDescription = descriptions[currentIndex] || descriptions[0];

    if (!currentDescription) {
        return <div>Loading...</div>; // 또는 에러 메시지를 표시할 수 있습니다.
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%', maxWidth: '414px', margin: '0 auto' }}>
            <Header title="장소 정하기" needthird={false} />
            
            <div ref={containerRef} style={{ 
                flex: 1, 
                overflowY: 'auto', 
                backgroundColor: '#F8F6F1', 
                padding: '0 20px',  // 패딩은 유지
                maxHeight: '100vh',  // 최대 높이를 화면에 맞추고
                boxSizing: 'border-box', // 패딩이 스크롤 계산에 포함되도록 설정
             }}>
                <div style={{}}>
                    <div style={{ height: '40vh', position: 'relative', width: '100%', marginTop: '70px', display:'flex', alignContent:'center', justifyContent:"center" }}>
                        <img 
                            src={backgrounds[currentIndex]}
                            alt="Background"
                            style={{ 
                                marginTop: shouldLimitHeight ? '240px' : '0', 
                                position: 'relative',
                                width: 'auto', 
                                height: shouldLimitHeight ? '50%' : '100%', 
                                objectFit: 'contain',
                                maxHeight: '100%',     // Constrain the height
                                maxWidth: '100%',      // Constrain the width
                             }}
                        />
                        {gifUrl && (
                            <img
                                src={`/api/uploads/${gifUrl}`}
                                alt="Generated GIF"
                                style={{
                                    position: 'absolute',
                                    top: `${currentModelPosition.y / 375 * 100}%`,
                                    left: `${currentModelPosition.x / 300 * 100}%`,
                                    width: `${currentModelPosition.width / 300 * 100}%`,
                                    height: `${currentModelPosition.height / 375 * 100}%`,
                                    objectFit: 'contain',
                                    maxHeight: '100%',     // Constrain the gif height
                                    maxWidth: '100%',      // Constrain the gif width
                                }}
                            />
                        )}
                    </div>

                    {/* Dot Indicators */}
                    <div style={{ display: 'flex', justifyContent: 'center', margin: '0' }}>
                        {backgrounds.map((_, index) => (
                            <div 
                                key={index} 
                                style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    backgroundColor: index === currentIndex ? 'rgba(65,30,45,1)' : 'rgba(65,30,45,0.3)',
                                    margin: '0 5px',
                                }}
                            />
                        ))}
                    </div>

                    <hr style={{ width: '100%', margin: '10px 0', border: '0.5px solid #E6E1DC' }} />

                    {/* Left and Right Arrows */}
                    <div 
                        style={{ 
                            position: 'absolute', 
                            top: '25vh', 
                            left: '30px', 
                            cursor: 'pointer',
                            fontSize: '22px',
                            color: 'rgba(65,30,45,0.3)',
                            zIndex: 1000,
                        }}
                        onClick={handlePrevious}
                    >
                        &#9664;
                    </div>
                    <div 
                        style={{ 
                            position: 'absolute', 
                            top: '25vh', 
                            right: '30px', 
                            cursor: 'pointer',
                            fontSize: '22px',
                            color: 'rgba(65,30,45,0.3)',
                            zIndex: 1000,
                        }}
                        onClick={handleNext}
                    >
                        &#9654;
                    </div>

                    {/* Work details */}
                    <div style={{ width: '100%', margin: '0 auto' }}>
                        <h2 id='worktitle'>{currentDescription.title}</h2>
                        <p id="workdate">{currentDescription.date}</p>
                        <p id="workdetails" >{currentDescription.text}</p>
                    </div>

                    {/* Copyright text */}
                    <span style={{ 
                        color: '#9C9C9C', 
                        fontSize: '8px', 
                        display: 'block',
                        width: '100%',
                        textAlign: 'right',
                        margin: '10px 0',
                    }}>
                        * 해당 배경은 김화순 작가의 작품을 오마주하여 제작하였습니다.
                    </span>

                    {/* Scroll button */}
                    <div 
                        onClick={isScrolledToBottom ? scrollToTop : scrollToBottom} 
                        style={{
                            height: '65px',
                            width: '100%',
                            borderTop: '1px solid #E6E1DC',
                            paddingTop: '10px',
                            cursor: 'pointer',
                            textAlign: 'center',
                        }}
                    >
                        {isScrolledToBottom ? '장소 고르러 돌아가기' : '원본 작품 보러가기'}<br/>
                        <img 
                            src="/static/icons/down.png" 
                            alt="Arrow" 
                            style={{
                                width: 'auto', 
                                height: '13px', 
                                marginTop: '10px', 
                                transform: isScrolledToBottom ? 'rotate(180deg)' : 'none',
                            }} 
                        />
                    </div>

                    <img src={currentDescription.image} alt="Example" style={{ 
                        width: '100%', 
                        height: 'auto',
                        marginTop: '20px',  
                        marginBottom: '22px',
                    }} />

                </div>
            </div>

            {/* Bottom button */}
            <div style={{
                position: 'sticky',
                bottom: '0',
                left: '0',
                borderTop: '1px solid #E6E1DC',
                width: '100%',
                height: '80px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#F8F6F1',
            }}>
                <button id="scrolldownbutton" onClick={handleSelectPlace}>
                    여기서 춤추기
                </button>
            </div>
        </div>
    );
};

export default PlaceSelection;