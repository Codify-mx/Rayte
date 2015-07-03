app.onPageInit('contact', function (page) {
    console.log('contact');
    $$('#llama-operadora').on('touchstart',function(){
       GPS.llamarOperadora();
    });
    $$('#contact-send').on('touchstart',function(){
       contact.agregaComentario();
    });
});

var contact = {
    agregaComentario: function(){
        if (!$$.trim($$('#contact-coment').val()) ) {
            rayte.swalError('Escribe un comentario');
        }else{
            rayte.swalPreloader('Espere...');
            var comentario = $$('#contact-coment').val().trim();
            soap.contacto.addComment(comentario, function (data) {
                if (parseInt(data.status) == 200){
                    swal({
                        title: "Guardados los cambios",
                        text: 'Se ha guardado los cambios con éxito',
                        type: "succes",
                        confirmButtonText: "Aceptar"
                    });
                }else{
                    rayte.swalError('Error al guardar los cambios');
                }
            },function(){
                   rayte.swalError('Error al guardar los cambios');
            });
        }
        
    }
};