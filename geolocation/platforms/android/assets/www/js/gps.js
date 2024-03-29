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
        GPS.imprimeArreglo();
        GPS.dibujaRecorrido();
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
    },
    /*
     *  Inicia el servicio de rastreo
     */
    startWatch: function () {
        GPS.agregaMensaje('start watch');
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
        document.getElementById("position").appendChild(node);
    },
    /*
     *  Obtiene la posición geografica (latlng) mediante una direcion (Calle numero colonia)
     *  genera un pin nuevo en la posición
     */
    codeAddress: function () {
        GPS.agregaMensaje("Buscando");
        var address = document.getElementById("address").value;
        GPS.geocoder.geocode({'address': address}, function (results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                GPS.agregaMensaje("Encontrado");
                GPS.mapa.setCenter(results[0].geometry.location);
                GPS.pinDestino = new google.maps.Marker({
                    map: GPS.mapa,
                    position: results[0].geometry.location
                });
                GPS.calcularRuta();
            } else {
                GPS.agregaMensaje("Geocode was not successful for the following reason: " + status);
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
        GPS.directionsService.route(request, function (result, status) {
            if (status == google.maps.DirectionsStatus.OK) {
                var index = GPS.calulaRutaCorta(result.routes);
                GPS.getPolyline(result.routes[GPS.calulaRutaCorta(result.routes)]);
                GPS.directionsDisplay.setDirections(result);
                GPS.directionsDisplay.setRouteIndex(index);
                GPS.routePolyline = GPS.getPolyline(result.routes[index]);
                GPS.inRoute(origen,GPS.routePolyline);
            } else {
                GPS.agregaMensaje("direction false");
            }
        });
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
    imprimeArreglo: function(){
        GPS.agregaMensaje('Imprime array: '+GPS.latlng.length);
        for (var x in GPS.latlng) {
            console.log(GPS.latlng[x]);
        }
    },
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
        GPS.pinOrigen.setMap(null);
    },
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
    inRoute : function(myPosition,polyline){
        if (google.maps.geometry.poly.isLocationOnEdge(myPosition, polyline)) {
            GPS.agregaMensaje('Estoy en la ruta');
        }else{
            GPS.agregaMensaje('No estoy en la ruta');
        }
    }
}


