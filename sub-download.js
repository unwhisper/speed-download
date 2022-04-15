const request = require('request');
const progress = require('request-progress');
const fs = require('fs');

process.send = process.send || function(msg) {
    console.log(msg)
};

const download = (key, url, headers, filepath, range_start, range_end, throttle, proxy) => {
    let d_err;
    let header = Object.assign({
        'Range': 'bytes=' + range_start + '-' + range_end
    }, JSON.parse(headers));
    let option = {
        uri: url, 
        rejectUnauthorized: false,
        headers: header
    }
    if(proxy) option.proxy = proxy
    let r = request(option);
    progress(r, {
            'throttle': throttle
        })
        .on('response', response => {
            if (response.statusCode < 200 || response.statusCode > 210) {
                r.abort();
                d_err = 'http status code: ' + response.statusCode;
                process.send({
                    'key': key,
                    'err': d_err
                });
            }
        })
        .on('progress', function(state) {
            process.send({
                'key': key,
                'progress': state
            });
        })
        .on('error', function(err) {
            d_err = err;
            process.send({
                'key': key,
                'err': err
            });
        })
        .on('end', function() {
            process.send({
                'key': key,
                'finish': true,
                'err': d_err
            });
        })
        .pipe(fs.createWriteStream(filepath));
}

if (require.main !== module) {
    exports.download = download;
} else {
    if (process.argv.length < 9) {
        console.error('invalidate process arguments');
    } else {
        let [_1, _2, key, url, headers, filepath, range_start, range_end, throttle, proxy] = process.argv;
        range_start = parseInt(range_start);
        range_end = parseInt(range_end);
        throttle = parseInt(throttle);
        download(key, url, headers, filepath, range_start, range_end, throttle, proxy);
    }
}