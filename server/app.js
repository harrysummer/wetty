var express = require('express');
var device = require('express-device');
//var bodyParser = require('body-parser');
var http = require('http');
var https = require('https');
var path = require('path');
var server = require('socket.io');
var pty = require('ptyw.js');
var fs = require('fs');
var os = require('os');

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
        sshport: {
            demand: false,
            description: 'server port'
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
var sshauth = 'password';

if (opts.sshport) {
    sshport = opts.sshport;
}

if (opts.sshauth) {
	sshauth = opts.sshauth
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
app.set('view engine', 'ejs');
app.set('view options', { layout: false });
app.set('views', __dirname + '/../client/dist/views');
app.use(device.capture());

app.get('/', function(req, res) {
    res.render('index.ejs');
})
app.get('/ssh/:user', function(req, res) {
    res.render('index.ejs');
});
app.use('/', express.static(path.join(__dirname, '/../client/dist/static')));

if (runhttps) {
    httpserv = https.createServer(opts.ssl, app);
} else {
    httpserv = http.createServer(app);
}

var io = server(httpserv);
io.on('connection', function(socket){
    console.log((new Date()) + ' Connection accepted');

    socket.on('init', function(data) {
        var conn_type = data.type;
        var conn_user = data.user;

        // if conn_type is not specified, infer it from os.type()
        if (!conn_type) {
            switch (os.type())
            {
            case 'Linux':
                // If current user is root and not force ssh, then use /bin/login
                conn_type = process.getuid() == 0 ? 'login' : 'ssh';
                break;

            case 'Darwin':
                // TODO: don't know what is correct since I don't have a Mac, use ssh by default
                conn_type = 'ssh';
                break;

            case 'Windows_NT':
                conn_type = 'winrs';
                break;

            default:
                console.error('Unkown OS type: ' + os.type());
                process.exit(1);
            }
        }

        var file = null;
        var argv = null;
        var opt = null;
        switch (conn_type) {
            case 'login':
                file = '/bin/login';
                argv = conn_user ? [ conn_user ] : [];
                opt = {
                    name: 'xterm-256color',
                    cols: 80,
                    rows: 30
                };
                break;
            case 'ssh':
                file = 'ssh';
                argv = [ (conn_user ? conn_user + '@' : '') + 'localhost', '-p', sshport, '-o', 'PreferredAuthentications=' + sshauth ];
                opt = {
                    name: 'xterm-256color',
                    cols: 80,
                    rows: 30
                };
                break;
            case 'winrs':
                file = 'cmd.exe';
                argv = [];
                opt = {
                    name: 'Windows Shell',
                    cols: 80,
                    rows: 30,
                    cwd: process.env.HOME,
                    env: process.env
                };
                break;
            default:
                console.error('Unknown connection type: ' + conn_type);
                process.exit(1);
        }


        var term = pty.spawn(file, argv, opt);

        term.on('data', function(data) {
            console.log('term.onData: ' + data);
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

        console.log((new Date()) + " PID=" + term.pid + " STARTED: " + file + argv.join(' '));
    });


});

httpserv.listen(opts.port, opts.bind, function() {
    if (runhttps)
        console.log('https on port ' + opts.port);
    else
        console.log('http on port ' + opts.port);
});
