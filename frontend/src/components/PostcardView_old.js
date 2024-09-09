import React, { useRef, useEffect, useState } from 'react';
import RecordRTC from 'recordrtc';
import axios from 'axios';
import Header from './Header';
import { useParams } from 'react-router-dom';
import './PostcardView.css';

const backgrounds = [
  "/static/stockimages/bg1.png",
  "https://placehold.co/300x375?text=bg1",
  "https://placehold.co/300x375?text=bg2",
  "https://placehold.co/300x375?text=bg3",
];

const PostcardView = () => {
  const { id } = useParams();
  const [postcard, setPostcard] = useState(null);
  const recorderRef = useRef(null);
  const videoContainerRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState(null);

  useEffect(() => {
    const fetchPostcard = async () => {
      try {
        const response = await axios.get(`https://127.0.0.1:8000/postcard/${id}`, { cache: 'no-cache' });
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

  const startRecording = async () => {
    const createdImagesElement = document.getElementById('createdImages');
  
    if (!createdImagesElement) {
      console.error('createdImages element not found.');
      return;
    }
  
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ 
        video: { 
          displaySurface: "browser",
          logicalSurface: true,
          cursor: "never"
        } 
      });
  
      // 스트림에서 비디오 트랙을 가져옵니다
      const videoTrack = stream.getVideoTracks()[0];
  
      // 캡처할 영역을 정의합니다
      const trackSettings = videoTrack.getSettings();
      const displaySurface = trackSettings.displaySurface;
  
      if (displaySurface !== 'browser') {
        console.error('Please select the browser tab.');
        stream.getTracks().forEach(track => track.stop());
        return;
      }
  
      // createdImages 요소의 위치와 크기를 가져옵니다
      const rect = createdImagesElement.getBoundingClientRect();
  
      // 캡처 영역을 설정합니다
      await videoTrack.applyConstraints({
        advanced: [{
          cropTo: {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          }
        }]
      });
  
      const newRecorder = new RecordRTC(stream, {
        type: 'video',
        mimeType: 'video/webm',
        bitsPerSecond: 800000,
      });
  
      newRecorder.startRecording();
      recorderRef.current = newRecorder;
      setIsRecording(true);
  
      setTimeout(() => stopRecording(stream), 3000);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('녹화를 시작하는 데 문제가 발생했습니다: ' + error.message);
    }
  };
  
  const stopRecording = (stream) => {
    if (recorderRef.current) {
      recorderRef.current.stopRecording(() => {
        const blob = recorderRef.current.getBlob();
        setRecordingBlob(blob);
        setIsRecording(false);
  
        // 스트림 정리
        stream.getTracks().forEach(track => track.stop());
      });
    }
  };

  const shareRecording = async () => {
    if (!recordingBlob) return;

    const file = new File([recordingBlob], 'postcard-animation.mp4', { type: 'video/mp4' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'My Postcard Animation',
          text: 'Check out this cool animation!',
        });
      } catch (error) {
        console.error('Error sharing video:', error);
      }
    } else {
      const url = URL.createObjectURL(recordingBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'postcard-animation.mp4';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        height:'58px',
        position: 'fixed',
        top: '0',
        width: '100vw',
      }}>
        <Header title={`'${postcard.name}'의 춤사위`} />
      </div>

      <div id="createdImages" style={{
        position: 'fixed',
        top: '58px',
        width: '100vw',
        height: 'calc(100% - 58px)',
        backgroundColor: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start'
      }}>
        <div style={{
          marginTop: '70px',
        }}>
          <div
            ref={videoContainerRef}
            style={{
              width: '310px',
              height: '390px',
              margin: '0 auto',
              backgroundImage: `url(${backgrounds[postcard.number]})`,
              backgroundSize: 'cover',
              position: 'relative',
            }}
          >
            {postcard.gif_name && (
              <img
                src={`https://localhost:8000/uploads/${postcard.gif_name}`}
                alt="GIF"
                style={{
                  position: 'absolute',
                  top: '254px',
                  left: '96px',
                  transform: 'translate(-50%, -50%)',
                  width: '116px',
                  height: '150px',
                }}
              />
            )}
          </div>
        </div>
      
        <div
          style={{
            marginTop: '20px',
            width: '100vw',
            color: 'white',
            fontSize: '20px',
            textAlign: 'center',
            fontFamily:'Cafe24Simplehae, sans-serif',
            backgroundColor: 'salmon',
          }}
        >
          내용 {postcard.comment}
        </div>

        <div
          style={{
            width: '100vw',
            color: 'white',
            fontSize: '20px',
            textAlign: 'center',
            fontFamily:'Cafe24Simplehae, sans-serif',
            backgroundColor: 'salmon',
          }}
        >
          {postcard.timestamp}
        </div>

        <div
          style={{
            marginTop: '12px',
            width: '100vw',
            color: 'white',
            fontSize: '20px',
            textAlign: 'center',
            fontFamily:'Cafe24Simplehae, sans-serif',
            backgroundColor: 'salmon',
          }}
        >
          이름 {postcard.name}
        </div>

        <div style={{ textAlign: 'center'}}>
          {!isRecording && (
            <button onClick={startRecording}>
              Start Recording
            </button>
          )}
          {recordingBlob && (
            <button onClick={shareRecording}>
              Share or Download Video
            </button>
          )}
        </div>
      </div>

      <div id="footer" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '80px',
        backgroundColor: '#F8F6F1',
        borderTop: '1px solid #E6E1DC',
      }}>
        <button
          style={{
            position: 'absolute',
            left: '50%',
            bottom: '20px',
            transform: 'translateX(-50%)',
            width: '170px',
            height: '35px',
            backgroundColor: '#F8F6F1',
            border: '1px solid #E6E1DC',
            color: '#412823',
            boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.25)',
            fontSize: '16px',
            cursor: 'pointer',
          }}
        >
          저장하기
        </button>

        <button
          style={{
            position: 'absolute',
            left: '50%',
            bottom: '20px',
            transform: 'translateX(-50%)',
            width: '170px',
            height: '35px',
            backgroundColor: '#F8F6F1',
            border: '1px solid #E6E1DC',
            color: '#412823',
            boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.25)',
            fontSize: '16px',
            cursor: 'pointer',
          }}
        >
          인스타그램 공유하기
        </button>
      </div>
    </div>
  );
};

export default PostcardView;