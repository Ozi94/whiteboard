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
var textHistory = {};
var shapeHistory = {};
var undoHistory = {};
var rooms = [];
var numberOfUsers = {};
const defaultRoom = 'room1';

io.on('connection', function (socket) {

    socket.on('room', function (room) {

        console.log(room);

        if (room === null || room === '' || room === 'null') {
            room = defaultRoom;
        }

        socket.room = room;
        socket.join(socket.room);

        if (rooms.indexOf(room) === -1) {
            rooms.push(room);
        }

        var roomLineHistory = lineHistory[socket.room];
        var roomTextHistory = textHistory[socket.room];
        var roomShapeHistory = shapeHistory[socket.room];

        if (roomLineHistory !== undefined) {
            io.to(socket.id).emit('drawLine', {line: roomLineHistory});
        }

        if (roomTextHistory !== undefined) {
            io.to(socket.id).emit('drawText', {line: roomTextHistory});
        }

        if (roomShapeHistory !== undefined) {
            io.to(socket.id).emit('drawShape', {line: roomShapeHistory});
        }

    });

    socket.on('changeRoom', function (room) {

        console.log(room);

        if (room === 'null' || room === null || room === '' || room === socket.room) {
            return;
        }

        var prevRoom = socket.room;

        socket.leave(prevRoom);
        numberOfUsers[prevRoom]--;

        if (numberOfUsers[prevRoom] === 0) {
            rooms.splice(rooms.indexOf(prevRoom), 1);
        } else {
            io.sockets.in(prevRoom).emit('userLeft', {
                username: socket.username,
                userNumber: numberOfUsers[prevRoom]
            });
        }

        socket.room = room;
        socket.join(room);

        if (rooms.indexOf(room) === -1) {
            rooms.push(room);
        }

        if (numberOfUsers[socket.room] === undefined) {
            numberOfUsers[socket.room] = 1;
        }
        else {
            numberOfUsers[socket.room]++;
        }

        io.to(socket.id).emit('clearCanvas');
        io.to(socket.id).emit('cleanChatBox');

        if (room === '') {
            room = defaultRoom;
        }

        io.to(socket.id).emit('currentRoom', room);

        io.sockets.in(socket.room).emit('userJoined', {
            username: socket.username,
            userNumber: numberOfUsers[socket.room]
        });

        if (lineHistory[room] !== undefined) {
            io.to(socket.id).emit('drawLine', {line: lineHistory[room]});
        }

        if (textHistory[room] !== undefined) {
            io.to(socket.id).emit('drawText', {line: textHistory[room]});
        }

        if (shapeHistory[room] !== undefined) {
            io.to(socket.id).emit('drawShape', {line: shapeHistory[room]});
        }
    });


    socket.on('adduser', function (username) {
        socket.username = username;

        if (numberOfUsers[socket.room] === undefined) {
            numberOfUsers[socket.room] = 1;
        }
        else {
            numberOfUsers[socket.room]++;
        }

        console.log(numberOfUsers[socket.room]);


        io.sockets.in(socket.room).emit('userJoined', {
            username: socket.username,
            userNumber: numberOfUsers[socket.room]
        });
    });

    socket.on('disconnect', function () {

        if (numberOfUsers[socket.room] !== undefined) {
            numberOfUsers[socket.room]--;
        }

        if (numberOfUsers[socket.room] === 0) {
            rooms.splice(rooms.indexOf(socket.room), 1);
        }

        io.sockets.in(socket.room).emit('userLeft', {
            username: socket.username,
            userNumber: numberOfUsers[socket.room]
        });
    });

    socket.on('getRoomList', function () {
        io.to(socket.id).emit('roomlist', rooms);

    });

    socket.on('drawLine', function (data) {


        var roomName = socket.room;

        if (lineHistory[roomName] === undefined) {
            lineHistory[roomName] = data.line;
        }
        else {
            lineHistory[roomName].push.apply(lineHistory[roomName], data.line);
            console.log(lineHistory[roomName]);
        }

        if (undoHistory[roomName] === undefined) {
            undoHistory[roomName] = [2];
        }
        else {
            undoHistory[roomName].push(2);
        }

        io.sockets.in(socket.room).emit('drawLine', {line: data.line});
    });


    socket.on('drawText', function (data) {
        console.log('#######');
        console.log(data);
        console.log('#######');

        var roomName = socket.room;

        if (textHistory[roomName] === undefined) {
            textHistory[roomName] = data.line;
        }
        else {
            textHistory[roomName].push.apply(textHistory[roomName], data.line);
        }

        if (undoHistory[roomName] === undefined) {
            undoHistory[roomName] = [0];
        }
        else {
            undoHistory[roomName].push(0);
        }

        console.log(undoHistory[roomName]);

        if (data.line.text !== '' && data.line.text !== 'null') {
            io.sockets.in(socket.room).emit('drawText', {line: data.line});
        }
    });

    socket.on('drawShape', function (data) {

        var roomName = socket.room;

        if (shapeHistory[roomName] === undefined) {
            shapeHistory[roomName] = data.line;
        }
        else {
            shapeHistory[roomName].push.apply(shapeHistory[roomName], data.line);
            console.log(shapeHistory[roomName]);
        }

        if (undoHistory[roomName] === undefined) {
            undoHistory[roomName] = [1];
        }
        else {
            undoHistory[roomName].push(1);
        }

        console.log(undoHistory[roomName]);


        io.sockets.in(socket.room).emit('drawShape', {line: data.line});
    });

    socket.on('lineEnding', function () {
        if (undoHistory[socket.room] === undefined) {
            undoHistory[socket.room] = [-1];
        }
        else {
            undoHistory[socket.room].push(-1);
        }
    });

    socket.on('undo', function () {

        if (undoHistory[socket.room] === undefined) {
            return;
        }

        var lastElement = undoHistory[socket.room][undoHistory[socket.room].length - 1];

        if (undoHistory[socket.room] !== undefined) {
            switch (lastElement) {
                case 0:
                    textHistory[socket.room].pop();
                    break;
                case 1:
                    shapeHistory[socket.room].pop();
                    break;
                case -1:
                    undoHistory[socket.room].pop();

                    lastElement = undoHistory[socket.room][undoHistory[socket.room].length - 1];

                    while (lastElement === 2) {
                        lineHistory[socket.room].pop();
                        lineHistory[socket.room].pop();
                        undoHistory[socket.room].pop();
                        lastElement = undoHistory[socket.room][undoHistory[socket.room].length - 1];
                    }

                    undoHistory[socket.room].push(2);
                    break;
            }
            undoHistory[socket.room].pop();

            console.log(undoHistory[socket.room]);
        }

        io.to(socket.room).emit('clearCanvas');
        io.to(socket.room).emit('drawLine', {line: lineHistory[socket.room]});
        io.to(socket.room).emit('drawText', {line: textHistory[socket.room]});
        io.to(socket.room).emit('drawShape', {line: shapeHistory[socket.room]});
    });

    socket.on('clearCanvas', function () {
        lineHistory[socket.room] = [];
        textHistory[socket.room] = [];
        shapeHistory[socket.room] = [];
        undoHistory[socket.room] = [];

        io.to(socket.room).emit('clearCanvas');
    });

    socket.on('resizeScreen', function () {

        console.log('resize');

        console.log(lineHistory[socket.room]);

        io.to(socket.id).emit('drawLine', {line: lineHistory[socket.room]});
        io.to(socket.id).emit('drawText', {line: textHistory[socket.room]});
        io.to(socket.id).emit('drawShape', {line: shapeHistory[socket.room]});

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

    socket.on('currentRoom', function (room) {
        console.log(room);

        if (room === '') {
            room = defaultRoom;
        }

        if (room !== undefined) {
            io.to(socket.id).emit('currentRoom', room);
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
