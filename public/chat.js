let socket = io.connect("http://localhost:4000");

let divVideoChatLobby = document.getElementById("video-chat-lobby");
let divVideoChat = document.getElementById("video-chat-room");
let joinButton = document.getElementById("join");
let userVideo = document.getElementById("user-video");
let peerVideo = document.getElementById("peer-video");
let roomInput = document.getElementById("roomName");


let creator = false;
const configuration = {
  iceServers: [
    { urls: "stun:stun.services.mozilla.com" },
    { urls: "stun:stun.l.google.com:19302" },
  ]
}

let rtcPeerConnection;
let userStream = null;

let roomName = null;

joinButton.addEventListener('click', async function () {
  if (roomInput.value == '') {
    alert('Please enter a room name');
  } else {
    roomName = roomInput.value;
    socket.emit('join', roomName);
  }
});

socket.on("created", async function () {
  console.log('ON CREATED EVENT');
  creator = true;
  try {
    if (userStream == null) {
      await startUserStream();
    }
  } catch (e) {
    console.error(e);
  }
});

socket.on("joined", async function () {
  console.log('ON JOINED EVENT');
  creator = false;
  try {
    if (userStream == null) {
      await startUserStream();
    }
    socket.emit('ready', roomName);
  } catch (e) {
    console.error(e);
  }
});

socket.on("full", function () {
  alert("Room is Full, Can't Join");
});

socket.on("ready", async function () {
  console.log('ON READY');
  if (creator) {
    console.log('Creator');
    rtcPeerConnection = new RTCPeerConnection(configuration);
    rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
    rtcPeerConnection.ontrack = OnTrackFunction;
    // audio track
    rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
    // video track
    //rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);
    try {
      let offer = await rtcPeerConnection.createOffer();
      rtcPeerConnection.setLocalDescription(offer);
      socket.emit('offer', offer, roomName);
      console.log(offer);
    } catch (e) {

    }
  }
});

socket.on("candidate", function (candidate) {
  const iceCandidate = new RTCIceCandidate(candidate);
  rtcPeerConnection.addIceCandidate(iceCandidate);
});

socket.on("offer", async function (offer) {
  console.log('ON OFFER');
  if (!creator) {
    console.log('Non creator');
    rtcPeerConnection = new RTCPeerConnection(configuration);
    rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
    rtcPeerConnection.ontrack = OnTrackFunction;
    // audio track
    rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
    // video track
    //rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);

    rtcPeerConnection.setRemoteDescription(offer);
    try {
      let answer = await rtcPeerConnection.createAnswer();
      rtcPeerConnection.setLocalDescription(answer);

      socket.emit('answer', answer, roomName);
      console.log(offer);
    } catch (e) {
      console.error(e);
    }
  }
});

socket.on("answer", function (answer) {
  rtcPeerConnection.setRemoteDescription(answer);
});

async function startUserStream() {
  userStream = await navigator.mediaDevices.getUserMedia({
    //     audio: true,
    video: {
      width: 1280, height: 720
    }
  });
  divVideoChatLobby.style = "display:none";
  userVideo.srcObject = userStream;
  userVideo.onloadedmetadata = function (e) {
    userVideo.play();
  }
}

function OnIceCandidateFunction(event) {
  console.log('OnIceCandidateFunction');
  console.log(event);
  if (event.candidate) {
    socket.emit('candidate', event.candidate, roomName);
  }
}

function OnTrackFunction(event) {
  console.log('OnTrackFunction');
  console.log(event);
  peerVideo.srcObject = event.streams[0];
  peerVideo.onloadedmetadata = function (e) {
    peerVideo.play();
  }
}