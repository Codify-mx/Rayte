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


$(document).on('pageInit', function (e) {
    app.closePanel();
});



