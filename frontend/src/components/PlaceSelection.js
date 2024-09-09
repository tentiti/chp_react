import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from './Header'; // 헤더 컴포넌트 불러오기
import './CreateCharacter.css'; // CSS 파일 불러오기
import './placeselection.css'; // CSS 파일 불러오기

const backgrounds = [
    "/static/stockimages/bg1.png",
    "https://placehold.co/390x500?text=bg2",
    "https://placehold.co/390x500?text=bg3"
];

const descriptions = [
    {
        title: "달밤",
        date: "2020.08.",
        text: "작품 설명 1: 이 작품은 달밤을 배경으로 하고 있으며, 아름다운 감정을 담아냈습니다. 설명이 길어지면 자연스럽게 줄이 넘어가고 내용이 더 많아질 수 있습니다.",
        image: "https://placehold.co/390x500?text=ex1",
        additionalImages: [
            "https://placehold.co/190x200?text=ex2",
            "https://placehold.co/190x200?text=ex3"
        ]
    },
    {
        title: "저녁 풍경",
        date: "2021.06.",
        text: "작품 설명 2: 이 작품은 저녁의 고요한 풍경을 묘사하고 있습니다. 작품의 내용이 조금 다르지만, 동일한 형식을 유지합니다.",
        image: "https://placehold.co/390x500?text=ex4",
        additionalImages: [
            "https://placehold.co/190x200?text=ex5",
            "https://placehold.co/190x200?text=ex6"
        ]
    },
    {
        title: "아침의 시작",
        date: "2022.01.",
        text: "작품 설명 3: 이 작품은 새로운 하루의 시작을 그렸습니다. 밝은 색감과 함께 희망을 나타내는 그림입니다.",
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
    const gifUrl = location.state?.gifUrl; // Passed GIF URL

    const [currentIndex, setCurrentIndex] = useState(0);
    const [fadeIn, setFadeIn] = useState(true);
    const [scrollTop, setScrollTop] = useState(0);
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
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSelectPlace = () => {
        console.log('Selected background:', currentIndex+1);
        navigate('/postcardcreation', { state: { selectedBackground: currentIndex+1, gifUrl: gifUrl, models:location.state?.models} });
    };
    

    return (
        <div>
            <Header title="장소 정하기" needthird = {false} />
            <div id="containers" style={{display:'flex',flexDirection:'column', overflowY: 'scroll', height: 'calc(100vh - 58px)' }}>
                <div id='topsection' style={{ 
                    display:'flex',
                    flexDirection:'column', 
                    backgroundColor:'#F8F6F1', 
                    textAlign: 'center', 
                    height: '100%',
                    alignItems: 'center',
                    justifyContent: 'center', /* 수평 가운데 정렬 추가 */
                    textAlign: 'center', /* 텍스트 가운데 정렬 추가 */
                    position: 'relative',
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
                        <p style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white' }}>
                            GIF URL not provided or loading...
                        </p>
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
                        <p id='workdescription'>{descriptions[currentIndex].text}</p>
                    </div>
    {/* 저작권 및 설명 텍스트 - 오른쪽 정렬 */}
    <span style={{ 
        color: '#9C9C9C', 
        fontSize: '8px', 
        position: 'absolute', 
        bottom: '5px',
        right: '10px', // 오른쪽 정렬을 위한 right 추가
        zIndex: 10, // 텍스트가 위에 위치하도록 z-index 추가
        margin: '10px'
    }}>
        * 해당 배경은 김화순 작가의 작품을 오마주하여 제작하였습니다.
    </span>

                    <hr style={{ 
                        width: '95%', 
                        margin: '10px auto', 
                        border: '1px solid  #E6E1DC', // 구분선 색상 및 투명도 조정
                        borderRadius: '10px' // 양끝 둥글게 설정
                    }} />
                </div>
                

                {/* 두 개의 버튼 */}
                <div style={{ 
                    textAlign: 'center', 
                    position: 'fixed', 
                    bottom: '20px', 
                    left: '50%', 
                    transform: 'translateX(-50%)', 
                    zIndex: 1000 
                }}>
                    <button 
                        onClick={scrollToBottom} 
                        style={{ 
                            padding: '10px 20px', 
                            fontSize: '16px', 
                            cursor: 'pointer',
                            backgroundColor: '#fff',
                            border: '1px solid #ccc',
                            borderRadius: '5px',
                            marginBottom: '10px',
                            display: fadeIn ? 'block' : 'none'
                        }}
                    >
                        원본 작품 보러가기
                    </button>
                    <button 
                        onClick={handleSelectPlace} 
                        style={{ 
                            padding: '10px 20px', 
                            fontSize: '16px', 
                            cursor: 'pointer',
                            backgroundColor: '#fff',
                            border: '1px solid #ccc',
                            borderRadius: '5px',
                            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
                        }}
                    >
                        이 장소로 선택하기
                    </button>
                </div>

                <div ref={descriptionRef} style={{ padding: '20px', backgroundColor: '#f4f4f4'}}>

                    <div style={{ textAlign: 'center', marginTop: '20px' }}>
                        <button 
                            onClick={scrollToTop} 
                            style={{ 
                                padding: '10px 20px', 
                                fontSize: '16px', 
                                cursor: 'pointer',
                                backgroundColor: '#fff',
                                border: 'none',
                                borderRadius: '5px',
                                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                                display: scrollTop > 0 ? 'block' : 'none'
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
    );
};

export default PlaceSelection;
