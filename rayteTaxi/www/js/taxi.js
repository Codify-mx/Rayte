

var TAXI = {
    updatePosition: function () {

    },
    login: function (id) {
        require('js/soap.js', function () {
            soap.login(id, function (data) {
                if (data.correcto)
                {
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
                else
                {
                    swal({
                        title: "Error al hacer login",
                        text: "Datos incorrectos",
                        type: "error",
                        confirmButtonText: "Aceptar"
                    });
                }
            });
        });
    },
    id: -1,
    appId: ''

};