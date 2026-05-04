import { useEffect, useRef, useState } from "react";
import "./VideoPage.css";
import { useNavigate } from "react-router-dom";
import socketConnection from "../webrtcUtilities/socketConnection";
import clientSocketListeners from "../webrtcUtilities/clientSocketListeners";
import cleanupCall from "../webrtcUtilities/cleanupCall";
import ActionButtons from "./ActionButtons/ActionButtons";
import VideoMessageBox from "./VideoMessageBox";

const CallerVideo = ({
  remoteStream,
  localStream,
  setLocalStream,
  setRemoteStream,
  peerConnection,
  setPeerConnection,
  callStatus,
  updateCallStatus,
  userName,
  setOfferData,
}) => {
  const remoteFeedEl = useRef(null); //this is a React ref to a dom element, so we can interact with it the React way
  const localFeedEl = useRef(null); //this is a React ref to a dom element, so we can interact with it the React way
  const navigate = useNavigate();
  const [videoMessage, setVideoMessage] = useState(
    "Please enable video to start!",
  );
  const [offerCreated, setOfferCreated] = useState(false);

  //send back to home if no localStream
  useEffect(() => {
    if (!localStream) {
      navigate("/");
      return;
    }

    if (remoteFeedEl.current) {
      remoteFeedEl.current.srcObject = remoteStream;
    }
    if (localFeedEl.current) {
      localFeedEl.current.srcObject = localStream;
    }
  }, [localStream, remoteStream, navigate]);

  useEffect(() => {
    const syncRemoteFeed = async () => {
      if (!remoteFeedEl.current || !remoteStream) {
        return;
      }

      remoteFeedEl.current.srcObject = remoteStream;

      if (remoteStream.getTracks().length) {
        setVideoMessage("");
        try {
          await remoteFeedEl.current.play();
        } catch (err) {
          console.log("remote feed play interrupted", err);
        }
      }
    };

    syncRemoteFeed();
    remoteStream?.addEventListener("addtrack", syncRemoteFeed);

    return () => {
      remoteStream?.removeEventListener("addtrack", syncRemoteFeed);
    };
  }, [remoteStream]);

  //set video tags
//   useEffect(() => {}, []);

  //if we have local tracks, disable the setup message
  useEffect(() => {
    if (peerConnection?.getSenders().length) {
      setVideoMessage("");
    }
  }, [peerConnection]);

  //once the user has shared video, start WebRTC'ing :)
  useEffect(() => {
    const shareVideoAsync = async () => {
        if (!peerConnection) {
          return
        }

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        const socket = socketConnection(userName)
        socket.emit("newOffer", offer)
        setOfferCreated(true)
        setVideoMessage("Waiting for someone to answer...")
        console.log("offer created and sent to signaling server")
    }
    if(!offerCreated && callStatus.videoEnabled && peerConnection){
        // create a n offer
        console.log("creating offer")
        shareVideoAsync()
    }
  }, [callStatus.videoEnabled, offerCreated, peerConnection, userName]);

  useEffect(() => {
    console.log(callStatus);
    const addAnswerAsync = async () => {
      if (!peerConnection) {
        return;
      }

      await peerConnection.setRemoteDescription(callStatus.answer);
      const pendingCandidates = peerConnection.pendingRemoteCandidates || [];
      for (const candidate of pendingCandidates) {
        await peerConnection.addIceCandidate(candidate);
      }
      peerConnection.pendingRemoteCandidates = [];
      console.log(peerConnection.signalingState);
      console.log("Answer added!");
      setVideoMessage("");
    };
    if (callStatus.answer) {
      addAnswerAsync();
    }
  }, [callStatus, peerConnection]);

  useEffect(() => {
    if (peerConnection && userName) {
      const socket = socketConnection(userName);
      const handleRemoteHangup = () => {
        cleanupCall({
          localFeedEl,
          remoteFeedEl,
          localStream,
          remoteStream,
          peerConnection,
          setLocalStream,
          setRemoteStream,
          setPeerConnection,
          updateCallStatus,
          setOfferData
        });
        navigate("/");
      };

      return clientSocketListeners(
        socket,
        "offer",
        callStatus,
        updateCallStatus,
        peerConnection,
        handleRemoteHangup,
      );
    }
  }, [peerConnection, userName, updateCallStatus, callStatus, localStream, remoteStream, setLocalStream, setRemoteStream, setPeerConnection, setOfferData, navigate]);

  return (
    <div className="call-page">
      <div className="videos">
        <VideoMessageBox message={videoMessage} />
        <video
          id="local-feed"
          ref={localFeedEl}
          autoPlay
          controls
          playsInline
          muted
        ></video>
        <video
          id="remote-feed"
          ref={remoteFeedEl}
          autoPlay
          controls
          playsInline
        ></video>
      </div>
      <div className="call-footer">
        <div className="call-status-pill">Caller View</div>
        <ActionButtons
          localFeedEl={localFeedEl}
          remoteFeedEl={remoteFeedEl}
          callStatus={callStatus}
          localStream={localStream}
          remoteStream={remoteStream}
          updateCallStatus={updateCallStatus}
          peerConnection={peerConnection}
          setLocalStream={setLocalStream}
          setRemoteStream={setRemoteStream}
          setPeerConnection={setPeerConnection}
          setOfferData={setOfferData}
          userName={userName}
        />
      </div>
    </div>
  );
};

export default CallerVideo;
