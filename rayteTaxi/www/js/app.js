var VERSION = 2;

var $ = Framework7.$;

var app = new Framework7({
    animateNavBackIcon: true,
    swipePanel: 'right',
    modalButtonOk: 'Aceptar',
    modalButtonCancel: 'Cancelar'
});

var login = app.addView('.view-login', {
    dynamicNavbar: true,
    domCache: true
});

var mainView = app.addView('.view-main', {
    dynamicNavbar: true,
    domCache: true
});

app.allowPanelOpen = false;

$(document).on('pageInit', function (e) {
    app.closePanel();
});


/** control de mapa **/

var mapa = {};
var user = {};

user.login = function () {
    require('js/taxi.js', function () {
        var id = $("#taxi-user").val().trim();
        if (id === '')
        {
            swal({
                title: "Error al hacer login",
                text: "Datos incorrectos",
                type: "error",
                confirmButtonText: "Aceptar"
            });
        }
        else
        {
            TAXI.login(id);
        }
    });
}


