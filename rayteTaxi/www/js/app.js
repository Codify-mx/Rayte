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


/** control de mapa **/

var mapa = {};
var user = {};
 user.login = function(){
    app.closePanel();
    app.showPreloader('Espere');
    $(".view-login").hide();
    $(".view-main").show();
    mapa.opciones = {
        center: new google.maps.LatLng( 19, -99.1333),
        zoom: 4,
        disableDefaultUI: true
    };
    /*
    var styles = [
        {
          featureType: "poi",
          stylers: [
           { visibility: "off" }
          ]   
        }
    ];
    */
    mapa.canvas = new google.maps.Map(document.getElementById('map-canvas'), mapa.opciones);
    require('js/gps.js',function(){
        GPS.mapa = mapa.canvas;
        GPS.mapaModal = mapa.modal;
        GPS.iniciaMapa();
        mapa = {};
        app.hidePreloader();
    });
}


