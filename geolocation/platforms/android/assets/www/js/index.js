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
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },

    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    onDeviceReady: function() {
        //app.receivedEvent('deviceready');
         navigator.geolocation.getCurrentPosition(app.onSuccess, app.onError);
        //v//ar options = { frequency: 3000 };
//this.watchID = navigator.geolocation.watchPosition(onSuccessWatch, onError, options);
    },
    onSuccessWatch: function(position){ console.log('waddaup' );},
    onSuccess: function(position){ console.log('lat: '+ position.coords.latitude +' lng: ' +position.coords.longitude );},
    onError: function(error){ console.log('error: '+ error.message );},
    watchID: 0
};


