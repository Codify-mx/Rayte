var GPS ={
    /*
     *  Mapa a utilizar
     */
    mapa: null,
    /*
     *  Id del servicio "watchPosition" necesario para poder detenerlo
     */
    watchID: 0,
    /*
     *  Marcador del usuario en el mapa
     */
    pin: null,
    /*
     *  arreglo de coordenadas del usuario
     */
    latlng : [],
     /*
      * Funcion que inicia el objeto
      */
    initialize : function() {
        console.log('deviceready');
        this.bindEvents();
    },
    /*
     *  agrega el evento "deviceready" para poder llamar los plugins del celular (geolocation) de manera segura
     */
   bindEvents : function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    /*
     *  Cancela el servicio "watchPosition", cambia evento en el boton "fetch" para poder iniciarlo de nuevo
     */
    cancelWatch: function(){
        navigator.geolocation.clearWatch(GPS.watchID );
        GPS.agregaMensaje('terminado');
        $('#fetch').html('Iniciar');
        $('#fetch').unbind( "click" );
        $('#fetch').click(function(){
            GPS.startWatch();
        });
    },
    /*
     *  Obtiene la posición actual del dispositivo
     */
    centrarMapa: function(){
        GPS.agregaMensaje('Loading...');
        navigator.geolocation.getCurrentPosition(GPS.onSuccessCenter, GPS.onError);
    },
    /*
     *  Centra el mapa en la posicion del dispositivo y cambia la posición del pin
     *  @param Object position Objeto de posición generado por el servicio getCurrentPosition o watchPosition
     */
    onSuccessCenter : function(position){
          GPS.agregaMensaje('SUCCESS: Lat: '+position.coords.latitude+' Lng: '+position.coords.longitude);
          var myLatlng = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
          GPS.mapa.setCenter(myLatlng);
          GPS.mapa.panTo(myLatlng);
          GPS.mapa.setZoom(16);
          GPS.pin.setPosition(myLatlng);
    },
    /*
     * Se llama al estar listo el dispositivo, centra el mapa en la posicion y agrega evento para poder inciciar el servicio de rastreo
     */
    onDeviceReady: function(){
        GPS.agregaMensaje('Listo');
        GPS.centrarMapa();
        GPS.agregaMensaje('Si watch');
        $('#fetch').html('Iniciar');
        $('#fetch').unbind( "click" );
        $('#fetch').click(function(){
            GPS.startWatch();
        });
    },
    /*
     *  Inicia el servicio de rastreo
     */
    startWatch: function(){
        GPS.agregaMensaje('start watch');
        var options = {enableHighAccuracy: true};
        this.watchID = navigator.geolocation.watchPosition(GPS.onSuccess,GPS.onError,options);
        $('#fetch').html('Cancelar');
        $('#fetch').unbind( "click" );
        $('#fetch').click(function(){
            GPS.cancelWatch();
        });
    },
    /*
     *  Manda un mensaje en caso de no poder obtener la posición
     */
    onError : function(error){
       GPS.agregaMensaje(error);
    },
    /*
     *  Guarda la posicíon obtenida en un arreglo e imprime la posicion en pantalla
     *  @param Object position Objeto de posición generado por el servicio getCurrentPosition o watchPosition
     */
    onSuccess : function(position){
        GPS.agregaMensaje('Lat: '+position.coords.latitude+' Lng: '+position.coords.longitude);
        GPS.latlng.push(position);
    },
    /*
     *  Envia mensaje a pantalla
     *  @oaram String mensaje Mensaje a enviar a pantalla
     */
    agregaMensaje: function (mensaje){
        var node = document.createElement("LI");                
        var textnode = document.createTextNode(mensaje);        
        node.appendChild(textnode);
        document.getElementById("position").appendChild(node);
    }
}

    
