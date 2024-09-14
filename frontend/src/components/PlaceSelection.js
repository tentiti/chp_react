import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from './Header'; // 헤더 컴포넌트 불러오기
import './CreateCharacter.css'; // CSS 파일 불러오기
import './placeselection.css'; // CSS 파일 불러오기

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
        text: "작품설명, 바꾸고자 하는 것, 아름다운 표현들 등등등 그렇다는 것. 작품설명, 바꾸고자 하는 것, 아름다운 표현들 등등등 그렇다는 것. 작품설명, 바꾸고자 하는 것, 아름다운 표현들 등등등 그렇다는 것. 작품설명, 바꾸고자 하는 것, 아름다운 표현들 등등등 그렇다는 것. 작품설명, 바꾸고자 하는 것, 아름다운 표현들 등등등 그렇다는 것. 아름다운 표현들 등등등 그렇다는 것.작품설명, 바꾸고자 하는 것, 아름다운 표현들 등등등 그렇다는 것. 작품설명, 바꾸고자 하는 것, 아름다운 표현들 등등등 그렇다는 것. ",
        image: "https://placehold.co/780x1300?text=work1",
    },
    {
        title: "저녁 풍경",
        date: "2021.06.",
        text: "작품설명, 바꾸고자 하는 것, 아름다운 표현들 등등등 그렇다는 것. 작품설명, 바꾸고자 하는 것, 아름다운 표현들 등등등 그렇다는 것. 작품설명, 바꾸고자 하는 것, 아름다운 표현들 등등등 그렇다는 것. 작품설명, 바꾸고자 하는 것, 아름다운 표현들 등등등 그렇다는 것. 작품설명, 바꾸고자 하는 것, 아름다운 표현들 등등등 그렇다는 것. 아름다운 표현들 등등등 그렇다는 것.작품설명, 바꾸고자 하는 것, 아름다운 표현들 등등등 그렇다는 것. 작품설명, 바꾸고자 하는 것, 아름다운 표현들 등등등 그렇다는 것. ",
        image: "https://placehold.co/600x800?text=work2",
    },
    {
        title: "아침의 시작",
        date: "2022.01.",
        text: "작품설명, 바꾸고자 하는 것, 아름다운 표현들 등등등 그렇다는 것. 작품설명, 바꾸고자 하는 것, 아름다운 표현들 등등등 그렇다는 것. 작품설명, 바꾸고자 하는 것, 아름다운 표현들 등등등 그렇다는 것. 작품설명, 바꾸고자 하는 것, 아름다운 표현들 등등등 그렇다는 것. 작품설명, 바꾸고자 하는 것, 아름다운 표현들 등등등 그렇다는 것. 아름다운 표현들 등등등 그렇다는 것.작품설명, 바꾸고자 하는 것, 아름다운 표현들 등등등 그렇다는 것. 작품설명, 바꾸고자 하는 것, 아름다운 표현들 등등등 그렇다는 것. ",
        image: "https://placehold.co/900x900?text=work3",
    }
];

