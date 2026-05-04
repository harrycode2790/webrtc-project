const VideoMessage = ({message}) => {
    if(message){
        return <div className="call-info"> <p>{message}</p></div>
    } else{
        return <></>
    }
}

export default VideoMessage
