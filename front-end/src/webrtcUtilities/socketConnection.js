import { io } from 'socket.io-client';

let socket;
const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:8181';
const signalingPassword = process.env.REACT_APP_SIGNALING_PASSWORD || 'x';

const socketConnection = userName =>{
    //check to see if the socket is already connected
    if(socket && socket.connected){
        //if so, then just return it so whoever needs it, can use it
        return socket;
    }else{
        //its not connected... connect!
        socket = io.connect(socketUrl,{
            auth: {
                // This is only a lightweight demo gate. Do not treat it as real auth.
                password: signalingPassword,
                userName, 
            }
        });
        if(userName === 'test'){
            console.log("Testing...")
            socket.emitWithAck('test').then(resp=>{
                console.log(resp)
            })
        }
        
        return socket;
    }
}

export const closeSocketConnection = () => {
    if(socket){
        socket.removeAllListeners()
        socket.disconnect()
        socket = null
    }
}

export default socketConnection;
