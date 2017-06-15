document.addEventListener("DOMContentLoaded", function () {

    $(".color").hide();
    $(".size").hide();

    var color = 'black';
    var count = 0;

    var text = false;

    var colors = document.getElementsByClassName('color');

    for (var i = 0; i < colors.length; i++) {
        colors[i].addEventListener('click', onColorUpdate, false);
        console.log(colors[i]);
    }

    function onColorUpdate(e) {
        var color = e.target.className.split(' ')[1];
        console.log(color);
        mouse.pos.color = color;
    }

    var size = 2;

    var pen = document.getElementsByClassName('size');

    for (var i = 0; i < pen.length; i++) {
        pen[i].addEventListener('click', onPenSizeUpdate, false);
    }

    function onPenSizeUpdate(e) {
        console.log(e);
        var size = e.target.className.split(' ')[2];
        mouse.pos.size = size;
    }

    var mouse = {
        click: false,
        move: false,
        pos: {x: 0, y: 0, color: color, size: size},
        pos_prev: false
    };

    // get canvas element and create context
    var canvas = document.getElementById('drawing');
    var context = canvas.getContext('2d');
    var screenWidth = window.innerWidth;
    var screenHeight = window.innerHeight;
    var socket = io.connect();

    var room = null;

    // set canvas to full browser width/height
    canvas.width = screenWidth;
    canvas.height = screenHeight;

    // register mouse event handlers
    canvas.onmousedown = function (e) {
        mouse.click = true;
    };
    canvas.onmouseup = function (e) {
        mouse.click = false;
    };

    canvas.onmousemove = function (e) {
        // normalize mouse position to range 0.0 - 1.0
        mouse.pos.x = e.clientX / screenWidth;
        mouse.pos.y = e.clientY / screenHeight;
        mouse.move = true;
    };

    // draw line received from server
    socket.on('drawLine', function (data) {

        if (data !== undefined) {

            var line = data.line;

            for (var i = 0; i < line.length - 1; i += 2) {
                context.beginPath();
                context.moveTo(line[i].x * screenWidth, line[i].y * screenHeight);
                context.lineTo(line[i + 1].x * screenWidth, line[i + 1].y * screenHeight);
                context.strokeStyle = line[i].color;
                context.lineWidth = line[i].size;
                context.stroke();
            }
        }

    });

    socket.on('message', function (data) {
        console.log(data);
        console.log(data.username);
        console.log('Incoming message:', data.message);

        var content = '<p>' + '<b>' + data.username + '</b>' + ':' + data.message + '</p>';
        $('.messages').append(content);

        document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
    });

    socket.on('connect', function () {
        var username = prompt("What's your name?");
        var input = prompt("What's the room you want to connect to?");

        room = input;

        socket.emit('room', input);
        socket.emit('adduser', username);
    });

    socket.on('userJoined', function (data) {

        console.log(data);
        var content = '<p>' + '<b>' + data.username + '</b>' + ' joined' + '</p>';
        $('.messages').append(content);
        addParticipantsMessage(data.userNumber);
    });

    socket.on('userLeft', function (data) {

        var content = '<p>' + '<b>' + data.username + '</b>' + ' left' + '</p>';
        $('.messages').append(content);
        addParticipantsMessage(data.userNumber);
    });

    socket.on('roomlist', function (data) {
        console.log(data);
    });

    socket.on('drawText', function (data) {
        console.log('drawtextevent');
        console.log(data);

        var fontSize = data.mouse.size * 10 + "px Arial";

        context.font = fontSize;

        context.fillStyle = data.mouse.color;
        context.fillText(data.message,data.mouse.x * screenWidth,data.mouse.y * screenHeight);
    });

    function addParticipantsMessage(data) {
        var message = '';
        if (data === 1) {
            message += "there's 1 participant";
        } else {
            message += "there are " + data + " participants";
        }

        var content = '<p>' + message + '</p>';
        $('.messages').append(content);

    }

    $("#colors").click(function () {
        if ($('.color').is(':visible')) {
            $(".color").hide();
        }
        else {
            $(".color").show();
        }
    });

    $(".color").click(function () {
        $(".color").hide();
    });

    $("#size").click(function () {
        if ($('.size').is(':visible')) {
            $(".size").hide();
        } else {
            $(".size").show();
        }
    });

    $(".size").click(function () {
        $(".size").hide();
    });

    $("#save").click(function () {
        var img = canvas.toDataURL("image/png");
        var saveImageWindow = window.open("");
        var title = 'image' + new Date().toISOString();

        saveImageWindow.document.write('<title>' + title + '</title>');
        saveImageWindow.document.write('<img src="' + img + '"/>');
    });

    $("#rooms").click(function () {
        socket.emit('getRoomList');
    });

    $("#text").click(function () {
        if (text) {
            text = false;
        } else {
            text = true;
        }

        console.log(text);
    });


    var $window = $(window);

    var messageInput = $(".inputMessage").focus();

    $window.keydown(function (event) {

        if (!(event.ctrlKey || event.metaKey || event.altKey)) {
            messageInput.focus();
        }

        if (event.which === 13 && messageInput.val() !== '') {

            var message = messageInput.val();
            socket.emit('message', message);
            messageInput.val('');
        }
    });

// main loop, running every 25ms
    function mainLoop() {
        // check if the user is drawing
        drawLine();

        resizeScreen();

        setTimeout(mainLoop, 25);
    }

    mainLoop();

    function drawLine() {
        if (mouse.click && mouse.move && mouse.pos_prev && !text) {
            // send line to to the server
            socket.emit('drawLine', {line: [mouse.pos, mouse.pos_prev], room: room, color: color});
            mouse.move = false;
        }

        mouse.pos_prev = {x: mouse.pos.x, y: mouse.pos.y, color: mouse.pos.color};

        if (mouse.click && text) {
            count++;
            console.log(count);

            if (count === 2) {
                var message = prompt('What is your text?');
                console.log(mouse.pos);
                socket.emit('drawText', {message: message, mouse: mouse.pos});
                count = 0;
                mouse.click = false;
            }
        }
    }

    function resizeScreen() {
        if (screenWidth !== window.innerWidth || screenHeight !== window.innerHeight) {

            screenWidth = window.innerWidth;
            screenHeight = window.innerHeight;

            context.clearRect(0, 0, canvas.width, canvas.height);

            canvas.width = screenWidth;
            canvas.height = screenHeight;

            socket.emit('resizeScreen');

            console.log(canvas);
        }
    }
})
;