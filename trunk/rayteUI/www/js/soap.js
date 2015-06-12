var soap = {
    guardarCliente: function (cliente, fn) {
        soap.core('guardarCliente', {
            id_sucursal: localStorage.id_sucursal,
            cliente: cliente
        }, fn);
    },
    editarCliente: function (cliente, fn) {
        soap.core('editarCliente', {
            id_sucursal: localStorage.id_sucursal,
            cliente: cliente
        }, fn);
    },
    productos: {
        lista: function (fn) {
            soap.core('productos',
                    {
                        id_sucursal: localStorage.id_sucursal
                    }, fn);

        }
    },
    clientes: {
        lista: function (fn) {
            soap.core('clientes',
                    {
                        id_sucursal: localStorage.id_sucursal
                    }, fn);
        },
        getInventario: function (id_cliente, fn) {
            soap.core('inventario', {
                id_sucursal: localStorage.id_sucursal,
                id_cliente: id_cliente
            }, fn);
        }
    },
    pedidos: {
        lista: function (fn) {
            soap.core('pedidos',
                    {
                        id_sucursal: localStorage.id_sucursal
                    }, fn);
        },
        guardar: function (pedido, fn) {
            soap.core('guardarPedido', {
                id_sucursal: localStorage.id_sucursal,
                pedido: pedido
            }, fn);
        },
        getDetalle: function (id, fn) {
            soap.core('getDetallePedido', {
                id_sucursal: localStorage.id_sucursal,
                id_pedido: id
            }, fn);
        },
        actualizarPagado: function (id, id_pedido, id_pro, fn) {
            soap.core('actualizarPagado', {
                id_pedido: id_pedido,
                id_producto: id_pro,
                id_cliente: id
            }, fn);
        },
        actualizarDevolucion: function (id, id_pedido, id_pro, fn) {
            soap.core('actualizarDevolucion', {
                id_pedido: id_pedido,
                id_producto: id_pro,
                id_cliente: id
            }, fn);
        },
        quitarProducto: function (id_pro, id_cliente, fn) {
            soap.core('quitarProducto', {
                id_producto: id_pro,
                id_cliente: id_cliente
            }, fn);
        }
    },
    login: function (user, pass, fn, error) {
        soap.core('login',
                {
                    usuario: user,
                    password: pass
                }, fn, error);
    },
    registrarVenta: function (venta, venta_detalle, fn) {
        soap.core('registrarVenta',
                {
                    venta: venta,
                    venta_detalle: venta_detalle
                }, fn);
    },
    core: function (op, data, fn, error, tipo) {
        $.ajax({
            url: 'https://kiwishop.mx/erp/REST/' + op,
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