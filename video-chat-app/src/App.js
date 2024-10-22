import React, { useRef, useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io('https://glowing-spoon-7g4wqw4j7wfxwxq-5000.app.github.dev/'); // Connect to the backend server

function App() {
  const [isCalling, setIsCalling] = useState(false);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const localStream = useRef(null);

  useEffect(() => {
    // Request access to the user's webcam and microphone
    async function getMedia() {
      try {
        localStream.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideoRef.current.srcObject = localStream.current;
      } catch (error) {
        console.error('Error accessing media devices:', error);
      }
    }

    getMedia();

    // WebSocket listeners for WebRTC signaling messages
    socket.on('offer', handleReceiveOffer);
    socket.on('answer', handleReceiveAnswer);
    socket.on('ice-candidate', handleNewICECandidateMsg);

    return () => {
      socket.off('offer', handleReceiveOffer);
      socket.off('answer', handleReceiveAnswer);
      socket.off('ice-candidate', handleNewICECandidateMsg);
    };
  }, []);

  const handleReceiveOffer = async (offer) => {
    if (!peerConnection.current) createPeerConnection();

    await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));

    const answer = await peerConnection.current.createAnswer();
    await peerConnection.current.setLocalDescription(answer);

    socket.emit('answer', answer);
  };

  const handleReceiveAnswer = async (answer) => {
    const remoteDesc = new RTCSessionDescription(answer);
    await peerConnection.current.setRemoteDescription(remoteDesc);
  };

  const handleNewICECandidateMsg = (message) => {
    const candidate = new RTCIceCandidate(message);
    peerConnection.current.addIceCandidate(candidate);
  };

  const createPeerConnection = () => {
    peerConnection.current = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    // Add local tracks to the peer connection
    localStream.current.getTracks().forEach((track) => {
      peerConnection.current.addTrack(track, localStream.current);
    });

    // Handle remote stream track
    peerConnection.current.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    // Handle ICE candidate generation
    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', event.candidate);
      }
    };
  };

  const startCall = async () => {
    setIsCalling(true);
    createPeerConnection();

    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);

    socket.emit('offer', offer);
  };

  return (
    <div className="App">
      <h1>Video Call App</h1>
      <div>
        <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '300px' }}></video>
        <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '300px' }}></video>
      </div>
      <button onClick={startCall} disabled={isCalling}>Start Call</button>
    </div>
  );
}

export default App;