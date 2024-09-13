import React, { useRef, useEffect, useState } from 'react';
import axios from 'axios';
import Header from './Header';
import { useParams } from 'react-router-dom';
import './PostcardView.css';

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

const PostcardShareView = () => {
  const { id } = useParams();
  const [postcard, setPostcard] = useState(null);
  const videoContainerRef = useRef(null);

  useEffect(() => {
    const fetchPostcard = async () => {
      try {
        const response = await axios.get(`/api/postcard/${id}`, { cache: 'no-cache' });
        if (response.status === 200) {
          setPostcard(response.data);
        } else {
          console.error('Error fetching postcard:', response.status);
        }
      } catch (error) {
        console.error('Network error:', error);
      }
      
    };

    fetchPostcard();
  }, [id]);

  if (!postcard) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      left: '0',
    }}>
      <div style={{
        height:'58px',
        position: 'fixed',
        top: '0',
        width: '100vw',
      }}>
      <Header title={`'${postcard.name}'의 춤사위`} needthird={false} />
      </div>
      <img 
            src="/static/stockimages/sharebackground.png" 
            alt="Postcard Background" 
            style={{
              position: 'fixed',
              top: '58px',
              width:'100vw',
              height:'auto',
              backgroundSize: 'cover', // Ensures the image covers the entire container
              backgroundPosition: 'center', // Centers the image
              zIndex: '-1',
            }}
      />

      <div id="createdImages" style={{
        position: 'fixed',
        top: '58px',
        width: '100vw',
        height: 'calc(100% - 58px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        backgroundImage: '/static/stockimages/sharebackground.png',
      }}>

        <div style={{
          marginTop: '100px',
          zIndex: '1',
        }}>
          <div
            ref={videoContainerRef}
            style={{
              width: '300px',
              height: '380px',
              margin: '0 auto',
              backgroundImage: `url(${backgrounds[postcard.number]})`,
              backgroundSize: 'cover',
              position: 'relative',
            }}
          >
            {postcard.gif_name && (
              <img
                src={`/api/uploads/${postcard.gif_name}`}
                alt="GIF"
                style={{
                  position: 'absolute',
                  top: `calc(${modelPositions[postcard.number].y}px * 0.8)`,
                  left: `calc(${modelPositions[postcard.number].x}px * 0.8)`,
                  width: `calc(${modelPositions[postcard.number].width}px * 0.8)`,
                  height: `calc(${modelPositions[postcard.number].width}px * 0.8)`,
                }}
              />
            )}
          </div>
        </div>
      
        <div
          style={{
            marginTop: '-6px',
            width: '80vw',
            color: '#412823', // Moved this up since it was declared twice
            fontSize: '16px',
            textAlign: 'center',
            lineHeight: '1.6',
            fontFamily: 'Cafe24Simplehae, sans-serif',
            wordWrap: 'break-word', // Ensures words break to the next line if too long
            overflowWrap: 'break-word', // Ensures long words or strings (e.g., URLs) will wrap
            whiteSpace: 'normal', // Ensures text wraps normally
            overflow: 'hidden', // Optional: prevents overflow of content
            minHeight:'53px',
          }}
        >
          {/* 내용 */}
          {postcard.comment}
        </div>


        <div
          style={{
            marginTop: '5px',
            width: '80vw',
            color: '#412823', // Moved this up since it was declared twice
            fontSize: '8px',
            textAlign: 'center',
            lineHeight: '1.6',
            fontFamily: 'Cafe24Simplehae, sans-serif',
            wordWrap: 'break-word', // Ensures words break to the next line if too long// Ensures text wraps normally
            overflow: 'hidden', // Optional: prevents overflow of content
          }}
        >
          {postcard.timestamp}
        </div>

        <div
          style={{
            marginTop: '15px',
            width: 'calc(100vw - 250px)', // Subtract 250px from the full width
            color: '#412823', // Moved color up since it was declared twice
            fontSize: '8px',
            fontFamily: 'pretandard, sans-serif',
            position: 'relative', // Use relative positioning for left offset
            left: '105px', // Offset from the left
            textAlign: 'center', // Centers the text within the remaining space
          }}
        >
          {postcard.name}
        </div>


      <footer>
        <div>2024. 10. 12 - 10.29.</div>
        <div className="footerBorder">|</div>
        <a href="https://google.com">김화순 개인전</a>
        <div className="footerBorder">|</div>
        <a href="https://google.com">자하미술관</a>
      </footer>
      </div>

    </div>
  );
};

export default PostcardShareView;