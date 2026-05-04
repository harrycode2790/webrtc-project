import { useEffect, useRef, useState } from "react";
import './VideoPage.css'
import { useNavigate } from 'react-router-dom';
import socketConnection from '../webrtcUtilities/socketConnection'
import clientSocketListeners from "../webrtcUtilities/clientSocketListeners";
import cleanupCall from "../webrtcUtilities/cleanupCall";
import ActionButtons from './ActionButtons/ActionButtons'
import VideoMessageBox from "./VideoMessageBox";

const AnswerVideo = ({remoteStream, localStream,peerConnection,
    setLocalStream,setRemoteStream,setPeerConnection,
    callStatus,updateCallStatus,offerData,setOfferData,userName})=>{
    const remoteFeedEl = useRef(null); //this is a React ref to a dom element, so we can interact with it the React way
    const localFeedEl = useRef(null); //this is a React ref to a dom element, so we can interact with it the React way
    const navigate = useNavigate();
    const [ videoMessage, setVideoMessage ] = useState("Please enable video to start!")
    const [ answerCreated, setAnswerCreated ] = useState(false)
    
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

    // //set video tags
    // useEffect(()=>{

    // },[])

    //hide the status message once media tracks are present
    useEffect(() => {
        const syncVideoMessage = () => {
            const localTrackCount = localStream?.getTracks().length || 0
            const remoteTrackCount = remoteStream?.getTracks().length || 0

            if(localTrackCount || remoteTrackCount){
                setVideoMessage("")
            }
        }

        syncVideoMessage()

        localStream?.addEventListener("addtrack", syncVideoMessage)
        remoteStream?.addEventListener("addtrack", syncVideoMessage)

        return () => {
            localStream?.removeEventListener("addtrack", syncVideoMessage)
            remoteStream?.removeEventListener("addtrack", syncVideoMessage)
        }
    }, [localStream, remoteStream])

    //User has enabled video, but not made answer
    useEffect(()=>{
        const addOfferAndCreateAnswerAsync = async()=>{
            if(!peerConnection || !offerData?.offer){
                return
            }

            await peerConnection.setRemoteDescription(offerData.offer)
            const pendingCandidates = peerConnection.pendingRemoteCandidates || []
            for (const candidate of pendingCandidates) {
                await peerConnection.addIceCandidate(candidate)
            }
            peerConnection.pendingRemoteCandidates = []
            console.log(peerConnection.signalingState)
            console.log("remote description set, creating answer")
            const answer = await peerConnection.createAnswer()
            await peerConnection.setLocalDescription(answer)
            const copyOfferData = {...offerData}
            copyOfferData.answer = answer
            copyOfferData.answererUserName = userName
            const socket = socketConnection(userName)
            const offerIceCandidates = await socket.emitWithAck("newAnswer", copyOfferData)
            for (const candidate of offerIceCandidates) {
                await peerConnection.addIceCandidate(candidate)
            }
            setAnswerCreated(true)
            setVideoMessage("")
            console.log("answer created and sent to signaling server")
        }
        if(callStatus.videoEnabled && !answerCreated){
            addOfferAndCreateAnswerAsync()
        }
    },[callStatus.videoEnabled,answerCreated, offerData, peerConnection, userName])

    useEffect(() => {
        if (peerConnection && userName) {
            const socket = socketConnection(userName)
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
                })
                navigate("/")
            }

            return clientSocketListeners(
                socket,
                "answer",
                callStatus,
                updateCallStatus,
                peerConnection,
                handleRemoteHangup
            )
        }
    }, [peerConnection, userName, updateCallStatus, callStatus, localStream, remoteStream, setLocalStream, setRemoteStream, setPeerConnection, setOfferData, navigate])
    

    return (
        <div className="call-page">
            <div className="videos">
                <VideoMessageBox message={videoMessage} />
                <video id="local-feed" ref={localFeedEl} autoPlay controls playsInline muted></video>
                <video id="remote-feed" ref={remoteFeedEl} autoPlay controls playsInline></video> 
            </div>
            <div className="call-footer">
                <div className="call-status-pill">Answer View</div>
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
    )
}

export default AnswerVideo
