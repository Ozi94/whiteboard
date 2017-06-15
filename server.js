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
var numberOfUsers = 0;

io.on('connection', function (socket) {

    socket.on('room', function (room) {
        socket.room = room;
        socket.join(socket.room);

        var roomLineHistory = lineHistory[socket.room];
        console.log(roomLineHistory);

        if (roomLineHistory !== undefined) {
            io.to(socket.id).emit('drawLine', {line: roomLineHistory});
        }

    });


    socket.on('adduser', function (username) {
        socket.username = username;
        ++numberOfUsers;

        io.sockets.in(socket.room).emit('userJoined', {
            username: socket.username,
            userNumber: numberOfUsers
        });
    });

    socket.on('disconnect', function () {
        --numberOfUsers;

        io.sockets.in(socket.room).emit('userLeft', {
            username: socket.username,
            userNumber: numberOfUsers
        });
    });

    socket.on('getRoomList', function () {
        io.to(socket.id).emit('roomlist', findRooms());

    });


    function findRooms() {
        var availableRooms = [];
        var rooms = io.sockets.adapter.rooms;
        if (rooms) {
            for (var room in rooms) {
                if (room.length !== 20) {
                    availableRooms.push(room);
                }
            }
        }
        return availableRooms;
    }
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


    socket.on('drawText', function (data) {
        io.sockets.in(socket.room).emit('drawText', data);
    });

    socket.on('resizeScreen', function () {

        console.log('resize');

        console.log(lineHistory[socket.room]);

        io.to(socket.id).emit('drawLine', {line: lineHistory[socket.room]});

    });

    socket.on('message', function (message) {
        console.log(message);

        if (message !== undefined) {
            io.sockets.in(socket.room).emit('message', {
                message: message,
                username: socket.username,
                time: getCurrentTime()
            });
        }
    });

    function addZero(i) {
        if (i < 10) {
            i = "0" + i;
        }
        return i;
    }

    function getCurrentTime() {
        var d = new Date();
        var h = addZero(d.getHours());
        var m = addZero(d.getMinutes());
        var s = addZero(d.getSeconds());
        return h + ":" + m + ":" + s;
    }

})
;
