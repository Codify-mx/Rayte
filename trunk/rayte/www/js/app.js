var VERSION = 2;

var $ = Framework7.$;

var app = new Framework7({
    animateNavBackIcon: true,
    //swipePanel: 'right',
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

$("#logout").on('touchstart', function (e) {
    app.ls.clear();
    app.closePanel();
    app.showPreloader('Espere');
    $(".view-main").hide();
    $(".view-login").show();
    app.hidePreloader();
});

$("#login-boton").on('touchstart', function () {
    /*app.showPreloader('Espere');
    require('js/soap.js', function () {
        var user = $("#usuario").val().trim();
        var pass = $("#password").val().trim();
        if (user !== '' && pass !== '')
        {
            soap.login(user, pass, function (data) {
                console.log(data);
                $("#usuario,#password").val('');
                if (parseInt(data.id_usuario) != -1)
                {
                    app.hidePreloader();
                    app.ls.login = 1;
                    app.ls.id_usuario = data.id_usuario;
                    $(".view-login").hide();
                    $(".view-main").show();
                    mapa.opciones = {
                        center: new google.maps.LatLng(19, -99.1333),
                        zoom: 4,
                        disableDefaultUI: true
                    };
                    mapa.canvas = new google.maps.Map(document.getElementById('map-canvas'), mapa.opciones);
                    require('js/gps.js', function () {
                        GPS.mapa = mapa.canvas;
                        GPS.mapaModal = mapa.modal;
                        GPS.iniciaMapa();
                        mapa = {};
                        app.hidePreloader();
                    });
                    app.allowPanelOpen = true;
                }
                else
                {
                    app.ls.login = 0;
                    app.ls.version = 0;
                    app.hidePreloader();
                    app.alert('Usuario y/o Password incorrecto', 'Error');
                }
               
            });
            
        }
        else
        {
            app.hidePreloader();
            app.alert('Debe de introducir un usuario y una contraseña', 'Error');
        }
    });*/
});

/** control de mapa **/

var mapa = {};
var user = {};
user.login = function () {
    app.closePanel();
    app.showPreloader('Espere');
    $(".view-login").hide();
    $(".view-main").show();
    mapa.opciones = {
        center: new google.maps.LatLng(19, -99.1333),
        zoom: 4,
        disableDefaultUI: true
    };
    mapa.canvas = new google.maps.Map(document.getElementById('map-canvas'), mapa.opciones);
    require('js/gps.js', function () {
        GPS.mapa = mapa.canvas;
        GPS.mapaModal = mapa.modal;
        GPS.iniciaMapa();
        mapa = {};
        app.hidePreloader();
    });

    app.allowPanelOpen = true;
}

 $$(document).on('touchstart','.back',function(){
        mainView.router.back();
 });

