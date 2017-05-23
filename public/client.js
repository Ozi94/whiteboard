document.addEventListener("DOMContentLoaded", function () {
    var mouse = {
        click: false,
        move: false,
        pos: {x: 0, y: 0},
        pos_prev: false
    };
    // get canvas element and create context
    var canvas = document.getElementById('drawing');
    var context = canvas.getContext('2d');
    var screenWidth = window.innerWidth;
    var screenHeight = window.innerHeight;
    var socket = io.connect();

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
        context.beginPath();
        context.moveTo(line[0].x * screenWidth, line[0].y * screenHeight);
        context.lineTo(line[1].x * screenWidth, line[1].y * screenHeight);
        context.stroke();
    });

    // main loop, running every 25ms
    function mainLoop() {
        // check if the user is drawing
        if (mouse.click && mouse.move && mouse.pos_prev) {
            // send line to to the server
            socket.emit('drawLine', {line: [mouse.pos, mouse.pos_prev]});
            mouse.move = false;
        }

        if (screenWidth !== window.innerWidth || screenHeight !== window.innerHeight){

            screenWidth = window.innerWidth;
            screenHeight = window.innerHeight;

            context.clearRect(0, 0, canvas.width, canvas.height);

            canvas.width = screenWidth;
            canvas.height = screenHeight;

            socket.emit('resizeScreen', [screenWidth, screenHeight]);

            console.log(canvas);
        }

        mouse.pos_prev = {x: mouse.pos.x, y: mouse.pos.y};
        setTimeout(mainLoop, 25);
    }

    mainLoop();
});