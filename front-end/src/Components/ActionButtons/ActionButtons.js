import HangupButton from './HangupButton'
import VideoButton from './VideoButton';
import AudioButton from './AudioButton';

const ActionButtons = ({
    callStatus,
    localFeedEl,
    remoteFeedEl,
    updateCallStatus,
    localStream,
    remoteStream,
    peerConnection,
    setLocalStream,
    setRemoteStream,
    setPeerConnection,
    setOfferData,
    userName
})=>{
    return(
        <div id="menu-buttons" className="control-dock">
            <div className="control-group">
                <AudioButton 
                    localFeedEl={localFeedEl}
                    callStatus={callStatus}
                    updateCallStatus={updateCallStatus}
                    localStream={localStream}
                    peerConnection={peerConnection}                    
                />
                <VideoButton 
                    localFeedEl={localFeedEl}
                    callStatus={callStatus}
                    localStream={localStream}
                    updateCallStatus={updateCallStatus}
                    peerConnection={peerConnection}
                />
            </div>
            <div className="control-group control-group-danger">
                <HangupButton
                    localFeedEl={localFeedEl}
                    remoteFeedEl={remoteFeedEl}
                    peerConnection={peerConnection}
                    callStatus={callStatus}
                    updateCallStatus={updateCallStatus}
                    localStream={localStream}
                    remoteStream={remoteStream}
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

export default ActionButtons;
