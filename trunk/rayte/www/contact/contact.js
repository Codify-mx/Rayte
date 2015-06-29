app.onPageInit('contact', function (page) {
    console.log('Contact page initialized');
    console.log(page);
    $$('#llama-operadora').on('touchstart',function(){
        window.open('tel:4773937010', '_system');
    });
});