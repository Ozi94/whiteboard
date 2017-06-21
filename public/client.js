document.addEventListener("DOMContentLoaded", function () {

    var color = 'black';
    var count = 0;
    var isText = false;

    var isShape = false;
    var isBrush = true;
    var lineEndingCounter = 0;
    var shape;

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

    var shapes = document.getElementsByClassName('shape');

    for (var i = 0; i < shapes.length; i++) {
        shapes[i].addEventListener('click', onShapeUpdate, false);
    }

    function onShapeUpdate(e) {
        shape = e.target.className.split(' ')[1];
        isShape = true;
        isBrush = false;
        isText = false;
        mouse.pos.shape = shape;
        mouse.pos.vertical = 0;

        var position = prompt('Vertical? Y/N');

        if (position.toUpperCase() === 'Y' ||
            position.toUpperCase() === 'YES') {
            mouse.pos.vertical = 1;
        }

        alert('Click where your shape want to be placed!');
    }

    var mouse = {
        click: false,
        move: false,
        pos: {x: 0, y: 0, color: color, size: size},
        pos_prev: false
    };

    /*    var messageDivHeight = $('.messages').height();

     var inputDivHeight = $('.input').height();

     var navbarWidth = $('#navbar').width();
     var navbarHeight = $('#navbar').height();

     var usedScreenWidth = navbarWidth;
     var usedScreenHeight = messageDivHeight + inputDivHeight + navbarHeight;

     console.log(usedScreenWidth);
     console.log(usedScreenHeight);*/


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

    // $('#navbar').hide();

    socket.on('drawLine', function (data) {

        if (data !== undefined) {

            console.log(data.line);
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

    socket.on('drawText', function (data) {

        var line = data.line;

        if (line !== undefined) {
            for (var i = 0; i < line.length; i++) {

                var screenRatio = line[i].width / screenWidth;
                if (screenWidth > 1366){
                    var fontSize = line[i].size * screenRatio * screenWidth / 210 * screenHeight / 500 + "px Arial";

                }else{
                    var fontSize = line[i].size * screenRatio * screenWidth / 200 * screenHeight / 500 + "px Arial";

                }

                console.log(fontSize);
                context.font = fontSize;
                context.fillStyle = line[i].color;
                context.fillText(line[i].text, line[i].x * screenWidth, line[i].y * screenHeight);
            }
        }
    });

    socket.on('drawShape', function (data) {
        console.log(data);

        var params = data.line;

        if (params !== undefined) {
            for (var i = 0; i < params.length; i++) {
                context.strokeStyle = params[i].color;
                context.lineWidth = 2;

                if (!params[i].vertical) {
                    context.strokeRect(
                        params[i].x * screenWidth,
                        params[i].y * screenHeight,
                        params[i].size * screenWidth / 30,
                        params[i].size * screenHeight / 30
                    );
                } else {
                    context.strokeRect(
                        params[i].x * screenWidth,
                        params[i].y * screenHeight,
                        params[i].size * screenHeight / 25,
                        params[i].size * screenWidth / 30
                    );

                }
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

    socket.on('cleanCanvas', function () {
        context.clearRect(0, 0, canvas.width, canvas.height);
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
        var newRoom = prompt('Available rooms: ' + data + '. Please enter the room to connect to');
        console.log(newRoom);
        socket.emit('changeRoom', newRoom);
    });

    function addParticipantsMessage(data) {
        var message = '';
        if (data === 1) {
            message += "<b>There's 1 participant</b>";
        } else {
            message += "<b>There are " + data + " participants</b>";
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


    $("#shapes").click(function () {
        if ($('.shape').is(':visible')) {
            $(".shape").hide();
        }
        else {
            $(".shape").show();
        }
    });

    $(".shape").click(function () {
        $('.shape').hide();
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

    $("#rooms").click(function () {
        socket.emit('getRoomList');
    });

    $("#save").click(function () {
        var img = canvas.toDataURL("image/png");
        var saveImageWindow = window.open("");
        var title = 'image' + new Date().toISOString();

        saveImageWindow.document.write('<title>' + title + '</title>');
        saveImageWindow.document.write('<img src="' + img + '"/>');
    });

    $("#text").click(function () {
        if (isText) {
            alert("Text mode disabled!");
            isText = false;
        } else {
            alert("Text mode enabled!");
            isShape = false;
            isBrush = false;
            isText = true;
        }

        console.log(isText);
    });

    $("#brush").click(function () {
        isText = false;
        isShape = false;
        isBrush = true;
    });

    resizeMessageDiv(1366, 90, 93);

    function resizeMessageDiv(width, small, large) {
        if (screenWidth > width) {
            $('.messages').css({'height': large + "%"});
        } else {
            $('.messages').css({'height': small + "%"});
        }
    }

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


    $('#undo').click(function () {
        socket.emit('undo');
    });

// main loop, running every 25ms
    function mainLoop() {
        // check if the user is drawing
        draw();

        resizeScreen();

        setTimeout(mainLoop, 25);
    }

    mainLoop();

    function draw() {
        if (mouse.click && mouse.move && mouse.pos_prev && !isText && !isShape) {
            // send line to to the server
            socket.emit('drawLine', {line: [mouse.pos, mouse.pos_prev]});
            mouse.move = false;
            lineEndingCounter = 0;
        }

        mouse.pos_prev = {x: mouse.pos.x, y: mouse.pos.y, color: mouse.pos.color};

        if (mouse.click && isText) {
            count++;
            console.log(count);

            if (count === 2) {
                var message = prompt('What is your text?');
                mouse.pos.text = message;
                mouse.pos.width = screenWidth;
                socket.emit('drawText', {line: [mouse.pos]});
                // mouse.pos.text = '';
                count = 0;
                mouse.click = false;
            }
        }

        if (mouse.click && isShape) {
            count++;
            console.log(count);

            if (count === 2) {
                mouse.pos.width = screenWidth;
                socket.emit('drawShape', {line: [mouse.pos]});
                count = 0;
                mouse.click = false;
            }
        }

        if (isBrush && !mouse.click) {
            lineEndingCounter++;

            if (lineEndingCounter === 1) {
                socket.emit('lineEnding');
                console.log('delimitator');
            }
        }
    }

    function resizeScreen() {

        if (screenWidth < 800) {
            $('.navbar').hide();
            resizeMessageDiv(800, 100, 100)
        } else {
            $('.navbar').show();
            resizeMessageDiv(1366 , 90, 93)

        }

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