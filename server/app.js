var express = require('express');
var http = require('http');
var https = require('https');
var path = require('path');
var server = require('socket.io');
var pty = require('pty.js');
var fs = require('fs');

var opts = require('optimist')
    .options({
        sslkey: {
            demand: false,
            description: 'path to SSL key'
        },
        sslcert: {
            demand: false,
            description: 'path to SSL certificate'
        },
        sshhost: {
            demand: false,
            description: 'ssh server host'
        },
        sshport: {
            demand: false,
            description: 'ssh server port'
        },
        sshuser: {
            demand: false,
            description: 'ssh user'
        },
        sshauth: {
            demand: false,
            description: 'defaults to "password", you can use "publickey,password" instead'
        },
        bind: {
            default: '127.0.0.1',
            alias: 'b',
            descriptiion: 'wetty listen address'
        },
        port: {
            default: 3000,
            alias: 'p',
            description: 'wetty listen port'
        },
    }).boolean('allow_discovery').argv;

var runhttps = false;
var sshport = 22;
var sshhost = 'localhost';
var sshauth = 'password';
var globalsshuser = '';

if (opts.sshport) {
    sshport = opts.sshport;
}

if (opts.sshhost) {
    sshhost = opts.sshhost;
}

if (opts.sshauth) {
	sshauth = opts.sshauth
}

if (opts.sshuser) {
    globalsshuser = opts.sshuser;
}

if (opts.sslkey && opts.sslcert) {
    runhttps = true;
    opts['ssl'] = {};
    opts.ssl['key'] = fs.readFileSync(path.resolve(opts.sslkey));
    opts.ssl['cert'] = fs.readFileSync(path.resolve(opts.sslcert));
}

process.on('uncaughtException', function(e) {
    console.error('Error: ' + e);
});

var httpserv;

var app = express();
app.get('/ssh/:user', function(req, res) {
    res.sendfile(__dirname + '/../client/dist/index.html');
});
app.use('/', express.static(path.join(__dirname, '/../client/dist')));

if (runhttps) {
    httpserv = https.createServer(opts.ssl, app);
} else {
    httpserv = http.createServer(app);
}

var io = server(httpserv);
io.on('connection', function(socket){
    var sshConn = process.getuid() != 0;
    var sshuser = '';
    var request = socket.request;
    console.log((new Date()) + ' Connection accepted.');
    if (request.url.match('^/ssh/')) {
        sshConn = true;
        sshuser = request.resource;
        sshuser = sshuser.replace('/ssh/', '');
    }
    if (sshuser) {
        sshuser = sshuser + '@';
    } else if (globalsshuser) {
        sshuser = globalsshuser + '@';
    }

    var term;
    if (sshConn) {
         term = pty.spawn('ssh', [sshuser + sshhost, '-p', sshport, '-o', 'PreferredAuthentications=' + sshauth], {
                name: 'xterm-256color',
                cols: 80,
                rows: 30
            });
    } else {
        term = pty.spawn('/bin/login', [], {
                name: 'xterm-256color',
                cols: 80,
                rows: 30
            });
    }
    console.log((new Date()) + " PID=" + term.pid + " STARTED");
    term.on('data', function(data) {
        socket.emit('output', data);
    });
    term.on('exit', function(code) {
        console.log((new Date()) + " PID=" + term.pid + " ENDED")
    });

    socket.on('resize', function(data) {
        term.resize(data.col, data.row);
    });

    socket.on('input', function(data) {
        term.write(data);
    });

    socket.on('disconnect', function() {
        term.end();
    });
});

httpserv.listen(opts.port, opts.bind, function() {
    if (runhttps)
        console.log('https on port ' + opts.port);
    else
        console.log('http on port ' + opts.port);
});
