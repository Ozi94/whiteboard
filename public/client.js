document.addEventListener("DOMContentLoaded", function () {

    var socket = io.connect();

    var color = 'black';
    var size = 2;

    var isBrush = true;
    var isText = false;
    var isShape = false;

    var lineEndingCounter = 0;
    var count = 0;

    var shape;

    var mouse = {
        click: false,
        move: false,
        pos: {x: 0, y: 0, color: color, size: size},
        pos_prev: false
    };

    var colors = document.getElementsByClassName('color');

    for (var i = 0; i < colors.length; i++) {
        colors[i].addEventListener('click', onColorUpdate, false);
        console.log(colors[i]);
    }

    function onColorUpdate(e) {
        mouse.pos.color = e.target.className.split(' ')[1];
    }

    var pen = document.getElementsByClassName('size');

    for (var i = 0; i < pen.length; i++) {
        pen[i].addEventListener('click', onPenSizeUpdate, false);
    }

    function onPenSizeUpdate(e) {
        mouse.pos.size = e.target.className.split(' ')[2];
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
        console.log(position);

        if (position !== null && (position.toUpperCase() === 'Y' || position.toUpperCase() === 'YES')) {
            mouse.pos.vertical = 1;
        }

        alert('Click where your shape want to be placed!');
    }

    function roundTo(n, digits) {
        if (digits === undefined) {
            digits = 0;
        }

        var multiplicator = Math.pow(10, digits);
        n = parseFloat((n * multiplicator).toFixed(11));
        return Math.round(n) / multiplicator;
    }

    var canvas = document.getElementById('drawing');
    var context = canvas.getContext('2d');
    var screenWidth = window.innerWidth;
    var screenHeight = window.innerHeight;

    canvas.width = screenWidth;
    canvas.height = screenHeight;

    canvas.onmousedown = function (e) {
        mouse.click = true;
    };
    canvas.onmouseup = function (e) {
        mouse.click = false;
    };

    canvas.onmousemove = function (e) {
        mouse.pos.x = e.clientX / screenWidth;
        mouse.pos.y = e.clientY / screenHeight;
        mouse.move = true;
    };

    function canvasToImage(backgroundColor) {
        var data;

        if (backgroundColor) {
            data = context.getImageData(0, 0, canvas.width, canvas.height);

            var compositeOperation = context.globalCompositeOperation;

            context.globalCompositeOperation = "destination-over";

            context.fillStyle = backgroundColor;

            context.fillRect(0, 0, canvas.width, canvas.height);
        }

        var imageData = canvas.toDataURL("image/png");

        if (backgroundColor) {
            context.clearRect(0, 0, canvas.width, canvas.height);

            context.putImageData(data, 0, 0);

            context.globalCompositeOperation = compositeOperation;
        }

        return imageData;
    }


    $("#rooms").click(function () {
        socket.emit('getRoomList');
    });

    $("#save").click(function () {
        var a = document.createElement('a');
        a.href = canvasToImage('white');
        a.download = 'image' + new Date().toISOString() + '.png';
        a.click()
    });

    $("#clear").click(function () {
        socket.emit('clearCanvas');
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

    $('#undo').click(function () {
        socket.emit('undo');
    });

    var messageInput = $(".inputMessage").focus();

    $(window).keydown(function (event) {

        if (!(event.ctrlKey || event.metaKey || event.altKey)) {
            messageInput.focus();
        }

        if (event.which === 13 && messageInput.val() !== '') {

            var message = messageInput.val();
            socket.emit('message', message);
            messageInput.val('');
        }
    });

    resizeMessageDiv(1366, 90, 93);

    function resizeMessageDiv(width, small, large) {
        if (screenWidth > width) {
            $('.messages').css({'height': large + "%"});
        } else {
            $('.messages').css({'height': small + "%"});
        }
    }

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

    function draw() {
        if (mouse.click && mouse.move && mouse.pos_prev && !isText && !isShape) {
            socket.emit('drawLine', {line: [mouse.pos, mouse.pos_prev]});
            mouse.move = false;
            lineEndingCounter = 0;
        }

        mouse.pos_prev = {x: mouse.pos.x, y: mouse.pos.y};

        if (mouse.click && isText) {
            count++;
            console.log(count);

            if (count === 2) {
                mouse.pos.vertical = 0;

                var textOrientation = prompt('Vertical? Y/N');

                if (textOrientation !== null
                    && (textOrientation.toUpperCase() === 'Y'
                    || textOrientation.toUpperCase() === 'YES')) {
                    mouse.pos.vertical = 1;
                }

                mouse.pos.text = prompt('What is your text?');
                mouse.pos.width = screenWidth;
                mouse.pos.height = screenHeight;
                socket.emit('drawText', {line: [mouse.pos]});
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

        if (screenWidth !== window.innerWidth || screenHeight !== window.innerHeight) {

            screenWidth = window.innerWidth;
            screenHeight = window.innerHeight;

            //context.clearRect(0, 0, canvas.width, canvas.height);

            canvas.width = screenWidth;
            canvas.height = screenHeight;

            socket.emit('resizeScreen');
        }


        if (screenWidth < 800) {
            $('.navbar').hide();
            resizeMessageDiv(800, 100, 100);
        } else {
            $('.navbar').show();
            resizeMessageDiv(1366, 90, 93);
        }
    }

    socket.on('connect', function () {
        var username = prompt("What's your name?");
        var room = prompt("What's the room you want to connect to?");

        socket.emit('room', room);
        socket.emit('currentRoom', room);
        socket.emit('adduser', username);
    });

    socket.on('currentRoom', function (room) {
        var content = '<p>' + 'Connected to ' + '<b>' + room + '</b>' + '</p>';
        $('.messages').append(content);
    });

    socket.on('userJoined', function (data) {
        var content = '<p>' + '<b>' + data.username + '</b>' + ' joined' + '</p>';
        $('.messages').append(content);
        addParticipantsMessage(data.userNumber);
    });

    socket.on('userLeft', function (data) {

        var content = '<p>' + '<b>' + data.username + '</b>' + ' left' + '</p>';
        $('.messages').append(content);
        addParticipantsMessage(data.userNumber);
    });

    socket.on('message', function (data) {
        console.log(data);
        console.log(data.username);
        console.log('Incoming message:', data.message);

        var content = '<p>' + '<b>' + data.username + '</b>' + ':' + data.message + '</p>';
        $('.messages').append(content);

        document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
    });


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

        if (line === undefined){
            return
        }

        console.log(line);

        if (line[0].text === null || line[0].text === 'null') {
            return;
        }

        for (var i = 0; i < line.length; i++) {
            var width = window.screen.width;
            var height = window.screen.height;
            var fontSize = null;

            var screenRatioW = line[i].width / screenWidth;
            var screenRatioH = line[i].height / window.screen.height;

            var screenRatio = (screenRatioH + screenRatioW) / 2;

            if (width === 800) {
                fontSize = line[i].size * screenWidth / 135 * screenHeight / 500 + "px Arial";
            }

            if (width === 1024) {
                fontSize = line[i].size * screenWidth / 150 * screenHeight / 500 + "px Arial";
            }

            if (width === 1152) {
                fontSize = line[i].size * screenWidth / 210 * screenHeight / 500 + "px Arial";
            }

            if (width === 1280) {
                if (height === 720) {
                    fontSize = line[i].size * screenWidth / 140 * screenHeight / 600 + "px Arial";
                }

                if (height === 768) {
                    fontSize = line[i].size * screenWidth / 155 * screenHeight / 600 + "px Arial";
                }

                if (height === 800) {
                    fontSize = line[i].size * screenWidth / 160 * screenHeight / 600 + "px Arial";
                }

                if (height === 960) {
                    fontSize = line[i].size * screenWidth / 200 * screenHeight / 600 + "px Arial";
                }

                if (height === 1024) {
                    fontSize = line[i].size * screenWidth / 185 * screenHeight / 700 + "px Arial";
                }
            }

            if (width === 1366 || width === 1360) {
                fontSize = line[i].size * screenWidth / 185 * screenHeight / 500 + "px Arial";
            }

            if (width === 1400) {
                fontSize = line[i].size * screenWidth / 185 * screenHeight / 700 + "px Arial";
            }

            if (width === 1440) {
                fontSize = line[i].size * screenWidth / 215 * screenHeight / 500 + "px Arial";
            }

            if (width === 1600) {
                fontSize = line[i].size * screenWidth / 220 * screenHeight / 500 + "px Arial";
            }

            if (width === 1680) {
                fontSize = line[i].size * screenWidth / 255 * screenHeight / 500 + "px Arial";
            }

            if (width === 1920) {
                fontSize = line[i].size * screenWidth / 270 * screenHeight / 500 + "px Arial";
            }

            if (fontSize === null) {
                console.log('enull');
                fontSize = Math.ceil(line[i].size * roundTo(screenRatio, 1) * screenWidth / 200 * screenHeight / 500) + "px Arial";
            }

            if (!line[i].vertical) {

                context.font = fontSize;
                context.fillStyle = line[i].color;
                context.fillText(line[i].text, line[i].x * screenWidth, line[i].y * screenHeight);
            }
            else {

                var text = line[i].text;
                var textSpacing = 0;

                for (var j = 0; j < text.length; j++) {

                    context.font = fontSize;
                    context.fillStyle = line[i].color;
                    context.fillText(text[j], line[i].x * screenWidth, line[i].y * screenHeight + textSpacing);
                    textSpacing += parseFloat(fontSize.match(/\d+\.\d+/)[0]);
                }
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

    socket.on('clearCanvas', function () {
        context.clearRect(0, 0, canvas.width, canvas.height);
    });

    socket.on('cleanChatBox', function () {
        $('#messages').empty();
    });

    socket.on('roomlist', function (data) {
        console.log(data);
        var newRoom = prompt('Available rooms: ' + data + '. Please enter the room to connect to');
        console.log(newRoom);
        socket.emit('changeRoom', newRoom);
    });

    function mainLoop() {
        draw();

        resizeScreen();

        setTimeout(mainLoop, 25);
    }

    mainLoop();

});