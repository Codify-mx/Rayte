/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var rayte = {
    onDeviceReady: function() {
        console.log('device ready');
        
        require('js/app.js', function () {
            //document.addEventListener("backbutton", rayte.onBackKeyDown, false);
            $$(document).on('backbutton',rayte.onBackKeyDown);
            require('js/sweetalert.min.js',function(){
                
                if (parseInt(localStorage.login) === 1 ) {
                    $(".view-login").hide();
                    $(".view-main").show();
                    require('js/gps.js', function () {
                        console.log('require GPS');
                        GPS.iniciaMapa();
                    });
                    app.allowPanelOpen = true;
                }else{
                    $$('.botones').slideDown();
                }
                swal.setDefaults({ animation: false });
                if(!rayte.checkConnection()){
                    swal({
                        title: "Error de Conexión!",
                        text: "No existe conexión de internet",
                        type: "error",
                        confirmButtonText: "Aceptar"
                    }); 
                }else{
                   /* swal({
                        title: "Conexión establecida",
                        text: "Si hay conexión con el servidor",
                        type: "success",
                        confirmButtonText: "Aceptar"
                    });
                    */
                    
                }
            }); 
        });     
    },
    checkConnection: function () {
        try{
             var networkState = navigator.connection.type;
            if (networkState === Connection.NONE) {
               return false;
            }
            return true;
        }catch(err){
           return true; 
        }
       
    },
    swalPreloader: function (message) {
        swal({
            title: "Espere porfavor",
            text: message,
            type: "info",
            showConfirmButton: false,
            showCancelButton: false
        });
    },
    swalError: function(message){
        swal({
            title: "¡ Ocurrió un error !",
            text: message,
            type: "error",
            confirmButtonText: "Aceptar"
        });
    },
    validaForm: function(form,excepto){
        if(!$$.isArray(excepto)){
            excepto = [excepto];
        }
        console.log(excepto);
        var err = false;
        $$('#'+form+' :input:not(:button)').each(function(){
            if($$.inArray($$(this).attr('id'),excepto)){
                if (!$$.trim($$(this).val()) ) {
                    console.log($$(this).attr('id'));
                    $$(this).removeClass('has-success').addClass('has-error');
                    err = true;
                }else{
                    $$(this).removeClass('has-error').addClass('has-success');
                }
            }
        });
        return err;
    },
    resetForm: function(form){
        $$('#'+form+' :input:not(:button)').val('').removeClass('has-error has-success');
    },
    onBackKeyDown: function(){
        //alert('atras');
       mainView.router.back();
    }
};




