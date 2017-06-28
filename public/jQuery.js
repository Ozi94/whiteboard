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