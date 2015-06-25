var soap = {
    login: function (id, fn) {
        soap.core('loginTaxista', {
            id: id
        }, fn);
    },
    core: function (op, data, fn, error, tipo) {
        $.ajax({
            url: 'http://104.131.60.162/index.php/REST/' + op,
            type: 'POST',
            dataType: tipo || 'json',
            data: data,
            complete: function (data) {
                if (typeof tipo === 'undefined')
                {
                    fn(JSON.parse(data.response));
                }
                else
                {
                    fn(data.response);
                }
            },
            error: function (data) {
                console.log(data)
            }
        });
    }
};