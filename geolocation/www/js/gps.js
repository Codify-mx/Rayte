var GPS = {
    /*
     *  Mapa a utilizar
     */
    mapa: null,
    /*
     *  Geocoder utilizado para encontrar latlng mediante direcciones (calle,numero,colonia)
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
     *  Id del servicio "watchPosition" necesario para poder detenerlo
     */
    polyline: null,
    /*
     *  Id del servicio "watchPosition" necesario para poder detenerlo
     */
    routePolyline: null,
    /*
     *  Id del servicio "watchPosition" necesario para poder detenerlo
     */
    polylineLive: null,
    /*
     *  Geocoder utilizado para encontrar latlng mediante direcciones (calle,numero,colonia)
     */
    watchID: 0,
    /*
     *  Marcador del usuario en el mapa
     */
    pinOrigen: null,
    /*
     *  Marcador del destino en el mapa
     */
    pinDestino: null,
    /*
     *  arreglo de coordenadas del usuario
     */
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
    longPress :  null,
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
        var myLatlng = new google.maps.LatLng( position.coords.latitude, position.coords.longitude);
        GPS.mapa.setCenter(myLatlng);
        GPS.mapa.panTo(myLatlng);
        GPS.mapa.setZoom(16);
        GPS.pinOrigen.setPosition(myLatlng);
    },
    /*
     * Se llama al estar listo el dispositivo, centra el mapa en la posicion y agrega evento para poder inciciar el servicio de rastreo
     */
    onDeviceReady: function () {
        GPS.agregaMensaje('Listo');
        GPS.centrarMapa();
        GPS.agregaMensaje('Si watch');
        $('#fetch').html('Iniciar');
        $('#fetch').unbind("click");
        $('#fetch').click(function () {
            GPS.startWatch();
        });
       

       // $( "body" ).bind( "taphold", GPS.menuPresionado );
        
    },
    /*
     *  Inicia el servicio de rastreo
     */
    startWatch: function () {
        GPS.agregaMensaje('start watch');
        GPS.polylineLive.setPath([]);
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
        var myLatLng = new google.maps.LatLng( position.coords.latitude, position.coords.longitude);
        GPS.latlng.push(myLatLng);
        if (GPS.routePolyline) {
            GPS.inRoute(myLatLng,GPS.routePolyline);
        }
        GPS.agregaMensaje('Recorrido live');
        GPS.dibujaRecorridoLive(myLatLng);
        GPS.pinOringen.setPosition(myLatLng);
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
    codeLatLng: function () {
        var latlng = GPS.pinDestino.getPosition();
        GPS.geocoder.geocode({'latLng': latlng}, function(results, status) {
          if (status == google.maps.GeocoderStatus.OK) {
            console.log(results);
            alert(results[0].formatted_address);
            /*
            if (results[1]) {
              map.setZoom(11);
              marker = new google.maps.Marker({
                  position: latlng,
                  map: map
              });
              
              //infowindow.setContent(results[1].formatted_address);
              //infowindow.open(map, marker);
            } else {
              alert('No results found');
            }*/
          } else {
            alert('Geocoder failed due to: ' + status);
          }
        });
    },
    
    /*
     *  Calcula la ruta mas corta entre dos puntos y la muestra en el mapa
     */
    calcularRuta: function () {
        GPS.agregaMensaje("Calcular ruta");
        var origen = GPS.pinOrigen.getPosition();
        var destino = GPS.pinDestino.getPosition();
        GPS.agregaMensaje('Origen: ' + origen);
        GPS.agregaMensaje('Destino: ' + destino);
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
    imprimeArreglo: function(){
        GPS.agregaMensaje('Imprime array: '+GPS.latlng.length);
        for (var x in GPS.latlng) {
            console.log(GPS.latlng[x]);
        }
    },
    /*
     *  Dibuja la ruta recorrida en tiempo real, mueve el mapa y el pin a la nueva posición
     *  @param LatLng latlng latitud y longitud nuevos
     */
    dibujaRecorridoLive: function(latlng){
            GPS.polylineLive.getPath().push(latlng);
            GPS.pinOrigen.setPosition(latlng);
            GPS.mapa.panTo(latlng);
            GPS.agregaMensaje('Dibujado live: '+latlng);
    },
    /*
     *  @deprecated
     *  Dibuja el camino recorrido en base al arreglo total de posiciones ( no tiempo real )
     */
    dibujaRecorrido: function(){
        GPS.agregaMensaje('Dibuja Recorrido');
        GPS.polyline = new google.maps.Polyline({
            map: GPS.mapa,
            strokeColor: '#FF0000',
            strokeOpacity: 0.7,
            strokeWeight: 5,
            visible: true,
            zIndex: 1,
            path:GPS.latlng
        });
    },
    /*
     *  Obtiene el polyline usado para comprobar si se recorre la ruta en base a la ruta obtenida
     *  @oaram route route ruta a obtener el polyline
     */
    getPolyline: function(route){
       var polyline = new google.maps.Polyline({
					path: [],
					strokeColor: '#FF0000',
					strokeWeight: 3
				});
        var path = route.overview_path;
        var legs = route.legs;
        for (i=0;i<legs.length;i++) {
           var steps = legs[i].steps;
           for (j=0;j<steps.length;j++) {
             var nextSegment = steps[j].path;
             for (k=0;k<nextSegment.length;k++) {
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
    inRoute : function(myPosition,polyline){
         console.log(google.maps.geometry.poly.isLocationOnEdge(myPosition, polyline,Math.pow(10,-2)));
        if (google.maps.geometry.poly.isLocationOnEdge(myPosition, polyline,Math.pow(10,-3))) {
            GPS.agregaMensaje('Estoy en la ruta');
        }else{
            GPS.agregaMensaje('No estoy en la ruta');
        }
    },
    getTaxi: function(){
        var jqxhr  = $.ajax({
            method: "GET",
            url: "http://104.131.60.162/index.php/REST/getTaxisLocation",
            dataType: "json",
            crossDomain : true,
            success: function(objJSON){
                console.log(objJSON);
                var lat = new google.maps.LatLng(objJSON[0],objJSON[1]);
                GPS.mapa.panTo(lat);
                GPS.pinDestino.setPosition(lat);
                GPS.calcularRuta();
            },
            error: function( jqXHR,  textStatus,  errorThrown ){
                console.log(errorThrown);
            }
          });
    },
    irCentro: function(){
        GPS.pinDestino.setPosition(GPS.mapa.getCenter());
        GPS.calcularRuta();
        GPS.codeLatLng();
    },
    menuPresionado : function(latlng){
         navigator.notification.confirm(
            'Ruta hasta aqui?', // message
             function(buttonIndex){
                if (buttonIndex === 1) {
                    GPS.pinDestino.setPosition(new google.maps.LatLng(latlng.lat(),latlng.lng()));
                    GPS.codeLatLng();
                    GPS.calcularRuta();
                }
             },            // callback to invoke with index of button pressed
            'Game Over',           // title
            ['Si','No']         // buttonLabels
        );
    },
    validarRuta: function (result, status) {
                console.log(status);
                
                switch (status) {
                    case google.maps.DirectionsStatus.OK:
                        var index = GPS.calulaRutaCorta(result.routes);
                        GPS.getPolyline(result.routes[GPS.calulaRutaCorta(result.routes)]);
                        GPS.directionsDisplay.setDirections(result);
                        GPS.directionsDisplay.setRouteIndex(index);
                        GPS.routePolyline = GPS.getPolyline(result.routes[index]);
                        GPS.inRoute(origen,GPS.routePolyline);
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
        validarCodeAddress: function (results, status) {
                console.log(status);
                switch (status) {
                    case google.maps.GeocoderStatus.OK:
                        GPS.agregaMensaje("Encontrado");
                        GPS.mapa.setCenter(results[0].geometry.location);
                        GPS.pinDestino.setPosition(results[0].geometry.location);
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
        }
}

/*
 * Funciones para simular evento click al mantener presionado sobre el mapa
 */

function LongPress(map, length) {
  this.length_ = length;
  var me = this;
  me.map_ = map;
  me.timeoutId_ = null;
  google.maps.event.addListener(map, 'mousedown', function(e) {
    me.onMouseDown_(e);
  });
  google.maps.event.addListener(map, 'mouseup', function(e) {
    me.onMouseUp_(e);
  });
  google.maps.event.addListener(map, 'drag', function(e) {
    me.onMapDrag_(e);
  });
};
LongPress.prototype.onMouseUp_ = function(e) {
  clearTimeout(this.timeoutId_);
};
LongPress.prototype.onMouseDown_ = function(e) {
  clearTimeout(this.timeoutId_);
  var map = this.map_;
  var event = e;
  this.timeoutId_ = setTimeout(function() {
    google.maps.event.trigger(map, 'longpress', event);
  }, this.length_);
};
LongPress.prototype.onMapDrag_ = function(e) {
  clearTimeout(this.timeoutId_);
};

