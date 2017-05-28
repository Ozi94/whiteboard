var express = require('express'),
    app = express(),
    http = require('http'),
    socketIo = require('socket.io');

var server = http.createServer(app);
var io = socketIo.listen(server);
server.listen(8080);

app.use(express.static(__dirname + '/public'));
console.log("Server running on 127.0.0.1:8080");

var line_history = [];

io.on('connection', function (socket) {

    // first send the history to the new client
    for (var i in line_history) {
        socket.emit('drawLine', {line: line_history[i]});
    }

    // add handler for message type "draw_line".
    socket.on('drawLine', function (data) {
        // add received line to history
        line_history.push(data.line);
        // send line to all clients
        io.emit('drawLine', {line: data.line});
    });

    socket.on('resizeScreen', function (data) {
        io.emit(data);
        for (var lines in line_history) {
            io.emit('drawLine', {line: line_history[lines]});
        }
    });

    socket.on('room', function(room) {
        socket.room = room;
        socket.join(socket.room);
        io.sockets.in(room).emit('message', 'USer has joined room');
    });

    socket.on('sendMessage', function (message) {

        // console.log('Current room: ' + socket.room +'\n');
        io.sockets.in(socket.room).emit('message', message);
        // console.log('Sending to ' + socket.room + ' the message: ' + message);
    });

});
