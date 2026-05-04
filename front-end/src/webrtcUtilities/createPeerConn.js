import peerConfiguration from './stunServers'
import socketConnection from "./socketConnection";

const createPeerConnection = (userName,typeOfCall)=>{
    //init socket connection
    const socket = socketConnection(userName) 
    try{
        const peerConnection = new RTCPeerConnection(peerConfiguration);
        //RTCPeerConnection is how WebRTC connects to another browser (peer).
        //It takes a config object, which (here) is just stun servers
        //STUN servers get our ICE candidates
        const remoteStream = new MediaStream();

        //peerConnection listeners

        peerConnection.addEventListener("signalingstatechange", (e)=>{
            console.log("signaling state change",)
            console.log(e)
            console.log(peerConnection.signalingState)
        })

        peerConnection.addEventListener("icecandidate", (e)=>{
            console.log("new ice candidate", e)
            if(e.candidate){
                socket.emit("sendIceCandidateToSignalingServer", {
                    iceCandidate: e.candidate,
                    iceUserName: userName,
                    didIOffer: typeOfCall === "offer" 
                })
            }
        })


        peerConnection.addEventListener("track", (e)=>{
            e.streams[0].getTracks().forEach(track => {
                const hasTrackAlready = remoteStream.getTracks().some(existingTrack => existingTrack.id === track.id)
                if(!hasTrackAlready){
                    remoteStream.addTrack(track)
                }
                console.log("this should add some  video/audio  to the remote feed...")
            })
        })


        return({
            peerConnection,
            remoteStream,
        })
    }catch(err){
        console.log(err)
    }
}

export default createPeerConnection
