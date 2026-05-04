
const VideoButton = ({
    localFeedEl,
    callStatus,
    localStream,
    updateCallStatus,
    peerConnection
})=>{

    //handle user clicking on video button
    const startStopVideo = ()=>{
        if(!localStream){
            return
        }

        const copyCallStatus = {...callStatus}

        if(copyCallStatus.videoEnabled === true){
            copyCallStatus.videoEnabled = false
            updateCallStatus(copyCallStatus)
            const tracks = localStream.getVideoTracks()
            tracks.forEach(track => {
                track.enabled = false
            })
        }else if(copyCallStatus.videoEnabled === false){
             copyCallStatus.videoEnabled = true
            updateCallStatus(copyCallStatus)
            const tracks = localStream.getVideoTracks()
            tracks.forEach(track => {
                track.enabled = true
            })
        }else if(copyCallStatus.videoEnabled === null && peerConnection){
            console.log("starting video")
            copyCallStatus.videoEnabled = true
            updateCallStatus(copyCallStatus)
            localStream.getVideoTracks().forEach(track => {
                peerConnection.addTrack(track, localStream)
            })
        }

    }

    return(
        <div className="button-wrapper video-button">
            <div className="button control-button camera" onClick={startStopVideo}>
                <i className="fa fa-video"></i>
                <div className="btn-text">{callStatus.videoEnabled ? "Stop" : "Start"} Video</div>
            </div>
        </div>
    )
}
export default VideoButton;
