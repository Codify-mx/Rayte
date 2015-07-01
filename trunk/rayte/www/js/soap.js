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
             soap.core('editarPerfil',
                    data,fn,error);
        },
        resetEmail: function(email,fn,error){
            soap.core('resetEmail',
                    {
                        correo: email,
                    },fn,error);
        }
    },
    core: function (op, data, fn, error, tipo) {
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
            /*
            return {
                status: 503,
                message: "No se detecto una conexión a internet"
            }
            */
        }
    }
};