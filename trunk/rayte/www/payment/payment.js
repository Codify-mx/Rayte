app.onPageInit('payment', function (page) {
     require('js/soap.js', function () {
          console.log('load soap');
        // payment.getCard();
     });
});

app.onPageInit('reset-pass',function(page){
     $$(document).on('touchstart','#payment-add-save', function(e){
          e.preventDefault();
          profile.resetPassword();
     });
});

var payment = {
     newCard: function(){
          rayte.swalPreloader('Guardando...');
          if (!rayte.validaForm('frm-payment-add')){
              var datos = {
                   numero: $$('edit-profile-nombre').val().trim(),
                   nombre: $$('edit-profile-apellido').val().trim(),
                   expira: $$('edit-profile-tel').val().trim(),
                   codigo: $$('edit-profile-tel').val().trim(),
                   zip: $$('edit-profile-tel').val().trim()
              };
              
               soap.pago.agregaTarjeta(datos, function (data) {
                    if (parseInt(data.status) == 200){
                         payment.addCard(data.id,data.nombre,data.numero);
                    }else{
                        swal({
                            title: "Error !",
                            text: 'Ocurrio un error al agregar la tarjeta',
                            type: "error",
                            confirmButtonText: "Aceptar"
                        });
                    }
               },function(){
                    console.log('error delete card');
                    swal({
                          title: "Error !",
                          text: 'Ocurrio un error al eliminar la tarjeta',
                          type: "error",
                          confirmButtonText: "Aceptar"
                      });
               });
          }else{
              swal({
                  title: "Error !",
                  text: 'Los campos Nombre, apellido y teléfono no deben de estár vacíos',
                  type: "error",
                  confirmButtonText: "Aceptar"
              });
          }
     },
     addCard: function(id,nombre,numero){
          var li = '<li class="row" id="card-'+id+'">';
               li+='<div class="col-xs-8 payment-info-card">';
               li+='<div class="col-xs-12">'+nombre+'</div>';
               li+='<div class="col-xs-12">'+numero+'</div>';
               li+='</div>';
               li+='<div class="col-xs-4 payment-delete-card">';
               li+='<a>Eliminar</a>';
               li+='</div>';
               li+='</li>';
          $$('#card-container').append(li);
          $$('.amount').html('('+$$('li[id^=card-]').length+')');
     },
     deleteCard: function(id){
          soap.pago.eliminaTarjeta(id, function (data) {
               if (parseInt(data.status) == 200){
                   $$('#card-'+id).remove();
                   $$('.amount').html('('+$$('li[id^=card-]').length+')');
               }else{
                   swal({
                       title: "Error !",
                       text: 'Ocurrio un error al eliminar la tarjeta',
                       type: "error",
                       confirmButtonText: "Aceptar"
                   });
               }
          },function(){
               console.log('error delete card');
               swal({
                     title: "Error !",
                     text: 'Ocurrio un error al eliminar la tarjeta',
                     type: "error",
                     confirmButtonText: "Aceptar"
                 });
          });
     },
     getCard: function(){
          soap.pago.getTarjetas( function (data) {
               if (parseInt(data.status) == 200){
                   for(var x in data.tarjetas){
                         var card = data.tarjetas[x];
                         payment.addCard(card.id, card.nombre,card.numero);
                   }
               }else{
                   swal({
                       title: "Error !",
                       text: 'Ocurrio un error al eliminar la tarjeta',
                       type: "error",
                       confirmButtonText: "Aceptar"
                   });
               }
          },function(){
               console.log('error delete card');
               swal({
                     title: "Error !",
                     text: 'Ocurrio un error al eliminar la tarjeta',
                     type: "error",
                     confirmButtonText: "Aceptar"
                 });
          });
     }
};