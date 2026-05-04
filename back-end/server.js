const http = require('http')
const express = require('express');
const app = express();
const socketio = require('socket.io');

const PORT = Number(process.env.PORT || 8181);
const SIGNALING_PASSWORD = process.env.SIGNALING_PASSWORD || 'x';
const CLIENT_ORIGINS = (process.env.CLIENT_ORIGINS || 'http://localhost:3000,https://localhost:3000')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

app.use(express.static(__dirname))
app.get('/health', (_req, res) => {
    res.json({
        ok: true,
        uptime: process.uptime()
    })
})

const expressServer = http.createServer(app);
//create our socket.io server... it will listen to our express port
const io = socketio(expressServer,{
    cors: {
        origin: CLIENT_ORIGINS,
        credentials: true,
        methods: ["GET", "POST"]
    },
    transports: ["polling", "websocket"]
});


expressServer.listen(PORT, () => {
    console.log(`Signaling server listening on port ${PORT}`);
    console.log(`Allowed origins: ${CLIENT_ORIGINS.join(', ')}`);
});

//offers will contain {}
const offers = [
    // offererUserName
    // offer
    // offerIceCandidates
    // answererUserName
    // answer
    // answererIceCandidates
];
const connectedSockets = [
    //username, socketId
]

const removeSocketFromCollections = socketId => {
    const connectedSocketIndex = connectedSockets.findIndex(s => s.socketId === socketId)
    if(connectedSocketIndex !== -1){
        connectedSockets.splice(connectedSocketIndex, 1)
    }
}

io.on('connection',(socket)=>{
    // console.log("Someone has connected");
    const userName = socket.handshake.auth.userName;
    const password = socket.handshake.auth.password;

    if(password !== SIGNALING_PASSWORD){
        socket.disconnect(true);
        return;
    }
    removeSocketFromCollections(socket.id)
    connectedSockets.push({
        socketId: socket.id,
        userName
    })
    // console.log(connectedSockets)

    //test connectivity
    socket.on('test',ack=>{
        ack('pong')
    })

    //a new client has joined. If there are any offers available,
    //emit them out
    if(offers.length){
        socket.emit('availableOffers',offers);
    }
    
    socket.on('newOffer',newOffer=>{
        console.log("newOffer!")
        // console.log(newOffer)
        offers.push({
            offererUserName: userName,
            offer: newOffer,
            offerIceCandidates: [],
            answererUserName: null,
            answer: null,
            answererIceCandidates: []
        })
        // console.log(newOffer.sdp.slice(50))
        //send out to all connected sockets EXCEPT the caller
        console.log("Emmiting newOfferAwaiting")
        socket.broadcast.emit('newOfferAwaiting',offers.slice(-1))
    })

    socket.on('newAnswer',(offerObj,ackFunction)=>{
        // console.log(offerObj);
        console.log(connectedSockets)
        console.log("Requested offerer",offerObj.offererUserName)
        //emit this answer (offerObj) back to CLIENT1
        //in order to do that, we need CLIENT1's socketid
        const socketToAnswer = [...connectedSockets].reverse().find(s=>s.userName === offerObj.offererUserName)
        if(!socketToAnswer){
            console.log("No matching socket")
            return;
        }
        //we found the matching socket, so we can emit to it!
        const socketIdToAnswer = socketToAnswer.socketId;
        //we find the offer to update so we can emit it
        const offerToUpdate = offers.find(o=>o.offererUserName === offerObj.offererUserName)
        if(!offerToUpdate){
            console.log("No OfferToUpdate")
            return;
        }
        //send back to the answerer all the iceCandidates we have already collected
        ackFunction(offerToUpdate.offerIceCandidates);
        offerToUpdate.answer = offerObj.answer
        offerToUpdate.answererUserName = userName
        console.log(socketIdToAnswer)
        io.to(socketIdToAnswer).emit('answerResponse',offerToUpdate)
    })

    socket.on('sendIceCandidateToSignalingServer',iceCandidateObj=>{
        const { didIOffer, iceUserName, iceCandidate } = iceCandidateObj;
        // console.log(iceCandidate);
        if(didIOffer){
            //this ice is coming from the offerer. Send to the answerer
            const offerInOffers = offers.find(o=>o.offererUserName === iceUserName);
            if(offerInOffers){
                offerInOffers.offerIceCandidates.push(iceCandidate)
                // 1. When the answerer answers, all existing ice candidates are sent
                // 2. Any candidates that come in after the offer has been answered, will be passed through
                if(offerInOffers.answererUserName){
                    //pass it through to the other socket
                    const socketToSendTo = [...connectedSockets].reverse().find(s=>s.userName === offerInOffers.answererUserName);
                    if(socketToSendTo){
                        io.to(socketToSendTo.socketId).emit('receivedIceCandidateFromServer',iceCandidate)
                    }else{
                        console.log("Ice candidate recieved but could not find answere")
                    }
                }
            }
        }else{
            //this ice is coming from the answerer. Send to the offerer
            //pass it through to the other socket
            const offerInOffers = offers.find(o=>o.answererUserName === iceUserName);
            if(!offerInOffers){
                console.log("No offer found for answerer ice candidate")
                return;
            }
            const socketToSendTo = [...connectedSockets].reverse().find(s=>s.userName === offerInOffers.offererUserName);
            if(socketToSendTo){
                io.to(socketToSendTo.socketId).emit('receivedIceCandidateFromServer',iceCandidate)
            }else{
                console.log("Ice candidate recieved but could not find offerer")
            }
        }
        // console.log(offers)
    })

    socket.on('hangup', ({ userName, role })=>{
        const offerIndex = offers.findIndex(offer => {
            if(role === "answer"){
                return offer.answererUserName === userName;
            }

            return offer.offererUserName === userName;
        })

        if(offerIndex === -1){
            io.emit('availableOffers',offers);
            return;
        }

        const offerToClear = offers[offerIndex]
        const otherUserName = role === "answer"
            ? offerToClear.offererUserName
            : offerToClear.answererUserName

        offers.splice(offerIndex,1)

        if(otherUserName){
            const socketToNotify = [...connectedSockets].reverse().find(s=>s.userName === otherUserName)
            if(socketToNotify){
                io.to(socketToNotify.socketId).emit('callEnded')
            }
        }

        io.emit('availableOffers',offers);
    })

    socket.on('disconnect',()=>{
        removeSocketFromCollections(socket.id)
        const offerToClear = offers.findIndex(o=>o.offererUserName === userName)
        if(offerToClear !== -1){
            offers.splice(offerToClear,1)
        }
        io.emit('availableOffers',offers);
    })
})
