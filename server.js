var express = require('express'),
    app = express(),
    http = require('http'),
    socketIo = require('socket.io');

var server = http.createServer(app);
var io = socketIo.listen(server);
server.listen(8080);

app.use(express.static(__dirname + '/public'));
console.log("Server running on 127.0.0.1:8080");

var lineHistory = {};
var rooms = [];

io.on('connection', function (socket) {

    socket.on('drawLine', function (data) {

        var roomName = data.room;

        if (rooms.indexOf(roomName) === -1) {
            rooms.push(roomName);
            lineHistory[roomName] = data.line;
        }
        else {
            lineHistory[roomName].push.apply(lineHistory[roomName], data.line);
            console.log(lineHistory[roomName]);
        }

        io.sockets.in(socket.room).emit('drawLine', {line: data.line});
    });

    socket.on('resizeScreen', function () {

        console.log('resize');

        console.log(lineHistory[socket.room]);

        io.to(socket.id).emit('drawLine', {line: lineHistory[socket.room]});

    });

    socket.on('room', function (room) {
        socket.room = room;
        socket.join(socket.room);

        io.sockets.in(room).emit('message', 'USer has joined room');

        var roomLineHistory = lineHistory[socket.room];
        console.log(roomLineHistory);

        if (roomLineHistory !== undefined) {
            io.to(socket.id).emit('drawLine', {line: roomLineHistory});
        }

    });

    socket.on('sendMessage', function (message) {

        // console.log('Current room: ' + socket.room +'\n');
        io.sockets.in(socket.room).emit('message', message);
        // console.log('Sending to ' + socket.room + ' the message: ' + message);
    });

});
