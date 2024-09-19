import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from './Header';
import './CreateCharacter.css';
import './placeselection.css';
import { isTablet, isDesktop } from 'react-device-detect'; // 추가
import Invitation from './Invitation'; // Invitation 컴포넌트 임포트

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
        text: "작품설명, 바꾸고자 하는 것, 아름다운 표현들 등등등 그렇다는 것... 작품설명, 바꾸고자 하는 것, 아름다운 표현들 등등등 그렇다는 것.. 작품설명, 바꾸고자 하는 것, 아름다운 표현들 등등등 그렇다는 것.. 작품설명, 바꾸고자 하는 것, 아름다운 표현들 등등등 그렇다는 것..",
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
    const shouldLimitHeight = (isTablet || isDesktop); // tablet 또는 desktop이면 제한 적용

    const [isInvitationVisible, setIsInvitationVisible] = useState(false); // Invitation의 가시성을 관리하는 상태
    const [isFloatingVisible, setIsFloatingVisible] = useState(true); // 플로팅 버튼 가시성 관리 상태
  
    // Invitation을 보이게 하는 함수 (메뉴 클릭 시 호출됨)
    const handleMenuClick = () => {
      setIsInvitationVisible(true);
    };
  
    // Invitation을 숨기고 원래 화면으로 돌아가는 함수 (뒤로가기 클릭 시 호출됨)
    const handleBackClick = () => {
      setIsInvitationVisible(false);
    };
    
      // 초대장 이미지 표시 관련
    const [showImage, setShowImage] = useState(false); // 이미지 표시 여부를 결정하는 상태

    const handleCloseImage = () => {
      setShowImage(false); // 화면을 클릭하면 이미지 사라지게 설정
    };


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
        console.log('Selected background:', currentIndex + 1);
        navigate('/postcardcreation', { state: { selectedBackground: currentIndex + 1, gifUrl, realgifUrl, videoFiles } });
    };
    
    const currentModelPosition = modelPositions[currentIndex] || modelPositions[0];
    const currentDescription = descriptions[currentIndex] || descriptions[0];

    if (!currentDescription) {
        return <div>Loading...</div>;
    }

    return (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100%', 
            width: '100%', 
            margin: '0', 
            left: '0', 
            overflowY: 'hidden'
        }}>
            <Header title="장소 정하기" needthird={true} onMenuClick={handleMenuClick} style={{ position: 'fixed' }} />
        
            {isInvitationVisible && (
                <div className={`invitation-container ${isInvitationVisible ? 'visible' : ''}`}>
                    <Invitation onBack={handleBackClick} />
                </div>
            )}

            <div ref={containerRef} style={{ 
                flex: 1, 
                top: '58px',
                bottom: '80px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: 'calc(100% - 138px)',
                overflowY: 'auto',
                backgroundColor: '#F8F6F1', 
                padding: '0 20px',  
                boxSizing: 'border-box',
            }}>
                {/* Image and Controls */}
                <div id="picturecontainer" style={{ 
                    position: 'relative',
                    flexGrow: 1, // Grow to take remaining space
                    boxSizing: 'border-box',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    <img 
                        src={backgrounds[currentIndex]}
                        alt="Background"
                        style={{ 
                            marginTop: '58px', 
                            width: '80%', 
                            height: 'auto', 
                            objectFit: 'cover', 
                            maxWidth: '100%',
                            maxHeight: '100%',
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
                                maxHeight: '100%',
                                maxWidth: '100%',
                            }}
                        />
                    )}
                    <div id="dirctions" style={{
                        position: 'absolute',
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        top: '50%',
                        left: '0',
                        width: '100%',
                        padding: '0 5px',
                        boxSizing: 'border-box',
                    }}>
                        <div 
                            style={{ 
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
                    </div>
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

                {/* Work details */}
                <div id="workdetails" style={{ 
                    width: '100%',
                    maxWidth: '390px',
                    margin: '0 auto',
                    textAlign: 'center',
                    minHeight: '200px', // Minimum height for this section
                }}>
                    <p id='worktitle'>{currentDescription.title}</p>
                    <p id="workdate">{currentDescription.date}</p>
                    <p id="workexplanation">{currentDescription.text}</p>
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
                        display: 'flex',
                        flexDirection: isScrolledToBottom ? 'column' : 'column-reverse',
                        justifyContent: 'flex-start',
                        alignItems: 'center',
                        position: 'fixed',
                        textAlign: 'center',
                        left: 0,
                        top: isScrolledToBottom ? '58px' : 'auto',
                        bottom: isScrolledToBottom ? 'auto' : '80px',
                        width: '100%',
                        height: '65px',
                        border: '1px solid #E6E1DC',
                        backgroundColor: '#F8F6F1',
                        cursor: 'pointer',
                        textAlign: 'center',
                        padding: '7px',
                        boxSizing: 'border-box',
                    }}
                >
                    <span>{isScrolledToBottom ? '장소 고르러 돌아가기' : '원본 작품 보러가기'}</span>
                    <br/>
                    <img 
                        src="/static/icons/down.png" 
                        alt="Arrow" 
                        style={{
                            margin: '-5px',
                            width: 'auto', 
                            height: '13px', 
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

            {/* Bottom button */}
            <div style={{
                position: 'fixed',
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
