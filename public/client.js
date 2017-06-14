document.addEventListener("DOMContentLoaded", function () {

    $(".color").hide();
    $(".size").hide();

    var color = 'black';

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
        var line = data.line;

        for (var i = 0; i < line.length - 1; i += 2) {
            context.beginPath();
            context.moveTo(line[i].x * screenWidth, line[i].y * screenHeight);
            context.lineTo(line[i + 1].x * screenWidth, line[i + 1].y * screenHeight);
            context.strokeStyle = line[i].color;
            context.lineWidth = line[i].size;
            context.stroke();
        }
    });

    socket.on('message', function (data) {
        console.log('Incoming message:', data);
    });

    socket.on('connect', function () {
        var input = prompt("What's the room you want to connect to?");
        room = input;
        socket.emit('room', input);
    });

    var message = $('#message');
    var messageForm = $('#messageForm');

    messageForm.submit(function (e) {
        e.preventDefault();

        socket.emit('sendMessage', message.val());
        message.val('');
    });

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

        saveImageWindow.document.write('<title>'+ title + '</title>');
        saveImageWindow.document.write('<img src="'+img+'"/>');
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
        if (mouse.click && mouse.move && mouse.pos_prev) {
            // send line to to the server
            socket.emit('drawLine', {line: [mouse.pos, mouse.pos_prev], room: room, color: color});
            mouse.move = false;
        }

        mouse.pos_prev = {x: mouse.pos.x, y: mouse.pos.y, color: mouse.pos.color};

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
});