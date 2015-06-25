

var TAXI = {
    updatePosition: function () {

    },
    login: function (id) {
        require('js/soap.js', function () {
            soap.login(id, function (data) {
                if (data.correcto)
                {

                }
                else
                {
                    swal({
                        title: "Error ruta taxi!",
                        text: "Error al calcular la ruta del taxi",
                        type: "error",
                        confirmButtonText: "Aceptar"
                    });
                }
            });
        });
    },
    id: -1,
    appId: ''

};