
const clientSocketListeners = (socket,typeOfCall,callStatus,
    updateCallStatus,peerConnection,onCallEnded)=>{
    const handleAnswerResponse = entireOfferObj=>{
        console.log(entireOfferObj);
        updateCallStatus(prev => ({
            ...prev,
            answer: entireOfferObj.answer,
            myRole: typeOfCall
        }))
    }

    const handleIceCandidate = async iceC=>{
        if(iceC){
            if(!peerConnection.remoteDescription){
                if(!peerConnection.pendingRemoteCandidates){
                    peerConnection.pendingRemoteCandidates = []
                }
                peerConnection.pendingRemoteCandidates.push(iceC)
                console.log("Queued ice candidate until remote description is ready")
                return
            }

            await peerConnection.addIceCandidate(iceC);
            console.log(iceC)
            console.log("Added an iceCandidate to existing page presence")
            // setShowCallInfo(false);
        }
    }

    socket.on('answerResponse', handleAnswerResponse)
    socket.on('receivedIceCandidateFromServer', handleIceCandidate)
    if(onCallEnded){
        socket.on('callEnded', onCallEnded)
    }

    return ()=>{
        socket.off('answerResponse', handleAnswerResponse)
        socket.off('receivedIceCandidateFromServer', handleIceCandidate)
        if(onCallEnded){
            socket.off('callEnded', onCallEnded)
        }
    }
}

export default clientSocketListeners
