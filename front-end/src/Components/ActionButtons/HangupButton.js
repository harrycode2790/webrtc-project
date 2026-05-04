
import { useNavigate } from "react-router-dom";
import socketConnection from "../../webrtcUtilities/socketConnection";
import cleanupCall from "../../webrtcUtilities/cleanupCall";

const HangupButton = ({
    remoteFeedEl,
    localFeedEl,
    peerConnection,
    callStatus,
    localStream,
    remoteStream,
    updateCallStatus,
    setLocalStream,
    setRemoteStream,
    setPeerConnection,
    setOfferData,
    userName
})=>{
    const navigate = useNavigate()

    const hangupCall = ()=>{
        if(userName){
            const socket = socketConnection(userName)
            socket.emit("hangup", {
                role: callStatus.myRole,
                userName
            })
        }

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

    return(
        <button 
            onClick={hangupCall} 
            className="hangup-button"
        >Hang Up</button>
    )
}

export default HangupButton
