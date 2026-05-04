const AudioButton = ({callStatus, updateCallStatus, localStream, peerConnection})=>{

    let micText;
    if(callStatus.audio === "off"){
        micText = "Join Audio"
    }else if(callStatus.audio === "enabled"){
        micText = "Mute"
    }else{
        micText = "Unmute"
    }

    const startStopAudio = ()=>{
        const copyCallStatus = {...callStatus}
        //first, check if the audio is enabled, if so disabled
        if(callStatus.audioEnabled === true){
            //update redux callStatus
            copyCallStatus.audioEnabled = false
            updateCallStatus(copyCallStatus)
            //set the stream to disabled
            const tracks = localStream.getAudioTracks();
            tracks.forEach(t=>t.enabled = false);
        }else if(callStatus.audioEnabled === false){
        //second, check if the audio is disabled, if so enable
            //update redux callStatus
            copyCallStatus.audioEnabled = true
            updateCallStatus(copyCallStatus)
            const tracks = localStream.getAudioTracks();
            tracks.forEach(t=>t.enabled = true);
        }else{
            //audio is "off" What do we do?
            // changeAudioDevice({target:{value:"inputdefault"}})
            //add the tracks 
            localStream.getAudioTracks().forEach(t=>{
                peerConnection.addTrack(t,localStream);
            })
        }
    }

    return(
        <div className="button-wrapper">
            <div className="button control-button mic" onClick={startStopAudio}>
                <i className="fa fa-microphone"></i>
                <div className="btn-text">{micText}</div>
            </div>
        </div>        
    )
}

export default AudioButton
