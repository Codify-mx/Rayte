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
        origen: null,
        destino: null
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
        // google.maps.event.addDomListener(GPS.mapa, 'drag', GPS.updateMapCenter);
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

        // GPS.imprimeArreglo();
        //GPS.dibujaRecorrido();
    },
    /*
     *  Obtiene la posición actual del dispositivo
     */
    centrarMapa: function () {
        GPS.agregaMensaje('Loading...');
        navigator.geolocation.getCurrentPosition(GPS.onSuccessCenter, GPS.onError);
    },
    /*
     *  Centra el mapa en la posicion del dispositivo y cambia la posición del pin
     *  @param Object position Objeto de posición generado por el servicio getCurrentPosition o watchPosition
     */
    onSuccessCenter: function (position) {
        GPS.agregaMensaje('SUCCESS: Lat: ' + position.coords.latitude + ' Lng: ' + position.coords.longitude);
        var myLatlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        GPS.mapa.setCenter(myLatlng);
        GPS.mapa.panTo(myLatlng);
        GPS.mapa.setZoom(16);
        GPS.pin.origen.setPosition(myLatlng);
        GPS.codeLatLng(myLatlng,GPS.pin.origen);
    },
    /*
     * Se llama al estar listo el dispositivo, centra el mapa en la posicion y agrega evento para poder inciciar el servicio de rastreo
     */
    onDeviceReady: function () {
        GPS.agregaMensaje('Listo');
        
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
        
        
        // $( "body" ).bind( "taphold", GPS.menuPresionado );
    },
    /*
     *  Inicia el servicio de rastreo
     */
    startWatch: function () {
        GPS.agregaMensaje('start watch');
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
        GPS.agregaMensaje(error);
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
        GPS.agregaMensaje('Recorrido live');
        GPS.dibujaRecorridoLive(myLatLng);
        GPS.pin.origen.setPosition(myLatLng);
        console.log('enviar pos');
        var jqrh = $.ajax({
            method: "POST",
            url: "http://104.131.60.162/index.php/REST/savePosition",
            dataType: "json",
            data: { 'latlng': JSON.stringify(myLatLng)  },
            crossDomain: true,
            success: function (objJSON) {
                console.log('exito SavePosition: '+objJSON);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log('error taxi: '+textStatus);
            }
        });
    },
    /*
     *  Envia mensaje a pantalla
     *  @oaram String mensaje Mensaje a enviar a pantalla
     */
    agregaMensaje: function (mensaje) {
        var node = document.createElement("LI");
        var textnode = document.createTextNode(mensaje);
        node.appendChild(textnode);
        console.log(mensaje);
        document.getElementById("position").appendChild(node);
    },
    /*
     *  Obtiene la posición geografica (latlng) mediante una direcion (Calle numero colonia)
     *  genera un pin nuevo en la posición
     */
    codeAddress: function () {
        GPS.agregaMensaje("Buscando");
        var address = document.getElementById("address").value;
        GPS.geocoder.geocode({'address': address}, GPS.validarCodeAddress);
    },
    /*
     *  Obtiene la dirección (Calle numero colonia)  mediante una posicion (latlng)
     *  imprime la dirección
     */
    codeLatLng: function (latlng,pin) {
        GPS.geocoder.geocode({'latLng': latlng}, function (results, status) {
            console.log(status);
            if (status == google.maps.GeocoderStatus.OK) {
                //console.log(results[0].formatted_address);
                //alert(results[0].formatted_address);
                pin.address = results[0].formatted_address;
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
        var origen = GPS.pin.origen.getPosition() || '';
        var destino = GPS.pin.destino.getPosition() || '';
        var request = {
            origin: origen,
            destination: destino,
            travelMode: google.maps.TravelMode.DRIVING,
            provideRouteAlternatives: true
        };
        GPS.directionsService.route(request, GPS.validarRuta);
    },
    /*
     *  Calcula el indice de la ruta más corta en distancia entre el arreglo de rutas encontrado
     *  @param Array rutas Arreglo de rutas encontradas por el direction services
     *  @returns int routeIndex Indice de la ruta con menor distancia
     */
    calulaRutaCorta: function (rutas) {
        GPS.agregaMensaje('ruta corta');
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
        GPS.pin.origen.setPosition(latlng);
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
        console.log(google.maps.geometry.poly.isLocationOnEdge(myPosition, polyline, Math.pow(10, -2)));
        if (google.maps.geometry.poly.isLocationOnEdge(myPosition, polyline, Math.pow(10, -3))) {
            GPS.agregaMensaje('Estoy en la ruta');
        } else {
            GPS.agregaMensaje('No estoy en la ruta');
        }
    },
    taxis: [],
    /*
     * Obtiene una posición aleatoria del servidor, mueve el pin de destion a la posicion
     */
    getTaxi: function () {
        var jqxhr = $.ajax({
            method: "GET",
            url: "http://104.131.60.162/index.php/REST/getTaxisLocation",
            dataType: "json",
            crossDomain: true,
            success: function (objJSON) {
                console.log(objJSON);
                GPS.buscaTaxistaCercano(objJSON);
                /*
                var lat = new google.maps.LatLng(objJSON[0], objJSON[1]);
                console.log(lat);
                GPS.mapa.panTo(lat);
                GPS.pin.destino.setPosition(lat);
                GPS.codeLatLng(lat,GPS.pin.destino);
                GPS.calcularRuta();
                */
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log(errorThrown);
            }
        });
    },
    /*
     *  Coloca un marcador en el centro actual del mapa y calcula la ruta hacia el mismo
     */
    irCentro: function () {
        GPS.pin.destino.setPosition(GPS.mapa.getCenter());
        GPS.calcularRuta();
        GPS.codeLatLng(GPS.pin.destino.getPosition(),GPS.pin.destino);
    },
    /*
     *  Pregunta si se desea calcular la ruta a la posicion donde se mantiene presionado sobre el mapa
     *  @param google.maps.LatLng latlng posicion hacia la cual se desea calcular la ruta
     */
    menuPresionado: function (latlng) {
        navigator.notification.confirm(
                'Ruta hasta aqui?', // message
                function (buttonIndex) {
                    if (buttonIndex === 1) {
                        GPS.pin.destino.setPosition(new google.maps.LatLng(latlng.lat(), latlng.lng()));
                        GPS.codeLatLng(GPS.pin.destino.getPosition(),GPS.pin.destino);
                        GPS.calcularRuta();
                    }
                }, // callback to invoke with index of button pressed
                'Ver ruta', // title
                ['Si', 'No']         // buttonLabels
                );
    },
    /*
     *  Determina que realizar en base al estatus obtenido al generar la ruta
     *  @param google.maps.DirectionsResult result objeto enviado por el servicio de dirección al generar la ruta
     *  @param google.maps.DirectionsStatus status estatus al generar la ruta
     */
    validarRuta: function (result, status) {
        console.log(status);
        switch (status) {
            case google.maps.DirectionsStatus.OK:
                var index = GPS.calulaRutaCorta(result.routes);
                GPS.getPolyline(result.routes[GPS.calulaRutaCorta(result.routes)]);
                GPS.directionsDisplay.setDirections(result);
                GPS.directionsDisplay.setRouteIndex(index);
                GPS.polyline.route = GPS.getPolyline(result.routes[index]);
                GPS.inRoute(origen, GPS.polyline.route);
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
                GPS.agregaMensaje("Encontrado");
                GPS.mapa.setCenter(results[0].geometry.location);
                GPS.pin.destino.setPosition(results[0].geometry.location);
                GPS.pin.destino.address = results[0].formatted_address;
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
    initiatePushNotifications: function () {
        try{
           // alert('successhandler: ');
            var platform = device.platform.toLowerCase();
           // alert('Platform: ' + platform);
            var pushNotification = window.plugins.pushNotification;
            //alert('Platform: ' + platform);
            if (platform == 'android') {
                pushNotification.register(GPS.successHandler, GPS.errorHandler, {"senderID": "988953457179", "ecb": "GPS.onNotificationGCM"});
            }
            if (platform.indexOf('ios') !== -1)
            {
                pushNotification.register(GPS.tokenHandler, GPS.errorHandler, {"badge": "false", "sound": "true", "alert": "true", "ecb": "GPS.onNotificationAPN"});
            }
        }catch(err){
            alert(err);
        }
        
    },
    onNotificationAPN: function (event) {
        //alert('on notification');
        if (event.alert) {
            alert(event.alert);
        }
        
        if (event.sound) {
            var snd = new Media(event.sound);
            snd.play();
        }
        
    },
    onNotificationGCM: function (e) {
        console.log(e);
        switch (e.event)
        {
            case 'registered':
                if (e.regid.length > 0)
                {
                   // registrarDispositivo(e.regid, 'android');
                   var jqxhr = $.ajax({
                        method: "POST",
                        url: "http://104.131.60.162/index.php/REST/saveID",
                        dataType: "json",
                        data: {'id':e.regid},
                        crossDomain: true,
                        success: function (objJSON) {
                            alert('exito ajax');
                        },
                        error: function (jqXHR, textStatus, errorThrown) {
                            alert('exito ajax');
                        }
                    });
                    alert('ANDROID ID: '+e.regid);
                    console.log('ANDROID ID: '+e.regid);    
                }
                break;
            case 'message':
                try{
                    var status = e.payload.status;
                    alert('Estatus: '+status);
                    alert(JSON.stringify(e));
                    switch (status) {
                        case '200':
                            alert(e.message);
                            GPS.pin.destino.setPosition(GPS.taxis[0].latlng);
                            GPS.calcularRuta();
                        break;
                        case '404':
                            alert(e.message);
                            GPS.taxis.shift();
                            if (GPS.taxis.length) {
                              GPS.pedirTaxi(GPS.taxis[0]);  
                            }else{
                                alert('NO HAY TAXIS DISPONIBLES');
                            }
                        break;
                        case '500':
                            alert(e.message);
                            setTimeout(function(){ GPS.pedirTaxi(GPS.taxis[0]); }, 3000);
                        break;
                        default:
                            alert('no hay respuesta');
                        break;
                    }
                    console.log(e.message);
                }catch(err){
                    alert(err);
                }
                break;
            case 'error':
            default:
                break;
        }
    },
    tokenHandler: function (msg) {
        //registrarDispositivo(msg, 'ios');
    },
    successHandler: function (result) {
        console.log(result);
    },
    errorHandler: function (error) {
        console.log(error);
    },
    registrarDispositivo: function(id,plataforma){
        var jqxhr = $.ajax({
            method: "POST",
            url: "http://104.131.60.162/index.php/REST/saveID",
            dataType: "json",
            data: {'id':id,'plataforma':plataforma},
            crossDomain: true,
            success: function (objJSON) {
                alert('exito ajax');
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert('exito ajax');
            }
        });
    },
    pedirTaxi: function(taxi){
        var OlatLng = GPS.pin.origen.getPosition();
        var DlatLng = GPS.pin.destino.getPosition();
        var datos = {
            'taxiId': taxi.id,
            'ubicacionTaxi': JSON.stringify(taxi.latlng),
            'latlngOrigen':JSON.stringify(OlatLng),
            'direccionOrigen':GPS.pin.origen.address,
            'latlngDestino':JSON.stringify(DlatLng),
            'direccionDestino':GPS.pin.destino.address   
        };
        alert(JSON.stringify(datos));
        console.log(datos);
        var jqxhr = $.ajax({
            method: "POST",
            url: "http://104.131.60.162/index.php/REST/requestTaxi",
            dataType: "text",
            data: datos,
            crossDomain: true,
            success: function (objJSON) {
                alert('exito pedirTaxi');
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert('error pedir taxi: '+errorThrown);
            }
        });
    },
    checkConnection: function(){
        var networkState = navigator.connection.type;
         if ( networkState === Connection.NONE  ) {
            alert("No hay conexion");
         }
    },
    taxiInterval: null,
    buscaTaxistaCercano : function(rutas){
        
        GPS.taxis = [];
        //var origen = GPS.pin.origen.getPosition();
        var origen = new google.maps.LatLng(21.101827, -101.673808);
        for (var r in rutas) {
            destino = new google.maps.LatLng(rutas[r].lat,rutas[r].long);
            //console.log(destino);
            rutas[r].distancia = google.maps.geometry.spherical.computeDistanceBetween(origen,destino);
            rutas[r].latlng = destino;
            //console.log(rutas[r].distancia);
        }
        rutas.sort(GPS.comparaDistanciaTaxis);
        GPS.taxis = rutas;
        alert(JSON.stringify(GPS.taxis[0]));
        GPS.pedirTaxi(GPS.taxis[0]);
        /*
        GPS.taxiInterval = setInterval(function(){
            console.log('intervalo');
            if (GPS.taxis.length) {
               var top = GPS.taxis.shift();
               console.log('taxi: '+top.id);
            }else{
                console.log('NINGUN TAXI CONTESTO');
                clearInterval(GPS.taxiInterval);
            }
            
        },3000);
        */
    },
    comparaDistanciaTaxis: function (a,b) {
        if (a.distancia < b.distancia)
          return -1;
        if (a.distancia > b.distancia)
          return 1;
        return 0;
    }
}

/* Funciones para simular evento click al mantener presionado sobre el mapa */


/*
 *  Genera el evento para detectar si se manteien presionado sobre el mapa
 *  @param google.maps.Map map Mapa al que se le añadirá el evento
 *  @param int length tiempo en milisegundos que se requerirá mantener presionado
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
;

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

