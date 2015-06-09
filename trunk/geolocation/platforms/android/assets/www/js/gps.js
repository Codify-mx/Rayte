
function GPS(){
    this.map;
    this.watchId = 0;
    
    this.initialize = function(){
        console.log('initialize');
        this.bindEvents();
    };
    this.bindEvents = function(){
        console.log('bindEvents');
        document.addEventListener('deviceready',this.onDeviceReady, false);
    };
    this.cancelWatch = function(){
        console.log(this.watchID );
        navigator.geolocation.clearWatch(this.watchID );
        this.agregaMensaje('terminado');
    };
    this.centrarMapa = function(){
        console.log('centrar');
        navigator.geolocation.getCurrentPosition(this.onSuccessCenter, this.onError);
    };
    this.onSuccessCenter = function(position){
        this.gregaMensaje('Lat: '+position.coords.latitude+' Lng: '+position.coords.longitude);
        var myLatlng = new google.maps.latlng(position.coords.latitude,position.coords.longitude);
        map.setCenter(myLatlng);
        map.setZoom(11); 
    };
    
    this.onDeviceReady = function() {
        this.agregaMensaje('Listo');
        //document.getElementById('fetch').onclick = GPS.getPosition();
        this.watchID = navigator.geolocation.watchPosition(this.onSuccess,this.onError);
        console.log(this.watchID );
    }
    
    this.onSuccess = function(position) {
        this.agregaMensaje('Lat: '+position.coords.latitude+' Lng: '+position.coords.longitude);
    }
    this.onError =function (error) {
       this.agregaMensaje(error);
    }
    
    var latlng =[];
    this.agregaMensaje = function (mensaje){
        console.log(mensaje);
        var node = document.createElement("LI");                 // Create a <li> node
        var textnode = document.createTextNode(mensaje);         // Create a text node
        node.appendChild(textnode);
        latlng.push(node);// Append the text to <li>
        document.getElementById("position").appendChild(node);
    }
    
    
}

var gps = new GPS();
/*
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
        console.log('centrar');
        navigator.geolocation.getCurrentPosition(GPS.onSuccessCenter, GPS.onError);
    },
    onSuccessCenter : function(position){
          agregaMensaje('Lat: '+position.coords.latitude+' Lng: '+position.coords.longitude);
          var myLatlng = new google.maps.latlng(position.coords.latitude,position.coords.longitude);
          map.setCenter(myLatlng);
          map.setZoom(11);
            
        }
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
*/