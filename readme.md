## WebRTC React Starter

This app is production-ready as a split deployment:

- `front-end`: React client, ideal for Vercel
- `back-end`: Node + Socket.IO signaling server, deploy separately on Render, Railway, Fly.io, or your own VPS

Vercel is a good fit for the frontend, but not for hosting this long-lived Socket.IO signaling server directly.

## Architecture

- The browser uses WebRTC for media.
- The `back-end` server only handles signaling and hangup events.
- In production, the frontend should connect to the signaling server with `REACT_APP_SOCKET_URL`.
- For real-world WebRTC reliability, configure a TURN server in `REACT_APP_ICE_SERVERS`.

## Why TURN Matters

STUN-only often works on local networks and some home networks, but production users behind restrictive NATs or corporate firewalls frequently need TURN relay fallback.

References:
- MDN `RTCPeerConnection()` docs: `iceServers` should include STUN and/or TURN, otherwise connectivity is limited. https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/RTCPeerConnection
- WebRTC TURN server guide: most WebRTC apps need a TURN server because direct peer sockets are often not possible. https://webrtc.org/getting-started/turn-server
- Vercel WebSocket guidance: use Vercel for the frontend and a separate realtime backend. https://vercel.com/guides/do-vercel-serverless-functions-support-websocket-connections

## Environment Setup

Frontend: `front-end/.env`

Copy `front-end/.env.example` and set:

- `REACT_APP_SOCKET_URL`
- `REACT_APP_SIGNALING_PASSWORD`
- `REACT_APP_ICE_SERVERS`

Backend: `back-end/.env`

Copy `back-end/.env.example` and set:

- `PORT`
- `SIGNALING_PASSWORD`
- `CLIENT_ORIGINS`

Important:
- `REACT_APP_SIGNALING_PASSWORD` is only a lightweight demo gate because frontend env vars are visible to users.
- For a real production auth model, replace it with proper user/session auth.

## Local Development

Backend:

```bash
cd back-end
npm install
npm run dev
```

Frontend:

```bash
cd front-end
npm install
npm start
```

## Production Deployment

### 1. Push to your own GitHub origin

```bash
git remote remove origin
git remote add origin https://github.com/YOUR_ORG/YOUR_REPO.git
git push -u origin main
```

### 2. Deploy frontend to Vercel

- Import the repo in Vercel.
- Set the Vercel root directory to `front-end`.
- Add these environment variables:

```bash
REACT_APP_SOCKET_URL=https://your-signaling-server.example.com
REACT_APP_SIGNALING_PASSWORD=your-demo-password
REACT_APP_ICE_SERVERS=[{"urls":["stun:stun.l.google.com:19302"]},{"urls":["turn:your-turn-host:3478?transport=udp","turn:your-turn-host:3478?transport=tcp"],"username":"your-turn-username","credential":"your-turn-password"}]


REACT_APP_ICE_SERVERS=[{"urls":["stun:fr-turn7.xirsys.com"]},{"username":"voOrNRtXqRYuEv1Zld9fJ9itkqklfD8X7CNpUma5U1-TQUaZdQC2Ifp1Vi-qRX32AAAAAGn4mnVoYXJyeWNvZGU=","credential":"705e9ede-47ba-11f1-bb3d-820343dbece9","urls":["turn:fr-turn7.xirsys.com:80?transport=udp","turn:fr-turn7.xirsys.com:3478?transport=udp","turn:fr-turn7.xirsys.com:80?transport=tcp","turn:fr-turn7.xirsys.com:3478?transport=tcp","turns:fr-turn7.xirsys.com:443?transport=tcp","turns:fr-turn7.xirsys.com:5349?transport=tcp"]}]

```

### 3. Deploy backend to a Node host

- Deploy `back-end` to Render, Railway, Fly.io, or a VPS.
- Set these env vars:

```bash
PORT=8181
SIGNALING_PASSWORD=your-demo-password
CLIENT_ORIGINS=https://your-app.vercel.app,https://your-custom-domain.com
```

If your backend host provides a port dynamically, leave the host to inject `PORT`.

### 4. TURN server options

Good options:

- Self-host `coturn`
- Managed TURN providers
- Cloud VM running `coturn`

Add both UDP and TCP TURN URLs when possible.

## WebRTC Production Notes

- The frontend must be served over HTTPS for camera/mic access in production.
- The signaling backend should be served over HTTPS/WSS as well.
- If video works for some users but not others, missing TURN is the first thing to check.
- If you use a custom domain, add it to `CLIENT_ORIGINS`.

## Health Check

The backend now exposes:

```bash
GET /health
```

This is useful for Render/Railway/Fly health checks.
