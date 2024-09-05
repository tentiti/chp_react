import React, { useRef, useEffect, useState } from 'react';
import RecordRTC from 'recordrtc';
import axios from 'axios';
import { useParams } from 'react-router-dom';  // useParams 사용

const PostcardView = () => {
  const { id } = useParams();  // useParams로 id 받아오기
  const [postcard, setPostcard] = useState(null);
  const recorderRef = useRef(null);
  const videoContainerRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState(null);

  useEffect(() => {
    const fetchPostcard = async () => {
      try {
        if (!id) {
          throw new Error('Postcard ID is undefined.');
        }
        const response = await axios.get(`https://127.0.0.1:8000/postcard/${id}`);
        setPostcard(response.data);
      } catch (error) {
        console.error('Error fetching postcard:', error);
        alert('포스트카드를 불러오는 중 오류가 발생했습니다.');
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
    <div>
      {postcard && (
        <div
          ref={videoContainerRef}
          style={{
            position: 'relative',
            width: '360px',
            height: '640px',
            margin: '0 auto',
            backgroundImage: `url(https://localhost:8000/uploads/${postcard.background})`,
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
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '200px',
                height: '200px',
              }}
            />
          )}
          {/* 텍스트 */}
          <div
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              color: 'white',
              fontSize: '20px',
              textAlign: 'center',
            }}
          >
            <h1>{postcard.name}</h1>
            <p>{postcard.comment}</p>
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
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
  );
};

export default PostcardView;
