import { closeSocketConnection } from "./socketConnection";

const cleanupCall = ({
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
}) => {
    localStream?.getTracks().forEach(track => track.stop())
    remoteStream?.getTracks().forEach(track => track.stop())

    if(localFeedEl?.current){
        localFeedEl.current.srcObject = null
    }

    if(remoteFeedEl?.current){
        remoteFeedEl.current.srcObject = null
    }

    if(peerConnection && peerConnection.signalingState !== "closed"){
        peerConnection.getSenders().forEach(sender => {
            if(sender.track){
                sender.track.stop()
            }
        })
        peerConnection.close()
    }

    setLocalStream(null)
    setRemoteStream(null)
    setPeerConnection(null)
    updateCallStatus({})

    if(setOfferData){
        setOfferData(null)
    }

    closeSocketConnection()
}

export default cleanupCall
