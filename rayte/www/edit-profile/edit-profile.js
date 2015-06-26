(function(){
console.log('edit profile');
})();

$$(document).on('touchstart','#edit-profile-forgot', function(e){
     mainView.router.loadPage('./edit-profile/reset-pass.html');
});