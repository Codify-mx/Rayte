

var TAXI = {
    interval: -1,
    updatePosition: function () {
        TAXI.interval = setInterval(function () {
            require('js/soap.js', function () {
                var latlong = GPS.pin.usuario.getPosition();
                soap.updatePosition(latlong);
            });
        }, 3000);
    },
    login: function (id) {
        require('js/soap.js', function () {
            soap.login(id, function (data) {
                if (data.correcto)
                {
                    TAXI.id = data.id;
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
                    TAXI.updatePosition();
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