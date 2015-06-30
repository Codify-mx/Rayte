app.onPageInit('contact', function (page) {
    console.log('Contact page initialized');
    console.log(page);
    $$('#llama-operadora').on('touchstart',function(){
       GPS.llamarOperadora();
    });
});