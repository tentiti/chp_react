import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const PostcardView = () => {
    const { id } = useParams();
    const [postcard, setPostcard] = useState(null);

    useEffect(() => {
        const fetchPostcard = async () => {
            try {
                const response = await axios.get(`https://localhost:8000/postcard/${id}`);
                console.log(response.data);  // 데이터가 제대로 로드되는지 확인
                setPostcard(response.data);
            } catch (error) {
                console.error('Error fetching postcard:', error);
                alert('포스트카드를 불러오는 중 오류가 발생했습니다.');
            }
        };
    
        fetchPostcard();
    }, [id]);
    

    if (!postcard) return <div>Loading...</div>;

    return (
        <div style={{ 
            width: '100vw', 
            height: '100vh', 
            backgroundColor: '#F8F6F1', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            position: 'relative'
        }}>
            <img 
                src={`https://placehold.co/393x852?text=${postcard.number}`} 
                alt="Background" 
                style={{ 
                    position: 'absolute', 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover', 
                    zIndex: 1 
                }} 
            />
            <div style={{ 
                zIndex: 2, 
                padding: '20px', 
                textAlign: 'center' 
            }}>
                <img 
                    src={postcard.gif_name} 
                    alt="GIF" 
                    style={{ 
                        width: '200px', 
                        height: '200px', 
                        objectFit: 'cover', 
                        borderRadius: '10px', 
                        marginBottom: '20px'
                    }} 
                />
                <h1>{postcard.name}</h1>
                <p>{postcard.comment}</p>
                <p>{new Date(postcard.timestamp).toLocaleString()}</p>
            </div>
        </div>
    );
};

export default PostcardView;
