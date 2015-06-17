var scripts = [];

function require(src, callback)
{

    if (scripts.indexOf(src) === -1)
    {
        var s, r, t;
        r = false;
        s = document.createElement('script');
        s.type = 'text/javascript';
        s.src = src + "?t=" + utils.date('YmdHis');
        s.onload = s.onreadystatechange = function () {
            if (!r && (!this.readyState || this.readyState == 'complete'))
            {
                scripts.push(src);
                r = true;
                if (typeof callback === 'function')
                {
                    callback();
                }
            }
        };
        t = document.getElementsByTagName('script')[0];
        t.parentNode.insertBefore(s, t);
    }
    else
    {
        if (typeof callback === 'function')
        {
            callback();
        }
    }
}