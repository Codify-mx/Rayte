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
        //GPS.agregaMensaje('terminado');


            //GPS.startWatch();

        var lanlng_txt = GPS.latlng.join(',');
        console.log('text: ' + lanlng_txt);
    },
    /*
     *  Obtiene la posición actual del dispositivo
     */
    centrarMapa: function () {
        GPS.swalPreloader('Buscando ubicación ...');
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
        //$$('.fixed-marker').show();
        GPS.codeLatLng(myLatlng, GPS.pin.usuario, true);
        swal.close();
       // app.hidePreloader();
    },
    /*
     * Se llama al estar listo el dispositivo, centra el mapa en la posicion y agrega evento para poder inciciar el servicio de rastreo
     */
    onDeviceReady: function () {
        //GPS.agregaMensaje('Listo');
        GPS.iniciaMapa();
        GPS.centrarMapa();
        //GPS.agregaMensaje('Si watch');
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
        GPS.muestraRutaMapa('usuario');
        this.watchID = navigator.geolocation.watchPosition(GPS.onSuccess, GPS.onError, options);
        /*
        $('#fetch').click(function () {
            GPS.cancelWatch();
        });*/
    },
    /*
     *  Manda un mensaje en caso de no poder obtener la posición
     */
    onError: function (error) {
        //app.hidePreloader();
        GPS.agregaMensaje('No ha sido posible obtener su ubicación',true);
        /*
        swal({
            title: "Error al buscar ubicación",
            text: "No ha sido posible obtener su ubicación",
            type: "error",
            confirmButtonText: "Aceptar"
        });
        */
    },
    /*
     *  Guarda la posicíon obtenida en un arreglo e imprime la posicion en pantalla
     *  @param Object position Objeto de posición generado por el servicio getCurrentPosition o watchPosition
     */
    onSuccess: function (position) {
        //GPS.agregaMensaje('Lat: ' + position.coords.latitude + ' Lng: ' + position.coords.longitude);
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
                //console.log('exito SavePosition: ' + objJSON);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                //console.log('error taxi: ' + textStatus);
            }
        });
    },
    llamarOperadora: function(){
        window.open('tel:4777178399', '_system');
    },
    /*
     *  Envia mensaje a pantalla
     *  @oaram String mensaje Mensaje a enviar a pantalla
     */
    agregaMensaje: function (mensaje,call) {
        if (call) {
            swal({
                title: mensaje,
                text: "¿ Desea llamar a la operadora ?",
                showCancelButton: true,
                confirmButtonColor: "#009bdb",
                confirmButtonText: "Si",
                cancelButtonText: "No",
                cancelButtonColor: "#2f3946",
                closeOnConfirm: true,
                animation: true,
                imageUrl: "./assets/iconos/ayuda.png"
            },function () {
                GPS.llamarOperadora();
            });
        }else{
            swal({
                title: "Error de Conexión!",
                text: mensaje,
                type: "error",
                confirmButtonText: "Aceptar"
            });  
        }
    },
    /*
     *  Obtiene la posición geografica (latlng) mediante una direcion (Calle numero colonia)
     *  genera un pin nuevo en la posición
     */
    codeAddress: function () {
        if (rayte.checkConnection()) {
            if (document.getElementById("map-address").value.trim() === '' || document.getElementById("map-address").value.trim() === GPS.pin.usuario.address) {
                swal({
                    title: "¡ No hay dirección !",
                    text: "Porfavor escribe una dirección",
                    type: "error",
                    confirmButtonText: "Aceptar"
                });
            }else{
                GPS.swalPreloader('Buscando...');
                var address = document.getElementById("map-address").value;
                GPS.geocoder.geocode({'address': address,bounds:GPS.pin.usuario.cityBounds,region: 'MX'}, GPS.validarCodeAddress);
            }
        }else{
            GPS.agregaMensaje('No existe conexión de internet',true);
            /*
            swal({
                title: "Error de Conexión!",
                text: "No existe conexión de internet",
                type: "error",
                confirmButtonText: "Aceptar"
            });
            */
        }
        
    },
    /*
     *  Obtiene la dirección (Calle numero colonia)  mediante una posicion (latlng)
     *  imprime la dirección
     */
    codeLatLng: function (latlng, pin, centrar) {
        GPS.geocoder.geocode({'latLng': latlng}, function (results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                console.log(results);
                var dir = results[0].address_components;
                var direccion =dir[1].short_name+' '+dir[0].short_name+', '+dir[2].short_name;
                pin.address = direccion;
                if (centrar)
                    $('#map-address').val(direccion);
                    GPS.pin.usuario.cityBounds = results[4].geometry.bounds;
            } else {
                // GPS.validarCodeAddress(results, status);
            }
        });
    },
    /*
     *  Calcula la ruta mas corta entre dos puntos y la muestra en el mapa
     */
    calcularRuta: function () {
        var origen = GPS.pin.usuario.getPosition() || '';
        var destino = GPS.pin.destino.getPosition() || '';
        var request = {
            origin: origen,
            destination: destino,
            travelMode: google.maps.TravelMode.DRIVING,
            provideRouteAlternatives: true
        };
        console.log(request);
        GPS.directionsService.route(request, GPS.validarRuta);
    },
    validarRutaTaxi: function (result, status) {
        if (google.maps.DirectionsStatus.OK) {
            var index = GPS.calulaRutaCorta(result.routes);
            GPS.pin.taxi.setMap(GPS.mapa);
            GPS.rutas.taxi.index = index;
            GPS.rutas.taxi.directions = result;
            GPS.muestraRutaMapa('taxi');
            GPS.pin.destino.setMap(null);
            swal.close();
           
            $$('.on-route .time').html(result.routes[0].legs[0].duration.text);
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
        //GPS.agregaMensaje('Imprime array: ' + GPS.latlng.length);
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
        //GPS.agregaMensaje('Dibujado live: ' + latlng);
    },
    /*
     *  @deprecated
     *  Dibuja el camino recorrido en base al arreglo total de posiciones ( no tiempo real )
     */
    dibujaRecorrido: function () {
        //GPS.agregaMensaje('Dibuja Recorrido');
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
            //GPS.agregaMensaje('Estoy en la ruta');
            if (GPS.pin.usuario.range.getBounds().contains(GPS.pin.destino.getPosition())) {
                GPS.cancelWatch();
                GPS.showModal('#popover-rate', '#request-taxi-button');
            }
        } else {
           // GPS.agregaMensaje('No estoy en la ruta');
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
    menuSwiper: null,
    /*
    setTipoTaxi: function (swiper) {
        if (swiper.isBeginning) {
            GPS.tipoTaxi = 1;
        }else if(swiper.isEnd){
            GPS.tipoTaxi = 2;
        }else{
            GPS.tipoTaxi = 0;
        }
    },*/
    getTipoTaxi: function(){
        
      return false;  
    },
    /*
     * Obtiene una posición aleatoria del servidor, mueve el pin de destion a la posicion
     */
    getTaxi: function () {
        if (rayte.checkConnection()) {
            if (GPS.tipoTaxi) {
                if (GPS.pin.destino.getMap() || true) {
                    GPS.swalPreloader('Pidiendo...');
                    var jqxhr = $.ajax({
                        method: "get",
                        url: "http://104.131.60.162/index.php/REST/getTaxisLocation",
                        dataType: "json",
                        crossDomain: true,
                        beforeSend: function(){
                                $$(document).off('touchend touchstart','#request-taxi-button');
                        },
                        success: function (objJSON) {
                            GPS.buscaTaxistaCercano(objJSON);
                        },
                        error: function (jqXHR, textStatus, errorThrown) {
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
        }else{
            GPS.agregaMensaje('No existe conexión de internet',true);
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
        },function () {
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
        console.log('validar ruta');
        console.log(status);
        console.log(result);
        switch (status) {
            case google.maps.DirectionsStatus.OK:
                var index = GPS.calulaRutaCorta(result.routes);
                GPS.getPolyline(result.routes[GPS.calulaRutaCorta(result.routes)]);
                GPS.rutas.usuario.index = index;
                GPS.rutas.usuario.directions = result;
                GPS.muestraRutaMapa('usuario');
                GPS.polyline.route = GPS.getPolyline(result.routes[index]);
                $$('#popover-confirm-start').html(GPS.pin.usuario.address);
                $$('#popover-confirm-end').html(GPS.pin.destino.address);
                $$('#popover-confirm-time').html(result.routes[index].legs[0].duration.text);
                swal.close();
                break;
            case google.maps.DirectionsStatus.INVALID_REQUEST:
                //GPSps("Solicitud Inválida");
                GPS.agregaMensaje('No se pudo obtener la dirección',true);
                break;
            case google.maps.DirectionsStatus.MAX_WAYPOINTS_EXCEEDED:
               // GPS.agregaMensaje("Demasiados puntos intermedios");
                GPS.agregaMensaje('Ocurrio un error',true);
                break;
            case google.maps.DirectionsStatus.NOT_FOUND:
                //GPS.agregaMensaje("Algun punto intermedio no fue encontrado");
                GPS.agregaMensaje('No se pudo obtener la dirección',true);
                break;
            case google.maps.DirectionsStatus.OVER_QUERY_LIMIT:
                //GPS.agregaMensaje("Limite de peticiones");
                GPS.agregaMensaje('No se pudo obtener la dirección',true);
                break;
            case google.maps.DirectionsStatus.REQUEST_DENIED:
                //GPS.agregaMensaje("Se denegó el acceso a la api");
                GPS.agregaMensaje('No se pudo obtener la dirección',true);
                break;
            case google.maps.DirectionsStatus.UNKNOWN_ERROR:
                GPS.agregaMensaje('No se pudo obtener la dirección',true);
                //GPS.agregaMensaje("No se pudo procesar debido a un error del servidor");
                break;
            case google.maps.DirectionsStatus.ZERO_RESULTS:
                GPS.agregaMensaje('No se pudo obtener la dirección',true);
                //GPS.agregaMensaje("No se pudo encontrar una ruta entre el origen y el destino");
                break;
            default:
                //GPS.agregaMensaje("direction false");
                GPS.agregaMensaje('No se pudo obtener la dirección',true);
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
                    GPS.pin.destino.setPosition(results[0].geometry.location);
                    var dir = results[0].address_components;
                    var direccion =dir[1].short_name+' '+dir[0].short_name+', '+dir[2].short_name;
                    GPS.pin.destino.address = direccion;
                    GPS.calcularRuta();
                break;
            case google.maps.GeocoderStatus.ERROR:
                    GPS.agregaMensaje("Ocurrio un error",true);
                    //agrega al log ( id_usuario, codeAdress,ERROR, "Geocoder: No se pudo contactar con los servidores" );
                break;
            case google.maps.GeocoderStatus.INVALID_REQUEST:
                    //agrega al log ( id_usuario, codeAdress,INVALID_REQUEST, "Geocoder: Solicitud Inválida" );
                    GPS.agregaMensaje("No pudimos encontrar la dirección",true);
                break;
            case google.maps.GeocoderStatus.OVER_QUERY_LIMIT:
                //agrega al log ( id_usuario, codeAdress,OVER_QUERY_LIMIT, "Geocoder: Limite de peticiones" );
                    GPS.agregaMensaje("Ocurrio un error",true);
                break;
            case google.maps.GeocoderStatus.REQUEST_DENIED:
                    //agrega al log ( id_usuario, codeAdress,REQUEST_DENIED, "Geocoder: Se denegó el acceso a la api" );
                    GPS.agregaMensaje("Ocurrio un error",true);
                break;
            case google.maps.GeocoderStatus.UNKNOWN_ERROR:
                //agrega al log ( id_usuario, codeAdress,UNKNOWN_ERROR, "Geocoder: No se pudo procesar debido a un error del servidor" );
                    GPS.agregaMensaje("Ocurrio un error",true);
                break;
            case google.maps.GeocoderStatus.ZERO_RESULTS:
                    //agrega al log ( id_usuario, codeAdress,ZERO_RESULTS, "Geocoder: No se pudo encontrar la direccion especificada" );
                    GPS.agregaMensaje("Ocurrio un error",true);
                break;
            default:
                    GPS.agregaMensaje("Ocurrio un error", true);
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
                        data: {id: e.regid, id_usuario: localStorage.id_usuario},
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
                                GPS.pedirTaxi();
                            } else {
                                //app.hidePreloader();
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
                            //app.hidePreloader();
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
    mostrarPreview: function(){
        
        $$('#popover-preview-origen').val(GPS.pin.usuario.address);
        $$('#popover-preview-destino').val(GPS.pin.destino.address);
        GPS.calcularRuta();
        $$('#popover-preview-button').off('touchstart').on('touchstart',function(){
            require('js/soap.js',function(){
                soap.pago.saveMetodo($$('#metodo-pago').val(),function(data){
                    GPS.pedirTaxi();
                },function(){
                    rayte.swalError('Error enviar metodo');
                });
            });
        });
       
        GPS.showModal('#popover-preview', '#request-taxi-button');
        
    },
    /*
     *  pide un taxi específico, si no está disponible o se cancela, busca el siquiente taxi
     *  @param {Object} taxi objeto con la informacion del taxi ( id, latlng)
     */
    pedirTaxi: function () {
        if (rayte.checkConnection()) {
            if (GPS.tipoTaxi) {
                if (GPS.pin.destino.getPosition()) {
                    GPS.swalPreloader('Pidiendo...');
                    var OlatLng = GPS.pin.usuario.getPosition();
                    var DlatLng = GPS.pin.destino.getPosition();
                    ////'taxiId': taxi.id,'ubicacionTaxi': JSON.stringify(taxi.latlng),
                    var datos = {
                        'id_usuario': localStorage.id_usuario,
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
                        beforeSend: function(){
                            $$(document).off('touchend touchstart','#request-taxi-button');
                        },
                        crossDomain: true,
                        success: function (objJSON) {
                            try {
                                console.log(objJSON);
                                if (objJSON.status == '200') {
                                    console.log(objJSON);
                                    GPS.swalPreloader('Calculando ruta ...');
                                    taxi = objJSON.taxi;
                                    $('#taxi-conductor').html(taxi.nombreConductor);
                                    $('#taxi-id').html(taxi.id);
                                    $('#taxi-placas').html(taxi.placas);
                                    //var ubTaxi = JSON.parse(objJSON.ubicacionTaxi);
                                    GPS.pin.taxi.setPosition({lat: objJSON.ubicacionTaxi.A, lng: objJSON.ubicacionTaxi.F});
                                    GPS.pin.taxi.idTaxi = taxi.id;
                                    if (taxi.imagen) {
                                        $$('.edit-profile-image').css("background-image", "url('"+taxi.imagen+"')"); 
                                    }
                                    var request = {
                                        origin: GPS.pin.taxi.getPosition(),
                                        destination: GPS.pin.usuario.getPosition() || '',
                                        travelMode: google.maps.TravelMode.DRIVING,
                                        provideRouteAlternatives: true
                                    };
                                    GPS.directionsService.route(request, GPS.validarRutaTaxi);
                                }/* else {
                                    GPS.agregaMensaje('No hemos podido encontrar un taxi cercano', true);
                                    GPS.taxis.shift();
                                    if (GPS.taxis.length) {
                                        GPS.pedirTaxi(GPS.taxis[0]);
                                    } else {
                                        swal({
                                            title: "Error!",
                                            text: "No hay taxis disponibles",
                                            type: "error",
                                            confirmButtonText: "Aceptar"
                                        });
                                    }
                                }
                                */
                            } catch (e) {
                                console.log(e);
                                swal({
                                    title: "Error al pedir taxi 200!",
                                    text: e.message,
                                    type: "error",
                                    confirmButtonText: "Aceptar"
                                });
                            }
                        },
                        error: function (jqXHR, textStatus, errorThrown) {
                            console.log(errorThrown);
                            swal({
                                title: "Error al pedir taxi!",
                                text: textStatus + ': ' + errorThrown,
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
        }else{
            GPS.agregaMensaje('No existe conexión de internet',true);
        }
    },
    /*
     * Se guarda el intervalo utilizado para pedir la solicitud del taxi
     */
    taxiInterval: null,
    /*
     *  Pide la posición actual del taxi y actualizza el mapa, se ejecuta cada 1.2 segundos
     *  ahorita
     */
    actualizaPinTaxi: function () {
        GPS.pin.taxi.idTaxi = GPS.pin.taxi.idTaxi || 35;
        GPS.taxiInterval = setInterval(function () {
            var jqxhr = $$.ajax({
                method: "POST",
                url: "http://104.131.60.162/index.php/REST/getCurrentTaxi",
                dataType: "json",
                data: {taxiId: GPS.pin.taxi.idTaxi},
                crossDomain: true,
                success: function (data) {
                    if (parseInt(data.status) == 200){
                       // var ubTaxi = JSON.parse(data.ubicacionTaxi);
                       console.log(data.ubicacionTaxi);
                        GPS.pin.taxi.setPosition({lat: data.ubicacionTaxi.A, lng: data.ubicacionTaxi.F});
                        if (GPS.pin.usuario.range.getBounds().contains(GPS.pin.taxi.getPosition())) {
                            //GPS.showModal('#popover-rate', '#request-taxi-button');
                            for (var i = 1; i <= GPS.taxiInterval+1; i++)
                                    window.clearInterval(i);
                             swal({
                                title: "Iniciar Recorrido",
                                showCancelButton: false,
                                confirmButtonColor: "#009bdb",
                                confirmButtonText: "Aceptar",
                                closeOnConfirm: true,
                                animation: false
                            },function () {
                               GPS.startWatch();
                            });
                        } 
                    }
                    //GPS.pin.taxi.setPosition(objJSON.latlng);
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    console.log(errorThrown);
                    console.log(textStatus);
                    clearInterval(GPS.taxiInterval);
                    clearInterval(GPS.taxiInterval);
                    /*
                    if (GPS.pin.usuario.range.getBounds().contains(GPS.pin.usuario.getPosition())) {
                        console.log('Llego el taxi');
                    }
                    */
                }
            });
        }, 1500);
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
            swal({
                title: "Error Buscar Taxi Cercano !",
                text: e.message,
                type: "error",
                confirmButtonText: "Aceptar"
            });
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
            type: "info",
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
        swal.close();
        //$$('.map-popover').hide();
        $$('.map-popover').removeClass('active');
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
        $$(me).css('top', (modalOffset.top - meHeight-20));
        $$(me).css('left', ((deviceWidth / 2) - (meWidth / 2)));
        //$$(me).show();
        //  $$(me).show();
        $$(me).addClass('active');
        $$('.blured').addClass('active');
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
                swal.close();
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
                $$('.blured').removeClass('active');
                $$('.map-popover').hide();
                $$('.map-main-menu').show();
                $$('.on-route').hide();
                GPS.directionsDisplay.setDirections({routes:[]});
                GPS.pin.taxi.setMap(null);
                GPS.pin.usuario.setMap(null);
                GPS.pin.destino.setMap(null);
                GPS.cancelWatch();
                GPS.centrarMapa();
                $$('.fixed-marker').show();
                for (var i = 1; i <= GPS.taxiInterval+1; i++)
                        window.clearInterval(i);
                $$(document).off('touchstart','#request-taxi-button').on('touchstart','#request-taxi-button', function(){
                    $$(this).addClass('active');
                });
                $$(document).off('touchend','#request-taxi-button').on('touchend','#request-taxi-button', function(){
                    $$(this).removeClass('active');
                    //GPS.getTaxi();
                    //GPS.pedirTaxi();
                   
                    GPS.mostrarPreview();
                    /*
                    swal({
                        title: "Seleccionar método de pago",
                        text: '<select class="col-xs-12 form-control" id="metodo-pago"><option value="1">Tarjeta</option><option value="2">Pre-pago</option></select>',
                        showCancelButton: true,
                        confirmButtonColor: "#009bdb",
                        confirmButtonText: "Si",
                        cancelButtonText: "No",
                        cancelButtonColor: "#2f3946",
                        closeOnConfirm: true,
                        animation: false,
                        html:true
                    },function () {
                        require('js/soap.js',function(){
                            soap.pago.saveMetodo($$('#metodo-pago').val(),function(data){
                                GPS.pedirTaxi();
                            },function(){
                                rayte.swalError('Error enviar metodo');
                            });
                        });
                    });
                    */
                });
            break;
        }
    },
    /*
     * Inicia todos los componentes del mapa, notificaciones y hace binding de los eventos
     */
    iniciaMapa: function (){
        swal.setDefaults({ animation: false });
        var opciones = {
            //center: new google.maps.LatLng(19, -99.1333),
            zoom: 4,
            mapTypeControl: false,
            noClear: true,
            overviewMapControl: false,
            panControl: false,
            scaleControl:false,
            streetViewControl: false
        };
        GPS.mapa = new google.maps.Map(document.getElementById('map-canvas'), opciones);
        GPS.initiatePushNotifications();
        
        GPS.menuSwiper = app.swiper('.swiper-container', {
            speed: 400,
            spaceBetween: 0,
            initialSlide:1,
            /*
            onReachBeginning: function(){GPS.setTipoTaxi(GPS.menuSwiper);},
            onReachEnd: function(){GPS.setTipoTaxi(GPS.menuSwiper);},
            */
            onSlideChangeEnd: function(swiper){
                 if (swiper.isBeginning) {
                        GPS.tipoTaxi = 1;
                }else if(swiper.isEnd){
                        GPS.tipoTaxi = 2;
                }else{
                        GPS.tipoTaxi = 0;
                }
                console.log(GPS.tipoTaxi);
            },
            resistance:false,
            preventClicks:false,
            slideToClickedSlide:true,
            onTap: function(swiper,event){
                if (event.target.id == 'car-taxi-button') {
                    GPS.menuSwiper.slideTo(2);
                }else if (event.target.id == 'van-taxi-button') {
                    GPS.menuSwiper.slideTo(0);
                }else{
                    GPS.menuSwiper.slideTo(1);
                }
            }
        });
        
        $$('.swiper-slide .van').on('touchstart',function(){
            console.log('click');
        });
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
                console.log('dragend');
                //GPS.pin.usuario.setPosition(GPS.mapa.getCenter());
                //GPS.codeLatLng(GPS.mapa.getCenter(), GPS.pin.usuario, true);
                GPS.pin.destino.setPosition(GPS.mapa.getCenter());
                GPS.codeLatLng(GPS.mapa.getCenter(), GPS.pin.destino, true);
            }
        });
        
        google.maps.event.addListenerOnce(GPS.mapa,'tilesloaded', function(){
             $$('<div/>').addClass('fixed-marker').appendTo(GPS.mapa.getDiv());
            var p = GPS.overlay.getProjection().fromLatLngToContainerPixel(GPS.mapa.getCenter());
            var markerHeight = $$('.fixed-marker').height();
            var markerWidth = $$('.fixed-marker').width()/2;
            GPS.pin.destino.setPosition(GPS.mapa.getCenter());
            $$('.fixed-marker').offset({top:(p.y-markerHeight),left:(p.x-markerWidth)});
            $$('.fixed-marker').show();
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
        
        $$('#map-address').on('keyup', function(e) {
            var theEvent = e || window.event;
            var keyPressed = theEvent.keyCode || theEvent.which;
            if (keyPressed == 13) {
                $$('#search-address-button').trigger( 'touchstart' );
                $$(this).blur();
            }
            return true;
        });

        
        /* Eventos para map menu */
        $$(document).on('touchstart','#search-address-button', function(){
            GPS.codeAddress();
        });
        /*
        $$(document).on('touchstart','#car-taxi-button', function(e){
            GPS.menuSwiper.slideTo(2)
        });
        
        $$(document).on('touchstart','#van-taxi-button', function(e){
            GPS.menuSwiper.slideTo(0)
        });
        */
        /*
        $$(document).on('touchstart','#request-taxi-button', function(){
            $$(this).addClass('active');
        });
        
        
        $$(document).on('touchend','#request-taxi-button', function(){
            $$(this).removeClass('active');
            GPS.getTaxi();
        });
        */
        $$(document).on('touchcancel','#request-taxi-button', function(){
            $$(this).removeClass('active');
        });
        
        
        /* Eventos para botones de mapa */
        $$(document).on('touchstart','.map-panel-button', function(){
            app.openPanel('right');
        });
        
        $$(document).on('touchstart','.map-center-button', function(){
           GPS.muestraRutaMapa();
        });
        
        $$(document).on('touchstart','.map-call-button', function(){
            GPS.llamarOperadora();
        });
        
        /* Eventos para popover confirm */
        $$(document).on('touchstart','#popover-confirm-yes', function(){
            GPS.muestraRutaMapa('taxi');
            GPS.actualizaPinTaxi();
            $$('#popover-confirm').hide();
            $$('.blured').removeClass('active');
            $$('.map-main-menu').hide();
            $$('.on-route').show();
        });

        $$(document).on('touchstart','#popover-confirm-no', function(){
            GPS.muestraRutaMapa();
            $$('#popover-confirm').hide();
            $$('.blured').removeClass('active');
        });
        
        /* Eventos para popover rate */
        $$(document).on('touchstart','.btn-send', function(){
            $$(this).addClass('active');
            GPS.muestraRutaMapa();
            rT = false;
        });
        
        $$(document).on('touchend','.btn-send', function(e){
            $$(this).removeClass('active');
            GPS.muestraRutaMapa();
        });
        
        $$(document).on('touchcancel','.btn-send',function(e){
            $$(this).removeClass('active');
        });
        
        /* Eventos para  menu panel */
        $$(document).on('touchstart','.item-content', function(e){
           $$(this).addClass('active');
           var target = e.currentTarget.id;
           if (target != 'logout') {
             require(target+'/'+target+'.js', function () {
                        mainView.router.loadPage('./'+target+'/'+target+'.html');
                    });    
           }
        });
        
        $$(document).on('touchend touchcancel','.item-content', function(e){
           $$(this).removeClass('active');
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

(function(){GPS.iniciaMapa()})();