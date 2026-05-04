const defaultIceServers = [
    {
        urls: [
            'stun:stun.l.google.com:19302',
            'stun:stun1.l.google.com:19302'
        ]
    }
]

const parseIceServers = () => {
    const rawIceServers = process.env.REACT_APP_ICE_SERVERS

    if(!rawIceServers){
        return defaultIceServers
    }

    try{
        const parsedIceServers = JSON.parse(rawIceServers)
        if(Array.isArray(parsedIceServers) && parsedIceServers.length){
            return parsedIceServers
        }
    }catch(err){
        console.error("Failed to parse REACT_APP_ICE_SERVERS, falling back to default STUN servers.", err)
    }

    return defaultIceServers
}

let peerConfiguration = {
    iceServers: parseIceServers()
}

export default peerConfiguration
