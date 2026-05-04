import { useEffect } from 'react'
import prepForCall from '../webrtcUtilities/prepForCall'
import socketConnection from '../webrtcUtilities/socketConnection'
import { useState } from 'react'
import createPeerConnection from '../webrtcUtilities/createPeerConn'
import { useNavigate } from 'react-router-dom';

const Home = ({callStatus,updateCallStatus,setLocalStream,
    setRemoteStream,remoteStream,peerConnection,setPeerConnection,
    localStream,userName, setUserName,offerData,setOfferData})=>{

    const [ typeOfCall, setTypeOfCall ] = useState()
    const [joined, setJoined] = useState(false)
    const [availableCalls, setAvailableCalls] = useState([])
    const navigate = useNavigate();

    //called on "Call" or "Answer"
    const initCall = async(typeOfCall)=>{
        setTypeOfCall(typeOfCall)
        await prepForCall(callStatus,updateCallStatus,setLocalStream)
        console.log("got media")
    }

    //Test backend connection
    //  useEffect(()=>{
    //    const test = async()=>{
    //          const socket = socketConnection("test")
    //      }
    //      //if this works, you will get pong in the console!
    //      test()
    //  },[])
    
    //Nothing happens until the user clicks join
    //(Helps with React double render)
    useEffect(()=>{
        if(joined){
            const userName = prompt("Enter your name")
            setUserName(userName)
            const setCalls = data => {
                setAvailableCalls(data)
                console.log("available calls",data)
            }
            const socket = socketConnection(userName)
            socket.on("availableOffers", setCalls)
            socket.on("newOfferAwaiting", setCalls)

            return ()=>{
                socket.off("availableOffers", setCalls)
                socket.off("newOfferAwaiting", setCalls)
            }
        }
    },[joined, setUserName])


    //We have media via GUM. setup the peerConnection w/listeners
    useEffect(()=>{
        if(callStatus.haveMedia && typeOfCall && userName && !peerConnection){   
            const {peerConnection, remoteStream} = createPeerConnection(userName, typeOfCall)
            setPeerConnection(peerConnection)
            setRemoteStream(remoteStream)
         }
    },[callStatus.haveMedia, peerConnection, setPeerConnection, setRemoteStream, typeOfCall, userName])

    //once remoteStream AND pc are ready, navigate
    useEffect(()=>{
        if(remoteStream && peerConnection && typeOfCall){
             navigate(`/${typeOfCall}`)
        }
       

    },[remoteStream,peerConnection, navigate, typeOfCall])


    const call = async()=>{
        //call related stuff goes here
        await initCall("offer")
        
    }

    const answer = async(callData)=>{
        //answer related stuff goes here
        setOfferData(callData)
        await initCall("answer")
    }

    if(!joined){
        return(
            <div className="container d-flex align-items-center justify-content-center min-vh-100">
                <button 
                    onClick={()=>setJoined(true)} 
                    className="btn btn-primary btn-lg"
                >Join</button>
            </div> 
        )
    }

    return (
        <div className="container">
            <div className="row">
                <h1>{userName}</h1>
                <div className="col-6"> 
                    <h2>Make a call</h2>
                    <button 
                        onClick={call} 
                        className="btn btn-success btn-lg hang-up"
                    >
                        Start Call
                    </button>
                </div>
                <div className="col-6"> 
                    <h2>Available Calls</h2>
                    {availableCalls.map((callData,i)=>
                        <div className="col mb-2" key={i}>
                            <button 
                                onClick={()=>{answer(callData)}}
                                className="btn btn-lg btn-warning hang-up"
                        >
                            Answer Call From {callData.offererUserName}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Home
