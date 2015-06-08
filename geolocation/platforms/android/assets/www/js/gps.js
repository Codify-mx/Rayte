var GPS ={
    watchID: 0,
    getPosition : getPosition,
    onSuccess : onSuccess,
    onError : onError,
    initialize : function() {
        console.log('deviceready');
        this.bindEvents();
    },
   bindEvents : function() {
        document.addEventListener('deviceready', onDeviceReady, false);
    },
    cancelWatch: function(){
        console.log(GPS.watchID );
        navigator.geolocation.clearWatch(GPS.watchID );
        agregaMensaje('terminado');
    },
    centerMap: function(){
       navigator.geolocation.getCurrentPosition(GPS.onSuccessCenter, GPS.onErrorCenter);
    },
    onSuccess : function(){
          agregaMensaje('Lat: '+position.coords.latitude+' Lng: '+position.coords.longitude);
          var myLatlng = new google.maps.latlng(position.coords.latitude,position.coords.longitude);
          var myOptions = {
                center: myLatlng,
                zoom: 16,
                mapTypeId: google.maps.mapTypeId.ROADMAP
            };
            var map = new google.maps.Map(document.getElementById('mapCanvas'), mapOptions);
            
        },
    onErrorCenter : onError
}
    
    function onDeviceReady() {
        agregaMensaje('Listo');
        //document.getElementById('fetch').onclick = GPS.getPosition();
        GPS.watchID = navigator.geolocation.watchPosition(GPS.onSuccess,GPS.onError);
        console.log(GPS.watchID );
    }
    function getPosition() {
        //navigator.geolocation.getCurrentPosition(GPS.onSuccess, GPS.onError);
       
        console.log('deviceready');
    }
    
    function onSuccess(position) {
        agregaMensaje('Lat: '+position.coords.latitude+' Lng: '+position.coords.longitude);
    }
    function onError(error) {
       agregaMensaje(error);
    }
    var latlng =[];
    function agregaMensaje(mensaje){
        console.log(mensaje);
        var node = document.createElement("LI");                 // Create a <li> node
        var textnode = document.createTextNode(mensaje);         // Create a text node
        
        node.appendChild(textnode);
        latlng.push(node);// Append the text to <li>
        document.getElementById("position").appendChild(node);
        
    }