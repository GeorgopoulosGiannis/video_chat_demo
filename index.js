const express = require('express');
const socket = require('socket.io');
const app = express();


const server = app.listen(4000, function () {
    console.log("Server is running");
});


app.use(express.static('public'));

const io = socket(server);

io.on("connection", function (socket) {
    console.log('User connected :' + socket.id);

    socket.on('join', function (roomName) {
        const rooms = io.sockets.adapter.rooms;

        const room = io.sockets.adapter.rooms.get(roomName);
        if (room == undefined) {
            socket.join(roomName);
            socket.emit('created')
        } else if (room.size == 1) {
            socket.join(roomName);
            socket.emit('joined');
        } else {
            socket.emit('full');
        }
        console.log(rooms);
    });

    socket.on('ready', function (roomName) {
        console.log("Ready");

        socket.broadcast.to(roomName).emit('ready');
    });

    socket.on('candidate', function (candidate, roomName) {
        console.log("Candidate");

        socket.broadcast.to(roomName).emit('candidate', candidate);
    });

    socket.on('offer', function (offer, roomName) {
        console.log("Offer",offer);

        socket.broadcast.to(roomName).emit('offer', offer);
    });

    socket.on('answer', function (answer, roomName) {
        console.log("Answer");

        socket.broadcast.to(roomName).emit('answer', answer);
    });
    
});