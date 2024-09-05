import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from './Header'; // 헤더 컴포넌트 불러오기
import './CreateCharacter.css'; // CSS 파일 불러오기

const backgrounds = [
    "https://placehold.co/390x500?text=bg1",
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
            <Header title="장소 정하기" />
            <div id="container" style={{ marginTop: '58px', overflowY: 'auto', height: 'calc(100vh - 58px)' }}>
                <div style={{ position: 'relative', textAlign: 'center', height: '500px', overflow: 'hidden' }}>
                    <img 
                        src={backgrounds[currentIndex]} // Dynamic background image
                        alt="Background"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {gifUrl ? (
                        <img 
                            src={gifUrl} 
                            alt="Generated GIF" 
                            style={{ 
                                position: 'absolute', 
                                top: '50%', 
                                left: '50%', 
                                transform: 'translate(-50%, -50%)', 
                                width: '50%', // Adjust size as needed
                                height: 'auto'
                            }} 
                        />
                    ) : (
                        <p style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white' }}>
                            GIF URL not provided or loading...
                        </p>
                    )}
                    {/* Left Arrow */}
                    {currentIndex > 0 && (
                        <div 
                            style={{ 
                                position: 'absolute', 
                                top: '50%', 
                                left: '10px', 
                                transform: 'translateY(-50%)', 
                                cursor: 'pointer',
                                zIndex: 1000
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
                                top: '50%', 
                                right: '10px', 
                                transform: 'translateY(-50%)', 
                                cursor: 'pointer',
                                zIndex: 1000
                            }}
                            onClick={handleNext}
                        >
                            &#9654; {/* Unicode for right arrow */}
                        </div>
                    )}
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

                {/* Description Section */}
                <div ref={descriptionRef} style={{ padding: '20px', backgroundColor: '#f4f4f4', minHeight: '100vh' }}>
                    <h2>{descriptions[currentIndex].title}</h2>
                    <p>{descriptions[currentIndex].date}</p>
                    <p>{descriptions[currentIndex].text}</p>
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
