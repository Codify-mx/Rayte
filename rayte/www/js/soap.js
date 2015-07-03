var soap = {
    login: function (user, pass, fn, error) {
        soap.core('login',
                {
                    usuario: user,
                    password: pass
                }, fn, error);
    },
    usuario: {
        registrar: function(user,email,pass,fn,error){
            soap.core('registarUsuario',
                    {
                        usuario: user,
                        correo: email,
                        password: pass
                    },fn,error);
        },
        editarProfile: function(data,fn,error){
            data.id_usuario = localStorage.login;
             soap.core('editarPerfil',
                    data,fn,error);
        },
        resetEmail: function(email,fn,error){
            soap.core('resetEmail',
                    {
                        id_usuario:localStorage.login,
                        correo: email
                    },fn,error);
        }
    },
    pago: {
        eliminaTarjeta: function(id,fn,error){
            soap.core('eliminaTarjeta',
                    {
                        id_usuario:localStorage.login,
                        id_tarjeta: id
                    },fn,error);
        },
        agregaTarjeta: function(data,fn,error){
            data.id_usuario = localStorage.login;
            soap.core('agregaTarjeta',data,fn,error);
        },
        getTarjetas: function(fn,error){
            soap.core('getTarjetas',
                    {
                        id_usuario:localStorage.login
                    },fn,error);
        },
        saveMetodo: function(id,fn,error){
            soap.core('saveMetodoPago',
                    {
                        id_usuario:localStorage.login,
                        id_metodo: id
                    },fn,error);
        }
    },
    contacto:{
        addComment:function(comment,fn,error){
            soap.core('addComment',
                    {
                        id_usuario:localStorage.login,
                        comentario: comment
                    },fn,error);
        }
    },
    historial:{
        getHistorial:function(fn,error){
            soap.core('getHistorial',
                    {
                        id_usuario:localStorage.login
                    },fn,error);
        }
    },
    historial:{
        getHistorial:function(fn,error){
            soap.core('sentRate ',
                    {
                        id_usuario:localStorage.login
                        
                    },fn,error);
        }
    },
    core: function (op, data, fn, error, tipo) {
        console.log(op);
        console.log(data);
        if (rayte.checkConnection()) {
            $.ajax({
                url: 'http://104.131.60.162/index.php/REST/' + op,
                type: 'POST',
                dataType: tipo || 'json',
                data: data,
                complete: function (data) {
                    if (typeof tipo === 'undefined')
                    {
                        fn(JSON.parse(data.response));
                    }
                    else
                    {
                        fn(data.response);
                    }
                },
                error: function (data) {
                    console.log(data);
                    error(data);
                }
            });
        }else{
            swal({
                title: "Error de conexión",
                text: "No se detecto una conexión a internet",
                type: "error",
                confirmButtonText: "Aceptar"
            });
        }
    }
};