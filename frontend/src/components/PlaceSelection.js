import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from './Header'; // 헤더 컴포넌트 불러오기
import './CreateCharacter.css'; // CSS 파일 불러오기
import './placeselection.css'; // CSS 파일 불러오기

const backgrounds = [
    "/static/stockimages/bg1.png",
    "/static/stockimages/bg2.png",
    "/static/stockimages/bg3.png",
];

const descriptions = [
    {
        title: "달밤",
        date: "2020.08.",
        text: "작품설명, 바꾸고자 하는 것, 아름다운 표현들 등등등 그렇다는 것. 작품설명, 바꾸고자 하는 것, 아름다운 표현들 등등등 그렇다는 것. 작품설명, 바꾸고자 하는 것, 아름다운 표현들 등등등 그렇다는 것. 작품설명, 바꾸고자 하는 것, 아름다운 표현들 등등등 그렇다는 것. 작품설명, 바꾸고자 하는 것, 아름다운 표현들 등등등 그렇다는 것. 아름다운 표현들 등등등 그렇다는 것.작품설명, 바꾸고자 하는 것, 아름다운 표현들 등등등 그렇다는 것. 작품설명, 바꾸고자 하는 것, 아름다운 표현들 등등등 그렇다는 것. ",
        image: "https://placehold.co/390x500?text=ex1",
        additionalImages: [
            "https://placehold.co/190x200?text=ex2",
            "https://placehold.co/190x200?text=ex3"
        ]
    },
    {
        title: "저녁 풍경",
        date: "2021.06.",
        text: "작품설명, 바꾸고자 하는 것, 아름다운 표현들 등등등 그렇다는 것. 작품설명, 바꾸고자 하는 것, 아름다운 표현들 등등등 그렇다는 것. 작품설명, 바꾸고자 하는 것, 아름다운 표현들 등등등 그렇다는 것. 작품설명, 바꾸고자 하는 것, 아름다운 표현들 등등등 그렇다는 것. 작품설명, 바꾸고자 하는 것, 아름다운 표현들 등등등 그렇다는 것. 아름다운 표현들 등등등 그렇다는 것.작품설명, 바꾸고자 하는 것, 아름다운 표현들 등등등 그렇다는 것. 작품설명, 바꾸고자 하는 것, 아름다운 표현들 등등등 그렇다는 것. ",
        image: "https://placehold.co/390x500?text=ex4",
        additionalImages: [
            "https://placehold.co/190x200?text=ex5",
            "https://placehold.co/190x200?text=ex6"
        ]
    },
    {
        title: "아침의 시작",
        date: "2022.01.",
        text: "작품설명, 바꾸고자 하는 것, 아름다운 표현들 등등등 그렇다는 것. 작품설명, 바꾸고자 하는 것, 아름다운 표현들 등등등 그렇다는 것. 작품설명, 바꾸고자 하는 것, 아름다운 표현들 등등등 그렇다는 것. 작품설명, 바꾸고자 하는 것, 아름다운 표현들 등등등 그렇다는 것. 작품설명, 바꾸고자 하는 것, 아름다운 표현들 등등등 그렇다는 것. 아름다운 표현들 등등등 그렇다는 것.작품설명, 바꾸고자 하는 것, 아름다운 표현들 등등등 그렇다는 것. 작품설명, 바꾸고자 하는 것, 아름다운 표현들 등등등 그렇다는 것. ",
        image: "https://placehold.co/390x500?text=ex7",
        additionalImages: [
            "https://placehold.co/190x200?text=ex8",
            "https://placehold.co/190x200?text=ex9"
        ]
    }
];

