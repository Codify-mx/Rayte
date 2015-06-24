var GPS = {
    /*
     *  Mapa a utilizar
     */
    mapa: null,
    /*
     *  Geocoder utilizado para encontrar latlng mediante direcciones (calle,numero,colonia) y viceversa
     */
    geocoder: null,
    /*
     *  Servicio usado para calcular la ruta entre dos puntos, distancia, tiempo...
     */
    directionsService: null,
    /*
     *  Objeto para guardar la ruta y mostrarla en el mapa
     */
    directionsDisplay: null,
    /*
     *  Objeto que contiene las diferentes polylineas a utilizar
     *      route: linea de la ruta, utilizada para detectar si se está saliendo o no de la ruta
     *      live: linea generada en vase al movimiento del dispositivo
     *      aux: linea auxiliar
     */
    polyline: {
        route: null,
        live: null,
        aux: null
    },
    rutas: {
        usuario: {
            index: null,
            directions: null
        },
        taxi: {
            index: null,
            directions: null
        }
    },
    /*
     *  Geocoder utilizado para encontrar latlng mediante direcciones (calle,numero,colonia)
     */
    watchID: 0,
    /*
     *  Objeto que conitene los diferentes marcadores a utilizar
     *      origen: marcador punto de origen (dispositivo)
     *      destino: marcador del lugar  al cual se quiere llegar
     */
    pin: {
        usuario: null,
        destino: null,
        taxi: null
    },
    latlng: [],
    /*
     * Funcion que inicia el objeto
     */
    initialize: function () {
        console.log('deviceready');
        this.bindEvents();
    },
    /*
     * Guardar instancia para eventos al mantener presionado sobre el mapa
     */
    longPress: null,
    /*
     *  agrega el evento "deviceready" para poder llamar los plugins del celular (geolocation) de manera segura
     */
    bindEvents: function () {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    /*
     *  Cancela el servicio "watchPosition", cambia evento en el boton "fetch" para poder iniciarlo de nuevo
     */
    cancelWatch: function () {
        navigator.geolocation.clearWatch(GPS.watchID);
        GPS.agregaMensaje('terminado');
        $('#fetch').html('Iniciar');
        $('#fetch').unbind("click");
        $('#fetch').click(function () {
            GPS.startWatch();
        });
        var lanlng_txt = GPS.latlng.join(',');
        console.log('text: ' + lanlng_txt);
    },
    /*
     *  Obtiene la posición actual del dispositivo
     */
    centrarMapa: function () {
        //app.hidePreloader();
        app.showPreloader('Buscando ubicacion ...');
        navigator.geolocation.getCurrentPosition(GPS.onSuccessCenter, GPS.onError);
    },
    /*
     *  Centra el mapa en la posicion del dispositivo y cambia la posición del pin
     *  @param Object position Objeto de posición generado por el servicio getCurrentPosition o watchPosition
     */
    onSuccessCenter: function (position) {
        var myLatlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        //GPS.mapa.panTo(myLatlng);
        GPS.mapa.setCenter(myLatlng);
        GPS.mapa.setZoom(16);
        GPS.pin.usuario.setPosition(myLatlng);
        $$('.fixed-marker').show();
        GPS.codeLatLng(myLatlng, GPS.pin.usuario, true);
        app.hidePreloader();
    },
    /*
     * Se llama al estar listo el dispositivo, centra el mapa en la posicion y agrega evento para poder inciciar el servicio de rastreo
     */
    onDeviceReady: function () {
        GPS.agregaMensaje('Listo');
        GPS.iniciaMapa();
        GPS.centrarMapa();
        GPS.agregaMensaje('Si watch');
        $('#fetch').html('Rastrear');
        $('#fetch').unbind("click");
        $('#fetch').click(function () {
            GPS.startWatch();
        });
        $('#pedirTaxi').click(function () {
            GPS.pedirTaxi();
        });
        GPS.initiatePushNotifications();
    },
    /*
     *  Inicia el servicio de rastreo
     */
    startWatch: function () {
        GPS.polyline.live.setPath([]);
        var options = {enableHighAccuracy: true};
        this.watchID = navigator.geolocation.watchPosition(GPS.onSuccess, GPS.onError, options);
        $('#fetch').html('Cancelar');
        $('#fetch').unbind("click");
        $('#fetch').click(function () {
            GPS.cancelWatch();
        });
    },
    /*
     *  Manda un mensaje en caso de no poder obtener la posición
     */
    onError: function (error) {
        app.hidePreloader();
        swal({
            title: "Buscar Ubicación",
            text: "No ha sido posible obtener su ubicación",
            type: "error",
            confirmButtonText: "Aceptar"
        });
    },
    /*
     *  Guarda la posicíon obtenida en un arreglo e imprime la posicion en pantalla
     *  @param Object position Objeto de posición generado por el servicio getCurrentPosition o watchPosition
     */
    onSuccess: function (position) {
        GPS.agregaMensaje('Lat: ' + position.coords.latitude + ' Lng: ' + position.coords.longitude);
        var myLatLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        GPS.latlng.push(myLatLng);
        if (GPS.polyline.route) {
            GPS.inRoute(myLatLng, GPS.polyline.route);
        }
        GPS.dibujaRecorridoLive(myLatLng);
        GPS.pin.usuario.setPosition(myLatLng);
        var jqrh = $.ajax({
            method: "POST",
            url: "http://104.131.60.162/index.php/REST/savePosition",
            dataType: "json",
            data: {'latlng': JSON.stringify(myLatLng)},
            crossDomain: true,
            success: function (objJSON) {
                console.log('exito SavePosition: ' + objJSON);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log('error taxi: ' + textStatus);
            }
        });
    },
    /*
     *  Envia mensaje a pantalla
     *  @oaram String mensaje Mensaje a enviar a pantalla
     */
    agregaMensaje: function (mensaje) {
        /* var node = document.createElement("LI");
         var textnode = document.createTextNode(mensaje);
         node.appendChild(textnode);
         console.log(mensaje);
         document.getElementById("position").appendChild(node);*/
    },
    /*
     *  Obtiene la posición geografica (latlng) mediante una direcion (Calle numero colonia)
     *  genera un pin nuevo en la posición
     */
    codeAddress: function () {
        app.showPreloader('Buscando...');
        var address = document.getElementById("map-address").value;
        GPS.geocoder.geocode({'address': address}, GPS.validarCodeAddress);
    },
    /*
     *  Obtiene la dirección (Calle numero colonia)  mediante una posicion (latlng)
     *  imprime la dirección
     */
    codeLatLng: function (latlng, pin, centrar) {
        GPS.geocoder.geocode({'latLng': latlng}, function (results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                var dir = results[0].address_components;
                var direccion =dir[1].short_name+' '+dir[0].short_name+', '+dir[2].short_name;
                pin.address = direccion;
                if (centrar)
                    $('#map-address').val(direccion);
            } else {
                // GPS.validarCodeAddress(results, status);
            }
        });
    },
    /*
     *  Calcula la ruta mas corta entre dos puntos y la muestra en el mapa
     */
    calcularRuta: function () {
        GPS.agregaMensaje("Calcular ruta");
        var origen = GPS.pin.usuario.getPosition() || '';
        var destino = GPS.pin.destino.getPosition() || '';
        var request = {
            origin: origen,
            destination: destino,
            travelMode: google.maps.TravelMode.DRIVING,
            provideRouteAlternatives: true
        };
        GPS.directionsService.route(request, GPS.validarRuta);
    },
    validarRutaTaxi: function (result, status) {
        if (google.maps.DirectionsStatus.OK) {
            var index = GPS.calulaRutaCorta(result.routes);
            GPS.pin.taxi.setMap(GPS.mapa);
            //GPS.directionsDisplay.setDirections(result);
            //GPS.directionsDisplay.setRouteIndex(index);
            GPS.rutas.taxi.index = index;
            GPS.rutas.taxi.directions = result;
            GPS.muestraRutaMapa('taxi');
            GPS.pin.destino.setMap(null);
            app.hidePreloader();
            $$('#popover-confirm-start').html(GPS.pin.usuario.address);
            $$('#popover-confirm-end').html(GPS.pin.destino.address);
            $$('#popover-confirm-time').html(result.routes[0].legs[0].duration.text);
            $$('#popover-confirm-cost').html(result.routes[0].legs[0].distance.value);
            GPS.showModal('#popover-confirm', '#request-taxi-button');
        } else {
            swal({
                title: "Error ruta taxi!",
                text: "Error al calcular la ruta del taxi",
                type: "error",
                confirmButtonText: "Aceptar"
            });
        }
    },
    /*
     *  Calcula el indice de la ruta más corta en distancia entre el arreglo de rutas encontrado
     *  @param Array rutas Arreglo de rutas encontradas por el direction services
     *  @returns int routeIndex Indice de la ruta con menor distancia
     */
    calulaRutaCorta: function (rutas) {
        var distancia = 0;
        var routeIndex = 0;
        var counter = 0;
        for (var r in rutas) {
            var legDist = rutas[r].legs[0].distance.value;
            if (counter == 0) {
                distancia = legDist;
                routeIndex = counter;
            } else {
                if (distancia > legDist) {
                    distancia = legDist;
                    routeIndex = counter;
                }
            }
            counter++;
        }
        return  routeIndex;
    },
    /*
     * @deprecated
     * Imprime en consola el arreglo de latlng creado
     */
    imprimeArreglo: function () {
        GPS.agregaMensaje('Imprime array: ' + GPS.latlng.length);
        for (var x in GPS.latlng) {
            console.log(GPS.latlng[x]);
        }
    },
    /*
     *  Dibuja la ruta recorrida en tiempo real, mueve el mapa y el pin a la nueva posición
     *  @param LatLng latlng latitud y longitud nuevos
     */
    dibujaRecorridoLive: function (latlng) {
        GPS.polyline.live.getPath().push(latlng);
        GPS.pin.usuario.setPosition(latlng);
        GPS.mapa.panTo(latlng);
        GPS.agregaMensaje('Dibujado live: ' + latlng);
    },
    /*
     *  @deprecated
     *  Dibuja el camino recorrido en base al arreglo total de posiciones ( no tiempo real )
     */
    dibujaRecorrido: function () {
        GPS.agregaMensaje('Dibuja Recorrido');
        GPS.polyline.aux = new google.maps.Polyline({
            map: GPS.mapa,
            strokeColor: '#FF0000',
            strokeOpacity: 0.7,
            strokeWeight: 5,
            visible: true,
            zIndex: 1,
            path: GPS.latlng
        });
    },
    /*
     *  Obtiene el polyline usado para comprobar si se recorre la ruta en base a la ruta obtenida
     *  @oaram route route ruta a obtener el polyline
     */
    getPolyline: function (route) {
        var polyline = new google.maps.Polyline({
            path: [],
            strokeColor: '#FF0000',
            strokeWeight: 3
        });
        var path = route.overview_path;
        var legs = route.legs;
        for (i = 0; i < legs.length; i++) {
            var steps = legs[i].steps;
            for (j = 0; j < steps.length; j++) {
                var nextSegment = steps[j].path;
                for (k = 0; k < nextSegment.length; k++) {
                    polyline.getPath().push(nextSegment[k]);
                }
            }
        }
        return polyline;
    },
    /*
     *  Detecta si la posicion dada está en la ruta o no
     *  @param latlng myPosition posicion a comprobar
     *  @param google.maps.Polyline polyline ruta a coprobar
     */
    inRoute: function (myPosition, polyline) {
        //console.log(google.maps.geometry.poly.isLocationOnEdge(myPosition, polyline, Math.pow(10, -2)));
        if (google.maps.geometry.poly.isLocationOnEdge(myPosition, polyline, Math.pow(10, -3))) {
            GPS.agregaMensaje('Estoy en la ruta');
            if (GPS.pin.usuario.range.getBounds().contains(GPS.pin.destino.getPosition())) {
                console.log('Llego  al destino');
            } else {
                console.log('Llego el taxi');
            }
        } else {
            GPS.agregaMensaje('No estoy en la ruta');
        }
    },
    /*
     *  arreglo de taxis auxiliar
     */
    taxis: [],
    /*
     * identifica si es camioneta o carro 
     */
    tipoTaxi: null,
    /*
     *  cambia el valor de tipo taxi
     */
    setTipoTaxi: function (val) {
        GPS.tipoTaxi = val;
    },
    /*
     * Obtiene una posición aleatoria del servidor, mueve el pin de destion a la posicion
     */
    getTaxi: function () {
        if (GPS.tipoTaxi) {
            if (GPS.pin.destino.getMap()) {
                app.showPreloader('Pidiendo...');
                var jqxhr = $.ajax({
                    method: "get",
                    url: "http://104.131.60.162/index.php/REST/getTaxisLocation",
                    dataType: "json",
                    crossDomain: true,
                    success: function (objJSON) {
                        console.log('getTAxilocation exito');
                        console.log(objJSON);
                        GPS.buscaTaxistaCercano(objJSON);
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        app.hidePreloader();
                        swal({
                            title: "Error al get taxi!",
                            text: textStatus,
                            type: "error",
                            confirmButtonText: "Aceptar"
                        });
                    }
                });
            }else{
                swal({
                    title: "Elige un Destino!!",
                    text: 'Seleccione La ubicacion de destino',
                    type: "warning",
                    confirmButtonText: "Aceptar"
                });
            }
        } else {
            swal({
                title: "Elige un Taxi!!",
                text: 'Seleccione Vehiculo a solicitar',
                type: "warning",
                confirmButtonText: "Aceptar"
            });
        }
    },
    /*
     *  Coloca un marcador en el centro actual del mapa y calcula la ruta hacia el mismo
     */
    irCentro: function () {
        GPS.pin.destino.setPosition(GPS.mapa.getCenter());
        GPS.calcularRuta();
        GPS.codeLatLng(GPS.pin.destino.getPosition(), GPS.pin.destino);
    },
    /*
     *  Pregunta si se desea calcular la ruta a la posicion donde se mantiene presionado sobre el mapa
     *  @param google.maps.LatLng latlng posicion hacia la cual se desea calcular la ruta
     */
    menuPresionado: function (latlng) {

        swal({
            title: "Seleccionar destino",
            text: "¿ Ruta hasta aquí ?",
            type: "",
            showCancelButton: true,
            confirmButtonColor: "#009bdb",
            confirmButtonText: "Si",
            cancelButtonText: "No",
            cancelButtonColor: "#2f3946",
            closeOnConfirm: true,
            animation: false,
        },
                function () {
                    GPS.pin.destino.setPosition(new google.maps.LatLng(latlng.lat(), latlng.lng()));
                    GPS.codeLatLng(GPS.pin.destino.getPosition(), GPS.pin.destino);
                    GPS.calcularRuta();
                });
    },
    /*
     *  Determina que realizar en base al estatus obtenido al generar la ruta
     *  @param google.maps.DirectionsResult result objeto enviado por el servicio de dirección al generar la ruta
     *  @param google.maps.DirectionsStatus status estatus al generar la ruta
     */
    validarRuta: function (result, status) {
        switch (status) {
            case google.maps.DirectionsStatus.OK:
                var index = GPS.calulaRutaCorta(result.routes);
                GPS.getPolyline(result.routes[GPS.calulaRutaCorta(result.routes)]);
                //GPS.directionsDisplay.setDirections(result);
                //GPS.directionsDisplay.setRouteIndex(index);
                GPS.rutas.usuario.index = index;
                GPS.rutas.usuario.directions = result;
                GPS.muestraRutaMapa('usuario');
                GPS.polyline.route = GPS.getPolyline(result.routes[index]);
                //GPS.inRoute(GPS.pin.usuario, GPS.polyline.route);
                app.hidePreloader();
                break;
            case google.maps.DirectionsStatus.INVALID_REQUEST:
                GPS.agregaMensaje("Solicitud Inválida");
                break;
            case google.maps.DirectionsStatus.MAX_WAYPOINTS_EXCEEDED:
                GPS.agregaMensaje("Demasiados puntos intermedios");
                break;
            case google.maps.DirectionsStatus.NOT_FOUND:
                GPS.agregaMensaje("Algun punto intermedio no fue encontrado");
                break;
            case google.maps.DirectionsStatus.OVER_QUERY_LIMIT:
                GPS.agregaMensaje("Limite de peticiones");
                break;
            case google.maps.DirectionsStatus.REQUEST_DENIED:
                GPS.agregaMensaje("Se denegó el acceso a la api");
                break;
            case google.maps.DirectionsStatus.UNKNOWN_ERROR:
                GPS.agregaMensaje("No se pudo procesar debido a un error del servidor");
                break;
            case google.maps.DirectionsStatus.ZERO_RESULTS:
                GPS.agregaMensaje("No se pudo encontrar una ruta entre el origen y el destino");
                break;
            default:
                GPS.agregaMensaje("direction false");
                break;
        }
    },
    /*
     *  Determina que realizar en base al estatus obtenido al buscar la direccion
     *  @param google.maps.GeocoderResult result objeto enviado por el servicio geocoder
     *  @param google.maps.GeocoderStatus status estatus al generar la dirección
     */
    validarCodeAddress: function (results, status) {
        switch (status) {
            case google.maps.GeocoderStatus.OK:
                //GPS.mapa.setCenter(results[0].geometry.location);
                GPS.pin.destino.setPosition(results[0].geometry.location);
                var dir = results[0].address_components;
                var direccion =dir[1].short_name+' '+dir[0].short_name+', '+dir[2].short_name;
                GPS.pin.destino.address = direccion;
                GPS.calcularRuta();
                break;
            case google.maps.GeocoderStatus.ERROR:
                GPS.agregaMensaje("Geocoder: No se pudo contactar con los servidores");
                break;
            case google.maps.GeocoderStatus.INVALID_REQUEST:
                GPS.agregaMensaje("Geocoder: Solicitud Inválida");
                break;
            case google.maps.GeocoderStatus.OVER_QUERY_LIMIT:
                GPS.agregaMensaje("Geocoder: Limite de peticiones");
                break;
            case google.maps.GeocoderStatus.REQUEST_DENIED:
                GPS.agregaMensaje("Geocoder: Se denegó el acceso a la api");
                break;
            case google.maps.GeocoderStatus.UNKNOWN_ERROR:
                GPS.agregaMensaje("Geocoder: No se pudo procesar debido a un error del servidor");
                break;
            case google.maps.GeocoderStatus.ZERO_RESULTS:
                GPS.agregaMensaje("Geocoder: No se pudo encontrar la direccion especificada");
                break;
            default:
                GPS.agregaMensaje("geocoder false");
                break;
        }
    },
    /*
     *  inicia el servicio de notificaciones push
     */
    initiatePushNotifications: function () {
        try {
            var platform = device.platform.toLowerCase();
            var pushNotification = window.plugins.pushNotification;
            if (platform == 'android') {
                pushNotification.register(GPS.successHandler, GPS.errorHandler, {"senderID": "988953457179", "ecb": "GPS.onNotificationGCM"});
            }
            if (platform.indexOf('ios') !== -1)
            {
                pushNotification.register(GPS.tokenHandler, GPS.errorHandler, {"badge": "false", "sound": "true", "alert": "true", "ecb": "GPS.onNotificationAPN"});
            }
        } catch (err) {
            swal({
                title: "Error!",
                text: err,
                type: "error",
                confirmButtonText: "Ok"
            });
        }
    },
    /*
     *  Controla las notificaciones push en IOS
     */
    onNotificationAPN: function (event) {
        if (event.alert) {
        }
        if (event.sound) {
            var snd = new Media(event.sound);
            snd.play();
        }
    },
    /*
     *  Controla las notificaciones push en android
     */
    onNotificationGCM: function (e) { 
        switch (e.event)
        {
            case 'registered':
                if (e.regid.length > 0)
                {
                    var jqxhr = $.ajax({
                        method: "POST",
                        url: "http://104.131.60.162/index.php/REST/saveID",
                        dataType: "json",
                        data: {'id': e.regid},
                        crossDomain: true,
                        success: function (objJSON) {
                        },
                        error: function (jqXHR, textStatus, errorThrown) {
                        }
                    });
                }
                break;
            case 'message':
                try {
                    var status = e.payload.status;
                    switch (status) {
                        case '200':
                            break;
                        case '404':
                            GPS.taxis.shift();
                            if (GPS.taxis.length) {
                                GPS.pedirTaxi(GPS.taxis[0]);
                            } else {
                                app.hidePreloader();
                                swal({
                                    title: "Error!",
                                    text: "No hay taxis disponibles",
                                    type: "error",
                                    confirmButtonText: "Aceptar"
                                });
                            }
                            break;
                        case '500':
                            setTimeout(function () {
                                GPS.pedirTaxi(GPS.taxis[0]);
                            }, 5000);
                            break;
                        default:
                            app.hidePreloader();
                            swal({
                                title: "Error!",
                                text: "No hay Respuesta",
                                type: "error",
                                confirmButtonText: "Aceptar"
                            });
                            break;
                    }
                } catch (err) {
                    swal({
                        title: "Error!",
                        text: err,
                        type: "error",
                        confirmButtonText: "Aceptar"
                    });
                }
                break;
            case 'error':
            default:
                swal({
                    title: "ERORR REGISTRO!",
                    text: "Error de registro en gmc",
                    type: "error",
                    confirmButtonText: "Aceptar"
                });
                break;
        }
    },
    /*
     *  Funcion si se registra adecuadamente el servicio de notificaciones push en ios
     */
    tokenHandler: function (msg) {
        //registrarDispositivo(msg, 'ios');
    },
    /*
     * Funcion si se registra adecuadamente el servicio de notificaciones push en androids
     */
    successHandler: function (result) {
        console.log(result);
    },
    /*
     *  incion si ocurre error al registrar dispositivo para notificaciones push
     */
    errorHandler: function (error) {
        console.log(error);
    },
    /*
     *  Registra el id de notificaciones push y tipo de dispositivo en la base de datos 
     */
    registrarDispositivo: function (id, plataforma) {
        var jqxhr = $.ajax({
            method: "POST",
            url: "http://104.131.60.162/index.php/REST/saveID",
            dataType: "json",
            data: {'id': id, 'plataforma': plataforma},
            crossDomain: true,
            success: function (objJSON) {
                //alert('exito ajax');
            },
            error: function (jqXHR, textStatus, errorThrown) {
                swal({
                    title: "Error!",
                    text: "Error al registrar dispositivo",
                    type: "error",
                    confirmButtonText: "Aceptar"
                });
            }
        });
    },
    /*
     *  pide un taxi específico, si no está disponible o se cancela, busca el siquiente taxi
     *  @param {Object} taxi objeto con la informacion del taxi ( id, latlng)
     */
    pedirTaxi: function (taxi) {
        var OlatLng = GPS.pin.usuario.getPosition();
        var DlatLng = GPS.pin.destino.getPosition();
        var datos = {
            'taxiId': taxi.id,
            'ubicacionTaxi': JSON.stringify(taxi.latlng),
            'latlngOrigen': JSON.stringify(OlatLng),
            'direccionOrigen': GPS.pin.usuario.address,
            'latlngDestino': JSON.stringify(DlatLng),
            'direccionDestino': GPS.pin.destino.address
        };
        var jqxhr = $.ajax({
            method: "POST",
            url: "http://104.131.60.162/index.php/REST/requestTaxi",
            dataType: "json",
            data: datos,
            crossDomain: true,
            success: function (objJSON) {
                try {
                    console.log('pedir taxi');
                    if (objJSON.status == '200') {
                        app.hidePreloader();
                        app.showPreloader("Calculando Ruta...");
                        taxi = objJSON.taxi;
                        $('#taxi-conductor').html(taxi.nombreConductor);
                        $('#taxi-id').html(taxi.id);
                        $('#taxi-placas').html(taxi.placas);
                        var ubTaxi = JSON.parse(objJSON.ubicacionTaxi);
                        GPS.pin.taxi.setPosition({lat: ubTaxi.A, lng: ubTaxi.F});
                        GPS.pin.taxi.idTaxi = taxi.id;
                        var request = {
                            origin: GPS.taxis[0].latlng,
                            destination: GPS.pin.usuario.getPosition() || '',
                            travelMode: google.maps.TravelMode.DRIVING,
                            provideRouteAlternatives: true
                        };
                        GPS.directionsService.route(request, GPS.validarRutaTaxi);
                    } else {
                        console.log('pedir taxi vacio');
                        GPS.taxis.shift();
                        if (GPS.taxis.length) {
                            GPS.pedirTaxi(GPS.taxis[0]);
                        } else {
                            app.hidePreloader();
                            swal({
                                title: "Error!",
                                text: "No hay taxis disponibles",
                                type: "error",
                                confirmButtonText: "Aceptar"
                            });
                        }
                    }
                } catch (e) {
                    app.hidePreloader();
                    swal({
                        title: "Error al pedir taxi 200!",
                        text: e.message,
                        type: "error",
                        confirmButtonText: "Aceptar"
                    });
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                app.hidePreloader();
                swal({
                    title: "Error al pedir taxi!",
                    text: textStatus + ': ' + errorThrown,
                    type: "error",
                    confirmButtonText: "Aceptar"
                });
            }
        });
    },
    /*
     * Verifica que tipo de conexion tiene el dispositivo, si no existe conexion manda mensaje de error
     */
    checkConnection: function () {
        var networkState = navigator.connection.type;
        if (networkState === Connection.NONE) {
            swal({
                title: "Error de Conexión!",
                text: "No existe conexión de internet",
                type: "error",
                confirmButtonText: "Aceptar"
            });
        }
    },
    /*
     * Se guarda el intervalo utilizado para pedir la solicitud del taxi
     */
    taxiInterval: null,
    /*
     *  Pide la posición actual del taxi y actualizza el mapa, se ejecuta cada 1.2 segundos
     */
    actualizaPinTaxi: function () {
        GPS.pin.taxi.idTaxi = GPS.pin.taxi.idTaxi || 35;
        GPS.taxiInterval = setInterval(function () {
            var jqxhr = $.ajax({
                method: "POST",
                url: "http://104.131.60.162/index.php/REST/getCurrentTaxi",
                dataType: "json",
                data: {taxiId: GPS.pin.taxi.idTaxi},
                crossDomain: true,
                success: function (objJSON) {
                    console.log('success update taxi');
                    if (GPS.pin.usuario.range.getBounds().contains(GPS.pin.usuario.getPosition())) {
                        console.log('Llego el taxi');
                    } else {
                        console.log('Llego el taxi');
                    }
                    //GPS.pin.taxi.setPosition(objJSON.latlng);
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    console.log('error update taxi');
                    if (GPS.pin.usuario.range.getBounds().contains(GPS.pin.usuario.getPosition())) {
                        console.log('Llego el taxi');
                    } else {
                        console.log('Llego el taxi');
                    }
                    /*app.hidePreloader();
                     swal({
                     title: "Error al pedir taxi!",
                     text: textStatus + ': ' + errorThrown,
                     type: "error",
                     confirmButtonText: "Aceptar"
                     });*/
                }
            });
        }, 1200);
    },
    /*
     * Determina que taxi está mas cerca a la ubicacion del usuario
     * @param {Array[Object]} rutas Arreglo de posiciones del taxi {lat,lng}
     */
    buscaTaxistaCercano: function (rutas) {
        try {
            if (Array.isArray(rutas)) {
                if (rutas.length > 0 && rutas[0].lat && rutas[0].long) {
                    GPS.taxis = [];
                    //var origen = new google.maps.LatLng(21.101827, -101.673808);
                    var origen = GPS.pin.usuario.getPosition();
                    for (var r in rutas) {
                        destino = new google.maps.LatLng(rutas[r].lat, rutas[r].long);
                        rutas[r].distancia = google.maps.geometry.spherical.computeDistanceBetween(origen, destino);
                        rutas[r].latlng = destino;
                    }
                    rutas.sort(GPS.comparaDistanciaTaxis);
                    GPS.taxis = rutas;
                    GPS.pedirTaxi(GPS.taxis[0]);
                } else {
                    throw new Error("No hay elementos del taxi");
                }
            } else {
                throw new Error("Error 500: No hay rutas compatibles");
            }
        } catch (e) {
            app.hidePreloader();
            swal({
                title: "Error Buscar Taxi Cercano !",
                text: e.message,
                type: "error",
                confirmButtonText: "Aceptar"
            });
            //siguiente ? 
        }
    },
    /*
     *  Funcion auxiliar para ordenar los taxis por distancia
     */
    comparaDistanciaTaxis: function (a, b) {
        if (a.distancia < b.distancia)
            return -1;
        if (a.distancia > b.distancia)
            return 1;
        return 0;
    },
    /*
     *  Muestra una ventana swal sin botones para mostrar información, debe ser cerrada manualente
     */
    swalPreloader: function (message) {
        swal({
            title: "Espere porfavor",
            text: message,
            type: "warning",
            showConfirmButton: false,
            showCancelButton: false
        });
    },
    /*
     *  Calcula la posicion y muestra el modal en el mapa
     *  @param {string} me css selector del modal a mostrar
     *  @param {string} over css selector sobre el cual se va a calcular la posicion
     */
    showModal: function (me, over) {
        $$('.map-popover').hide();
        var meHeight = $$(me).outerHeight();
        var meWidth = $$(me).outerWidth();
        var modalOffset = $$(over).offset();
        var deviceWidth = window.innerWidth;
        $$(document).click(function (event) {
            if (!$$(event.target).closest(me).length) {
                if ($$(me).is(":visible")) {
                    event.preventDefault();
                }
            }
        });
        $$(me).css('top', (modalOffset.top - meHeight));
        $$(me).css('left', ((deviceWidth / 2) - (meWidth / 2)));
        $$(me).show();
        $$('.blured').show();
    },
    muestraRutaMapa: function(tipo){
        switch(tipo) {
            case 'usuario':
                var ruta  = GPS.rutas.usuario.directions.routes[GPS.rutas.usuario.index];
                GPS.directionsDisplay.setDirections(GPS.rutas.usuario.directions);
                GPS.directionsDisplay.setRouteIndex(GPS.rutas.usuario.index);
                GPS.pin.usuario.setPosition(ruta.legs[0].start_location);
                GPS.pin.destino.setPosition(ruta.legs[0].end_location);
                GPS.pin.usuario.setMap(GPS.mapa);
                GPS.pin.destino.setMap(GPS.mapa);
                GPS.directionsDisplay.setMap(GPS.mapa);
                GPS.pin.taxi.setMap(null);
                $$('.fixed-marker').hide();
                app.hidePreloader();
            break;
            case 'taxi':
                var ruta  = GPS.rutas.taxi.directions.routes[GPS.rutas.taxi.index];
                GPS.directionsDisplay.setDirections(GPS.rutas.taxi.directions);
                GPS.directionsDisplay.setRouteIndex(GPS.rutas.taxi.index);
                GPS.pin.taxi.setPosition(ruta.legs[0].start_location);
                GPS.pin.usuario.setPosition(ruta.legs[0].end_location);
                GPS.pin.taxi.setMap(GPS.mapa);
                GPS.pin.usuario.setMap(GPS.mapa);
                GPS.directionsDisplay.setMap(GPS.mapa);
                GPS.pin.destino.setMap(null);
                $$('.fixed-marker').hide();
                app.hidePreloader();
            break;
            default:
                $$('.map-popover').hide();
                $$('.map-main-menu').show();
                $$('.on-route').hide();
                GPS.directionsDisplay.setDirections({routes:[]});
                GPS.pin.taxi.setMap(null);
                GPS.pin.usuario.setMap(null);
                GPS.pin.destino.setMap(null);
                GPS.centrarMapa();
            break;
        }
    },
    /*
     * Inicia todos los componentes del mapa, notificaciones y hace binding de los eventos
     */
    iniciaMapa: function () {
        GPS.initiatePushNotifications();

        GPS.pin.usuario = new google.maps.Marker({
            icon: {
                url: 'http://104.131.60.162/indicador-usuario.png',
            }
        });
        
        GPS.overlay =  new google.maps.OverlayView();
        GPS.overlay.draw = function() {};
        GPS.overlay.setMap(GPS.mapa);
       

        
        GPS.pin.usuario.range = new google.maps.Circle({map: GPS.mapa, radius: 100, visible: false});

        google.maps.event.addListener(GPS.pin.usuario, "position_changed", function () {
            GPS.pin.usuario.range.setCenter(GPS.pin.usuario.getPosition());
        });

        google.maps.event.addListener(GPS.mapa, 'dragend', function () {
            if (!GPS.directionsDisplay.getDirections().routes.length) {
                GPS.pin.usuario.setPosition(GPS.mapa.getCenter());
                GPS.codeLatLng(GPS.mapa.getCenter(), GPS.pin.usuario, true);
            }
        });
        
        google.maps.event.addListenerOnce(GPS.mapa,'center_changed',function(){
            $$('<div/>').addClass('fixed-marker').appendTo(GPS.mapa.getDiv());
            var p = GPS.overlay.getProjection().fromLatLngToContainerPixel(GPS.mapa.getCenter());
            var markerHeight = $$('.fixed-marker').height();
            var markerWidth = $$('.fixed-marker').width()/2;
            $$('.fixed-marker').offset({top:(p.y-markerHeight),left:(p.x-markerWidth)});
        });


        GPS.pin.destino = new google.maps.Marker({
            map: GPS.mapa,
            icon: {
                url: 'http://104.131.60.162/indicador-destino.png',
            }
        });
        
        GPS.pin.taxi = new google.maps.Marker({
            map: GPS.mapa,
            icon: {
                url: 'http://104.131.60.162/indicador-taxi.png',
            }
        });
        
        GPS.geocoder = new google.maps.Geocoder();
        GPS.polyline.live = new google.maps.Polyline({
            map: GPS.mapa,
            strokeColor: '#FF0000',
            strokeOpacity: 0.7,
            strokeWeight: 5,
            visible: true,
            path: []
        });
        
        GPS.directionsService = new google.maps.DirectionsService();
        GPS.directionsDisplay = new google.maps.DirectionsRenderer({
            map: GPS.mapa,
            draggable: false,
            suppressMarkers: true,
            directions: {routes:[]}
        });
        
        GPS.longPress = new LongPress(GPS.mapa, 750);
        google.maps.event.addListener(GPS.mapa, 'longpress', function (event) {
            GPS.menuPresionado(event.latLng);
        });
        
        GPS.mapa.setOptions({
            styles: [
                {
                    featureType: "poi",
                    stylers: [
                        {
                            visibility: "off"
                        }
                    ]
                }
            ]});
        /** eventos a botones **/
        
        $$('#map-address').focus(function (e) {
            $$(this).val('');
        });
        
        $$('#map-address').blur(function (e) {
            if (!$$(this).val())
                $('#map-address').val(GPS.pin.usuario.address);
        });
        
        $('#van-taxi-button').touchstart(function () {
            GPS.setTipoTaxi(1);
        });
        
        $('#car-taxi-button').touchstart(function () {
            GPS.setTipoTaxi(2);
        });
        
        $('#request-taxi-button').touchstart(function () {
            $$(this).addClass('active');
        });
        
        $('#request-taxi-button').touchend(function () {
            $$(this).removeClass('active');
            GPS.getTaxi();
        });
        
        $('#search-address-button').touchstart(function () {
            GPS.codeAddress();
        });
        
        $('.map-panel-button').touchstart(function () {
            app.openPanel('right');
        });
        $('.map-center-button').touchstart(function () {
           GPS.muestraRutaMapa();
        });
        
        $('#popover-confirm-yes').touchstart(function () {
            GPS.muestraRutaMapa('taxi');
            GPS.actualizaPinTaxi();
            $$('#popover-confirm').hide();
            $$('.blured').hide();
            $$('.map-main-menu').hide();
            $$('.on-route').show();
            setTimeout(function () {
                GPS.muestraRutaMapa('usuario');
                clearInterval(GPS.taxiInterval);
                setTimeout(function(){
                    GPS.showModal('#popover-rate', '#request-taxi-button');
                    }, 5000);
            }, 5000);
        });

        $('#popover-confirm-no').touchstart(function () {
            GPS.muestraRutaMapa();
            $$('#popover-confirm').hide();
            $$('.blured').hide();
        });

        $('.btn-send').touchstart(function () {
            $$(this).addClass('active');
        });

        $('.btn-send').touchend(function () {
            $$(this).removeClass('active');
            GPS.muestraRutaMapa();
        });
        
        GPS.muestraRutaMapa();
    }
}

/* Funciones para simular evento click al mantener presionado sobre el mapa */


/*
 *  Genera el evento para detectar si se manteien presionado sobre el mapa
 *  @param { google.maps.Map } map Mapa al que se le añadirá el evento
 *  @param { int } length tiempo en milisegundos que se requerirá mantener presionado
 */
function LongPress(map, length) {
    this.length_ = length;
    var me = this;
    me.map_ = map;
    me.timeoutId_ = null;
    google.maps.event.addListener(map, 'mousedown', function (e) {
        me.onMouseDown_(e);
    });
    google.maps.event.addListener(map, 'mouseup', function (e) {
        me.onMouseUp_(e);
    });
    google.maps.event.addListener(map, 'drag', function (e) {
        me.onMapDrag_(e);
    });
}


var taxi = {};

/*
 *  Evita que el evento sea llamado si no dura el tiempo suficiente
 */
LongPress.prototype.onMouseUp_ = function (e) {
    clearTimeout(this.timeoutId_);
};
/*
 *  Comienza un contador para llamar al evento presionado
 */
LongPress.prototype.onMouseDown_ = function (e) {
    clearTimeout(this.timeoutId_);
    var map = this.map_;
    var event = e;
    this.timeoutId_ = setTimeout(function () {
        google.maps.event.trigger(map, 'longpress', event);
    }, this.length_);
};

/*
 *  Evita que el evento sea llamado si se esta desplazando el mapa
 */
LongPress.prototype.onMapDrag_ = function (e) {
    clearTimeout(this.timeoutId_);
};

