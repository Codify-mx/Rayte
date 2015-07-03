var VERSION = 2;

var $ = Framework7.$;

var app = new Framework7({
    animateNavBackIcon: true,
    modalButtonOk: 'Aceptar',
    modalButtonCancel: 'Cancelar'
});

var login = app.addView('.view-login', {
    dynamicNavbar: true,
    domCache: true
});

var mainView = app.addView('.view-main', {
    dynamicNavbar: true,
    domCache: true
});

app.allowPanelOpen = false;


$(document).on('pageInit', function (e) {
    app.closePanel();
});



$("#logout").on('touchstart', function (e) {
    user.logout();
});

$("#frm-login").on('submit', function (e) {
    e.preventDefault();
    user.login();
});

$("#login-boton").on('touchstart', function () {
    app.popup('.popup-login');
});

$("#frm-registro").on('submit', function (e) {
    e.preventDefault();
    user.register();
});

var user = {
    login: function(){
        rayte.swalPreloader('Espere...');
        require('js/soap.js', function () {
         
            var user = $("#usuario").val().trim();
            var pass = $("#password").val().trim();
            if (user !== '' && pass !== ''){
                soap.login(user, pass, function (data) {
                    $("#usuario,#password").val('');
                    if (parseInt(data.status) == 200){
               
                        swal.close();
                        app.ls.login = 1;
                        app.ls.id_usuario = data.id_usuario;
                        app.ls.nombre = data.nombre;
                        app.ls.apellido = data.apellido;
                        
                        $(".view-login").hide();
                        $(".view-main").show();
                        require('js/gps.js', function () {
                            GPS.iniciaMapa();
                        });
                        app.allowPanelOpen = true;
                   
                    }else{
                        app.ls.login = 0;
                        app.ls.version = 0;
                        swal({
                            title: "Erro de login!",
                            text: 'Usuario y/o Password incorrecto',
                            type: "error",
                            confirmButtonText: "Aceptar"
                        });
                    }
                },function(){
                    console.log('error login');
                    swal({
                        title: "Erro de login!",
                        text: 'Ocurrio un error, porfavor intentelo más tarde',
                        type: "error",
                        confirmButtonText: "Aceptar"
                    });
                });       
            }else{
                swal({
                    title: "Erro de login!",
                    text: 'Debe de introducir un usuario y una contraseña',
                    type: "error",
                    confirmButtonText: "Aceptar"
                });
            }
        });
    },
    logout: function(){
        app.ls.clear();
        app.closePanel();
        rayte.swalPreloader('Espere...');
        $(".view-main").hide();
        $(".view-login").show();
        swal.close();
    },
    register: function(){
        require('js/soap.js', function () {
            var user = $("#registro-nombre").val().trim();
            var email = $("#registro-email").val().trim();
            var pass = $("#registro-pass").val().trim();
            if (user !== '' && pass !== ''){
                soap.usuario.registrar(user, pass, function (data) {
                    $("#registro-nombre,#registro-email,#registro-pass").val('');
                    if (parseInt(data.status) == 200){
                        app.hidePreloader();
                        app.ls.login = 1;
                        app.ls.id_usuario = data.id_usuario;
                        $(".view-login").hide();
                        $(".view-main").show();
                        require('js/gps.js', function () {
                            GPS.iniciaMapa();
                        });
                        app.allowPanelOpen = true;
                    }else{
                        app.ls.login = 0;
                        app.ls.version = 0;
                        swal({
                            title: "Error de registro",
                            text: 'Por favor inténtelo más tarde',
                            type: "error",
                            confirmButtonText: "Aceptar"
                        });
                    }
                },function(){
                    console.log('error registro');
                    swal({
                        title: "Error de registro",
                        text: 'Por favor inténtelo más tarde',
                        type: "error",
                        confirmButtonText: "Aceptar"
                    });
                });     
            }else{
                swal({
                    title: "Error de registro",
                    text: 'Todos los datos son necesarios',
                    type: "error",
                    confirmButtonText: "Aceptar"
                });
            }
        });
    }
};

 $$(document).on('touchstart','.back',function(){
        mainView.router.back();
 });