const PlaceSelection = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { gifUrl } = location.state;
    console.log('GIF URL:', gifUrl);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [fadeIn, setFadeIn] = useState(true);
    const [scrollTop, setScrollTop] = useState(0);
    const containerRef = useRef(null);
    const descriptionRef = useRef(null);

    const handleNext = () => {
        if (currentIndex < backgrounds.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
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
    };

    const scrollToTop = () => {
        containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSelectPlace = () => {
        console.log('Selected background:', currentIndex+1);
        navigate('/postcardcreation', { state: { selectedBackground: currentIndex+1, gifUrl: gifUrl } });
    };
    

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            justifyContent: 'space-between',
            overflow: 'hidden'
        }}>
            <div style={{
                position: 'fixed',
                top:0,
                height: '58px',
                width: '100%',
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
                flexGrow: 1,
                overflowY: 'auto', // Scrollable container
                justifyContent: 'flex-end', // 추가: 컨텐츠가 아래로 붙도록 설정
            }}>

                <div id='topsection' style={{ 
                    display:'flex',
                    flexDirection:'column', 
                    textAlign: 'center', 
                    alignItems: 'center',
                    justifyContent: 'flex-start', // 수직 정렬을 위로 조정
                    padding: '0 20px'
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
                            src={gifUrl} 
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
                    ) : (                        
                        <img 
                            src="`url(https://placehold.co/127x158?text=${selectedBackground})`"
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

                    {/* Dot Indicators */}
                    <div style={{ display: 'flex', flexDirection:'row', justifyContent: 'center', marginTop: '-100px' }}>
                    {backgrounds.map((_, index) => (
                        <div 
                            key={index} 
                            style={{
                                width: '10px',
                                height: '10px',
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
                        width: '95%', 
                        margin: '10px auto', 
                        border: '1px solid #E6E1DC' // 구분선 색상 및 투명도 조정
                    }} />
                    {/* Left Arrow */}
                    {currentIndex > 0 && (
                        <div 
                            style={{ 
                                position: 'absolute', 
                                top: '290px', 
                                left: '10px', 
                                transform: 'translateY(-50%)', 
                                cursor: 'pointer',
                                zIndex: 1000,
                                fontSize:'22px',
                                color:'rgba(65,30,45,0.3)'
                            }}
                            onClick={handlePrevious}
                        >
                            &#9664; {/* Unicode for left arrow */}
                        </div>
                    )}
                    {/* Right Arrow */}
                    {currentIndex < backgrounds.length - 1 && (
                        <div 
                            style={{ 
                                position: 'absolute', 
                                top: '290px', 
                                right: '10px', 
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
                    )}

                    {/* 작품설명 */}
                    <div id='workdetails'>
                        <h2 id='worktitle'>{descriptions[currentIndex].title}</h2>
                        <p id='workdate'>{descriptions[currentIndex].date}</p>
                        <p id='workdescription' style={{
                            height:'100px'
                        }}>{descriptions[currentIndex].text}</p>
                    </div>

                {/* 저작권 및 설명 텍스트 - 오른쪽 정렬 */}
                    <span style={{ 
                        color: '#9C9C9C', 
                        fontSize: '8px', 
                        display: 'block', // 요소를 블록 요소로 만들어서 전체 너비 차지
                        width:'100%',
                        textAlign: 'right', // 텍스트를 오른쪽 정렬
                        zIndex: 10 // 다른 요소 위에 표시하도록 z-index 설정
                    }}>
                        * 해당 배경은 김화순 작가의 작품을 오마주하여 제작하였습니다.
                    </span>

                    <hr style={{ 
                        width: '95%', 
                        margin: '10px auto', 
                        border: '1px solid  #E6E1DC', // 구분선 색상 및 투명도 조정
                        borderRadius: '10px' // 양끝 둥글게 설정
                    }} />
            
            {/* 두 개의 버튼 */}
                <div  onClick={scrollToBottom}>
                        원본 작품 보러가기<br/>
                        <img src="/static/stockimages/down.png" alt="Arrow Down" style={{ width: 'auto', height: '13px', marginTop:'10px'}} />
                </div>

                <hr style={{ 
                            width: 'calc(100vw - 40px)', 
                            border: '1px solid  #E6E1DC', // 구분선 색상 및 투명도 조정
                            borderRadius: '10px' // 양끝 둥글게 설정
                        }} />

                <button id="scrolldownbutton"
                    onClick={handleSelectPlace} 
                >
                    이 장소로 선택하기
                </button>
        </div>
                
        <div id = "bottomsection" ref={descriptionRef} style={{ 
            minHeight: 'calc(100vh - 58px)',
            padding: '20px', 
            background: 'linear-gradient(#f4f4f4, #000000)', // 변경: 그라데이션 추가
        }}>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button 
                    onClick={scrollToTop} 
                    style={{ 
                        marginTop:'20px',
                        padding: '10px 20px', 
                        fontSize: '16px', 
                        cursor: 'pointer',
                        backgroundColor: '#F8F6F1',
                        border: 'none',
                    }}
                >
                    장소 고르러 돌아가기
                </button>
            </div>
            <img src={descriptions[currentIndex].image} alt="Example" style={{ width: '100%', marginTop: '20px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                {descriptions[currentIndex].additionalImages.map((img, index) => (
                    <img key={index} src={img} alt={`Additional ${index}`} style={{ width: '49%' }} />
                ))}
            </div>
        </div>
        </div>
        </div>
        </div>
    );
};

export default PlaceSelection;
