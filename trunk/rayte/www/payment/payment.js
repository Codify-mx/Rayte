app.onPageInit('payment', function (page) {
     require('js/soap.js', function () {
          console.log('load soap');
         payment.getCard();
});

app.onPageInit('reset-pass',function(page){
     $$(document).on('touchstart','#payment-add-save', function(e){
          e.preventDefault();
          profile.resetPassword();
     });
});

var profile = {
     addCard: function(){
            rayte.swalPreloader('Guardando...');
            if (!rayte.validaForm('frm-payment-add')){
                var datos = {
                     numero: $$('edit-profile-nombre').val().trim(),
                     nomber: $$('edit-profile-apellido').val().trim(),
                     expira: $$('edit-profile-tel').val().trim(),
                     codigo: $$('edit-profile-tel').val().trim(),
                     zip: $$('edit-profile-tel').val().trim()
                };
                this.updateProfile(datos);
            }else{
                swal({
                    title: "Error !",
                    text: 'Los campos Nombre, apellido y teléfono no deben de estár vacíos',
                    type: "error",
                    confirmButtonText: "Aceptar"
                });
            }
     },
     compruebaPass: function(){
          var nueva = $$("#edit-profile-new").val().trim();
          var repeat = $$("#edit-profile-repeat").val().trim();
          if (nueva != repeat) {
               return false;
          }
          return true;
     },
     updateProfile: function(datos){
          soap.usuario.editarProfile(datos, function (data) {
               if (parseInt(data.id_usuario) != -1){
                   swal.close();
                   app.ls.login = 1;
                   app.ls.login = data.nombre;
                   app.ls.login = data.apellido;
                   app.ls.tel = data.telefono;
               }else{
                   swal({
                       title: "Error !",
                       text: 'Ocurrio un error al actualizar la información',
                       type: "error",
                       confirmButtonText: "Aceptar"
                   });
               }
           },function(){
               console.log('error edit');
                 swal({
                       title: "Error !",
                       text: 'Ocurrio un error al actualizar la información',
                       type: "error",
                       confirmButtonText: "Aceptar"
                 });
           });
     },
     resetPassword: function(){
          rayte.swalPreloader('Espere...');
           var email = $$('#payment-add-save').val().trim();
           soap.usuario.resetEmail(email, function (data) {
               if (parseInt(data.id_usuario) != -1){
                   swal.close();
                   app.ls.login = 1;
                    swal({
                       title: "Se cambio la contraseña",
                       text: 'Se ha enviado un correo a su cuenta con su contraseña',
                       type: "succes",
                       confirmButtonText: "Aceptar"
                   });
               }else{
                   swal({
                       title: "Error !",
                       text: 'Ocurrio un error al enviar el correo',
                       type: "error",
                       confirmButtonText: "Aceptar"
                   });
               }
           },function(){
               console.log('error edit');
                 swal({
                       title: "Error !",
                       text: 'Ocurrio un error al enviar el correo',
                       type: "error",
                       confirmButtonText: "Aceptar"
                 });
           });
     }
}