app.onPageInit('edit-profile', function (page) {
     require('js/soap.js', function () {
          console.log('load soap');
          $$(document).off('touchstart','#edit-profile-forgot').on('touchstart','#edit-profile-forgot', function(e){
               mainView.router.loadPage('./edit-profile/reset-pass.html');
          });
          
          $$(document).off('touchstart','#edit-profile-save').on('touchstart','#edit-profile-save', function(e){
               e.preventDefault();
               profile.save();
          });
          
          $$('#edit-profile-nombre').val($$.trim(localStorage.nombre));
          $$('#edit-profile-apellido').val($$.trim(localStorage.apellido));
          $$('#edit-profile-tel').val($$.trim(localStorage.telefono));
          
          $$("#edit-profile-tel").blur(function(){
               $$(this).val(function(i, text) {
                        text = text.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3"); 
                    return text;
               });
          });
        });
});

app.onPageInit('reset-pass',function(page){
     $$(document).on('touchstart','#payment-add-save', function(e){
          e.preventDefault();
          profile.resetPassword();
     });
});

var profile = {
     save: function(){
          //require('js/soap.js', function () {
                    rayte.swalPreloader('Guardando...');
                    var noValidar = ['edit-profile-password','edit-profile-new','edit-profile-repeat'];
                    if (true||!rayte.validaForm('frm-edit-profile',noValidar)){
                         if ($$.trim($$('edit-profile-new').val())) {
                              if (this.compruebaPass()) {
                                   var datos = {
                                        nombre: $$('#edit-profile-nombre').val().trim(),
                                        apellido: $$('#edit-profile-apellido').val().trim(),
                                        tel: $$('#edit-profile-tel').val().trim(),
                                        nuevo: $$('#edit-profile-new').val().trim()
                                   };
                                   this.updateProfile(datos);
                             }else{
                                   swal({
                                        title: "Error !",
                                        text: 'Las contraseñas no coinciden',
                                        type: "error",
                                        confirmButtonText: "Aceptar"
                                    });
                             }
                         }else{
                              var datos = {
                                   nombre: $$('#edit-profile-nombre').val().trim(),
                                   apellido: $$('#edit-profile-apellido').val().trim(),
                                   tel: $$('#edit-profile-tel').val().trim(),
                              };
                              this.updateProfile(datos);
                         }
                    }else{
                        swal({
                            title: "Error !",
                            text: 'Los campos Nombre, apellido y teléfono no deben de estár vacíos',
                            type: "error",
                            confirmButtonText: "Aceptar"
                        });
                    }
       // });
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
               console.log(data);
               if (parseInt(data.status) == 200){
                   swal.close();
                   app.ls.nombre = datos.nombre;
                   app.ls.apellido = datos.apellido;
                   app.ls.telefono = datos.telefono;
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
               if (parseInt(data.status) == 200){
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