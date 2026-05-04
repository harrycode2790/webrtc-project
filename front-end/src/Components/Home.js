import { useEffect, useState } from 'react'
import prepForCall from '../webrtcUtilities/prepForCall'
import socketConnection from '../webrtcUtilities/socketConnection'
import createPeerConnection from '../webrtcUtilities/createPeerConn'
import { useNavigate } from 'react-router-dom';

const Home = ({callStatus,updateCallStatus,setLocalStream,
    setRemoteStream,remoteStream,peerConnection,setPeerConnection,
    localStream,userName, setUserName,offerData,setOfferData})=>{

    const [ typeOfCall, setTypeOfCall ] = useState()
    const [joined, setJoined] = useState(false)
    const [availableCalls, setAvailableCalls] = useState([])
    const [nameInput, setNameInput] = useState(userName || "")
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
        if(joined && userName){
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
    },[joined, setUserName, userName])


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

    const joinLobby = e => {
        e.preventDefault()
        const trimmedName = nameInput.trim()

        if(!trimmedName){
            return
        }

        setUserName(trimmedName)
        setJoined(true)
    }

    if(!joined){
        return(
            <main className="app-shell home-shell">
                <section className="lobby-stage">
                    <div className="lobby-copy panel">
                        <span className="eyebrow">Live Lobby</span>
                        <h1>Walk into the room before the call starts.</h1>
                        <p>
                            Pick a display name, enter the lobby, and handle live calls from
                            a layout that feels more like a modern session desk than a starter app.
                        </p>
                        <div className="lobby-highlights">
                            <div className="highlight-chip">Fast join flow</div>
                            <div className="highlight-chip">Responsive layout</div>
                            <div className="highlight-chip">Live incoming offers</div>
                        </div>
                    </div>

                    <form className="join-card join-card-alt" onSubmit={joinLobby}>
                        <div className="join-card-heading">
                            <span className="panel-kicker">Step 1</span>
                            <h2>Enter the lobby</h2>
                        </div>
                        <label className="field-label" htmlFor="userName">
                            Display name
                        </label>
                        <input
                            id="userName"
                            className="name-input"
                            type="text"
                            value={nameInput}
                            onChange={event => setNameInput(event.target.value)}
                            placeholder="e.g. Harry"
                            autoComplete="name"
                        />
                        <p className="field-note">
                            This name appears to other people when you create or answer a call.
                        </p>
                        <button
                            type="submit"
                            className="primary-button"
                            disabled={!nameInput.trim()}
                        >
                            Join Lobby
                        </button>
                    </form>
                </section>
            </main> 
        )
    }

    return (
        <main className="app-shell home-shell">
            <section className="lobby-board">
                <header className="lobby-board-header panel">
                    <div className="identity-block">
                        <span className="eyebrow">Connected</span>
                        <h1>{userName}</h1>
                        <p>Your session is live. Start a room or jump into any active offer below.</p>
                    </div>
                    <div className="identity-meta">
                        <div className="meta-card">
                            <span className="meta-label">Open Calls</span>
                            <strong>{availableCalls.length}</strong>
                        </div>
                        <button onClick={call} className="primary-button">
                            Start Call
                        </button>
                    </div>
                </header>

                <div className="lobby-columns">
                    <article className="panel launch-panel">
                        <div className="launch-panel-copy">
                            <span className="panel-kicker">Create</span>
                            <h2>Open a fresh room for a new conversation.</h2>
                            <p>
                                Your offer goes live immediately, then anyone in the lobby can
                                answer and connect.
                            </p>
                        </div>
                        <div className="launch-panel-actions">
                            <button onClick={call} className="primary-button">
                                Create Offer
                            </button>
                            <div className="launch-note">
                                Best when you want to host and wait for someone to join.
                            </div>
                        </div>
                    </article>

                    <section className="panel queue-panel">
                        <div className="queue-header">
                            <div>
                                <span className="panel-kicker">Queue</span>
                                <h2>Incoming call board</h2>
                            </div>
                            <span className="calls-count">
                                {availableCalls.length} waiting
                            </span>
                        </div>

                        {availableCalls.length ? (
                            <div className="queue-list">
                                {availableCalls.map((callData,i)=>
                                    <button
                                        key={i}
                                        onClick={()=>{answer(callData)}}
                                        className="queue-item"
                                    >
                                        <div className="queue-avatar">
                                            {callData.offererUserName?.slice(0,1).toUpperCase()}
                                        </div>
                                        <div className="queue-copy">
                                            <span className="call-card-label">Incoming Offer</span>
                                            <strong>{callData.offererUserName}</strong>
                                            <span className="call-card-meta">
                                                Answer now and join the live video session.
                                            </span>
                                        </div>
                                        <span className="queue-action">Answer</span>
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="empty-state empty-state-alt">
                                <h3>The board is quiet right now</h3>
                                <p>
                                    No one is calling yet. Start a room and the next participant
                                    will see it here from their lobby.
                                </p>
                            </div>
                        )}
                    </section>
                </div>
            </section>
        </main>
    )
}

export default Home