const PlaceSelection = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { gifUrl, realgifUrl, videoFiles } = location.state;
    console.log('GIF URL:', gifUrl);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [fadeIn, setFadeIn] = useState(true);
    const [scrollTop, setScrollTop] = useState(0);
    const containerRef = useRef(null);
    const descriptionRef = useRef(null);

    const handleNext = () => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % backgrounds.length);
    };
    
    const handlePrevious = () => {
        setCurrentIndex((prevIndex) => (prevIndex - 1 + backgrounds.length) % backgrounds.length);
    };
    

    const handleScroll = () => {
        setScrollTop(window.scrollY);
        if (window.scrollY === 0) {
            setFadeIn(true);
        } else {
            setFadeIn(false);
        }
    };

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const scrollToBottom = () => {
        containerRef.current.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' });
        setIsScrolledToBottom(true); // 스크롤 후 상태 변경
    };

    const scrollToTop = () => {
        containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        setIsScrolledToBottom(false); // 다시 스크롤을 위로 올리면 상태를 초기화
    };

    const handleSelectPlace = () => {
        console.log('Selected background:', currentIndex+1);
        navigate('/postcardcreation', { state: { selectedBackground: currentIndex+1, gifUrl: gifUrl, realgifUrl: realgifUrl, videoFiles:videoFiles, } });
    };
    
    const currentModelPosition = modelPositions[currentIndex]; // 현재 인덱스에 맞는 위치 데이터 가져오기

    const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);
    
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            justifyContent: 'space-between',
            overflow: 'hidden',
            overFlowX: 'hidden',
        }}>

            <div style={{
                position: 'fixed',
                top:0,
                height: '58px',
                width: '100vw',
                backgroundColor: '#F8F6F1',
                zIndex: 1000,
            }}>
                <Header title="장소 정하기" needthird = {false} />
            </div>
            <div style={{
                flex:1,
                display: 'flex',
                flexDirection: 'column',
                paddingTop: '58px', // Header height to push content below
                backgroundColor: '#F8F6F1',
                overflowY: 'auto',
            }}>
            <div id="containers" ref={containerRef} style={{
                position: 'relative',
                top: 0,
                flexGrow: 1,
                overflowY: 'auto', // Scrollable container
                justifyContent: 'flex-start', // 추가: 컨텐츠가 아래로 붙도록 설정
                minheight: 'calc(100vh * 2 - 276px)',
                display:'flex',
                flexDirection:'column', 
                textAlign: 'center', 
                alignItems: 'center',
                justifyContent: 'flex-start', // 수직 정렬을 위로 조정
                padding: '0 20px',
                overFlowX: 'hidden',
            }}>


                    <div id='images' style={{
                        height:'375px',
                        position:'relative',
                        overFlowX: 'hidden',
                    }}>
                        <img 
                            src={backgrounds[currentIndex]} // Dynamic background image
                            alt="Background"
                            style={{ 
                                margin:'10px',
                                width:'300px',
                                height:'375px',
                                objectFit: 'cover' }}
                        />

                        {gifUrl ? (
                            <img
                            src={`/api/uploads/${gifUrl}`}
                            alt="Generated GIF"
                            style={{
                            position: 'absolute',
                            top: `${currentModelPosition.y}px`,
                            left: `${currentModelPosition.x}px`,
                            width: `${currentModelPosition.width}px`,
                            height: `${currentModelPosition.height}px`,
                            objectFit: 'contain',
                            }}
                        />
                        ) : (                        
                            <img 
                            src={`https://placehold.co/127x158?text=error`} 
                                alt="Generated GIF" 
                                style={{ 
                                    position:'relative',
                                    top: '-150px', 
                                    left: '10%', 
                                    transform: 'translate(-50%, -50%)', 
                                    width: '100px', 
                                    height: 'auto'
                                }} 
                            />
                        )}
                    </div>
                    

                    {/* Dot Indicators */}
                    <div style={{ display: 'flex', flexDirection:'row', justifyContent: 'center', marginTop: '10px',
                        overFlowX: 'hidden', }}>
                    {backgrounds.map((_, index) => (
                        <div 
                            key={index} 
                            style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: index === currentIndex ? 'rgba(65,30,45,1)' : 'rgba(65,30,45,0.3)', // Current index indicator
                                margin: '0 5px',
                                cursor: 'pointer'
                            }}
                        />
                    ))}
                    </div>

                    {/* 구분선 추가 */}
                    <hr style={{ 
                        width: '100vw', 
                        margin: '10px auto', 
                        border: '0.5px solid #E6E1DC' // 구분선 색상 및 투명도 조정
                    }} />
                    {/* Left Arrow */}
                        <div 
                            style={{ 
                                position: 'absolute', 
                                top: '290px', 
                                left: '30px', 
                                transform: 'translateY(-50%)', 
                                cursor: 'pointer',
                                zIndex: 1000,
                                fontSize:'22px',
                                color:'rgba(65,30,45,0.3)',
                                zIndex: 1000,  
                            }}
                            onClick={handlePrevious}
                        >
                            &#9664; {/* Unicode for left arrow */}
                        </div>
                    {/* Right Arrow */}
                        <div 
                            style={{ 
                                position: 'absolute', 
                                top: '290px', 
                                right: '30px', 
                                transform: 'translateY(-50%)', 
                                cursor: 'pointer',
                                zIndex: 1000,
                                fontSize:'22px',
                                color:'rgba(65,30,45,0.3)'
                            }}
                            onClick={handleNext}
                        >
                            &#9654; {/* Unicode for right arrow */}
                        </div>

                    {/* 작품설명 */}
                    <div id='workdetails' style={{
                        overFlowX: 'hidden',
                    }}>
                        <h2 id='worktitle'>{descriptions[currentIndex].title}</h2>
                        <p id='workdate'>{descriptions[currentIndex].date}</p>
                        <p id='workdescription' style={{
                            height:'110px',
                            overflowY: 'auto',
                        }}>{descriptions[currentIndex].text}</p>
                    </div>

                {/* 저작권 및 설명 텍스트 - 오른쪽 정렬 */}
                    <span style={{ 
                        color: '#9C9C9C', 
                        fontSize: '8px', 
                        display: 'block', // 요소를 블록 요소로 만들어서 전체 너비 차지
                        width:'100%',
                        textAlign: 'right', // 텍스트를 오른쪽 정렬
                        zIndex: 10, // 다른 요소 위에 표시하도록 z-index 설정
                        marginRight: '10px',
                        
                    }}>
                        * 해당 배경은 김화순 작가의 작품을 오마주하여 제작하였습니다.
                    </span>
            
                    <div 
            onClick={isScrolledToBottom ? scrollToTop : scrollToBottom} 
            style={{
                position: 'sticky',
                bottom:'58px',
                height: '65px',
                width: '100vw',
                borderTop: '1px solid #E6E1DC',
                paddingTop: '10px',
                backgroundColor: '#F8F6F1',
                cursor: 'pointer', // 클릭할 수 있음을 나타냄
                textAlign: 'center', // 텍스트 및 이미지 중앙 정렬,
                overFlowX: 'hidden',
            }}
        >
            {isScrolledToBottom ? '장소 고르러 돌아가기' : '원본 작품 보러가기'}<br/>
            <img 
                src="/static/icons/down.png" 
                alt="Arrow" 
                style={{
                    width: 'auto', 
                    height: '13px', 
                    marginTop:'10px', 
                    transform: isScrolledToBottom ? 'rotate(180deg)' : 'none', // 이미지 상하 반전
                }} 
            />
        </div>

            <img src={descriptions[currentIndex].image} alt="Example" style={{ 
                width: '100%', 
                height: 'auto',
                marginTop: '20px',  
                marginBottom: '22px',
                paddingBottom: '58px'
                }} />
        </div>

        </div>
        <div style ={{
                    position: 'fixed',
                    bottom:'0',
                    left: '0',
                    borderTop: '1px solid #E6E1DC',
                    width: '100vw',
                    height: '10vh',
                    display: 'flex',
                    justifyContent: 'center',
                    backgroundColor: '#F8F6F1',
                    overFlowX: 'hidden',
                }}>

                <button id="scrolldownbutton"
                    onClick={handleSelectPlace} 
                >
                    여기서 춤추기
                </button>
        </div>
        </div>
    );
};

export default PlaceSelection;
