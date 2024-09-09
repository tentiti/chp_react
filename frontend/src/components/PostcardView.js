import React, { useRef, useEffect, useState } from 'react';
import RecordRTC from 'recordrtc';
import axios from 'axios';
import Header from './Header';
import { useParams } from 'react-router-dom';  // useParams 사용
import './PostcardView.css';

const backgrounds = [
  "/static/stockimages/bg1.png",
  "src(https://placehold.co/300x375?text=bg1)",
  "src(https://placehold.co/300x375?text=bg2)",
  "src(https://placehold.co/300x375?text=bg3)",
];

const PostcardView = () => {
  const { id } = useParams();  // useParams로 id 받아오기
  // alert(id);
  const [postcard, setPostcard] = useState(null);
  const recorderRef = useRef(null);
  const videoContainerRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState(null);

  useEffect(() => {
    const fetchPostcard = async () => {
      try {
        const response = axios.get('https://127.0.0.1:8000/postcard/${id}', { cache: 'no-cache' });
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

  const startRecording = () => {
    const videoContainer = videoContainerRef.current;

    if (!videoContainer || !videoContainer.captureStream) {
      console.error('Canvas capture is not supported on this browser.');
      alert('녹화 기능을 지원하지 않는 브라우저입니다.');
      return;
    }

    const stream = videoContainer.captureStream(30); // 30fps로 캡처
    const newRecorder = new RecordRTC(stream, {
      type: 'video',
      mimeType: 'video/webm', // MP4로 저장할 경우 브라우저 지원 여부에 유의
      bitsPerSecond: 800000,  // 비디오 품질 설정
    });

    newRecorder.startRecording();
    recorderRef.current = newRecorder;
    setIsRecording(true);

    // 3초 후 녹화 중지
    setTimeout(() => stopRecording(), 3000);
  };

  const stopRecording = () => {
    if (recorderRef.current) {
      recorderRef.current.stopRecording(() => {
        const blob = recorderRef.current.getBlob();
        setRecordingBlob(blob);
        setIsRecording(false);
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
      // 다운로드로 대체
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
            {postcard && (
            <div
              ref={videoContainerRef}
              style={{
                width: '310px',
                height: '390px',
                margin: '0 auto',
                backgroundImage: backgrounds[postcard.number],
                backgroundSize: 'cover',
              }}
            >
              {/* GIF 이미지 */}
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
          )}
        </div>
      
      
      <div
            style={{
              marginTop: '20px',
              width: '100vw',
              color: 'white',
              fontSize: '20px',
              textAlign: 'center',
              fontFamily:'Cafe24Simplehae, sans-serif',
              backgroundColor: 'red',
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
              backgroundColor: 'red',
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
              backgroundColor: 'red',
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
              // onClick={}
              style={{
                  position: 'absolute',
                  left: '50%',
                  bottom: '20px',
                  transform: 'translateX(-50%)',
                  width: '170px',
                  height: '35px',
                  backgroundColor: '#F8F6F1',
                  border: '1px solid E6E1DC',
                  color: '#412823',
                  boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.25)',
                  fontSize: '16px',
                  cursor: 'pointer',
          }}
          >
              저장하기
          </button>

          <button
              // onClick={}
              style={{
                  position: 'absolute',
                  left: '50%',
                  bottom: '20px',
                  transform: 'translateX(-50%)',
                  width: '170px',
                  height: '35px',
                  backgroundColor: '#F8F6F1',
                  border: '1px solid E6E1DC',
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
