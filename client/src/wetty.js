var term;
var socket = io(window.location.protocol + '//' + window.location.host);
var buf = '';

function Wetty(argv) {
    this.argv_ = argv;
    this.io = null;
    this.pid_ = -1;
}

Wetty.prototype.run = function() {
    this.io = this.argv_.io.push();

    this.io.onVTKeystroke = this.sendString_.bind(this);
    this.io.sendString = this.sendString_.bind(this);
    this.io.onTerminalResize = this.onTerminalResize.bind(this);
}

Wetty.prototype.sendString_ = function(str) {
    socket.emit('input', str);
};

Wetty.prototype.onTerminalResize = function(col, row) {
    socket.emit('resize', { col: col, row: row });
};

socket.on('connect', function() {
    var parts = window.location.pathname.split('/');
    var conn_type = null, conn_user = null;
    if (parts.length >= 2)
        conn_type = parts[1];
    if (parts.length >= 3)
        conn_user = parts[2];
    socket.emit('init', {
        type: conn_type,
        user: conn_user
    });

    var lib = returnExports.lib;
    var hterm = returnExports.hterm;
    lib.init(function() {
        hterm.defaultStorage = new lib.Storage.Local();
        term = new hterm.Terminal();
        window.term = term;
        term.decorate(document.getElementById('terminal'));

        term.setCursorPosition(0, 0);
        term.setCursorVisible(true);
        term.prefs_.set('scrollbar-visible', false);
        term.prefs_.set('use-default-window-copy', true);

        term.runCommandClass(Wetty, document.location.hash.substr(1));
        socket.emit('resize', {
            col: term.screenSize.width,
            row: term.screenSize.height
        });

        if (buf && buf != '')
        {
            term.io.writeUTF16(buf);
            buf = '';
        }
    });
});

socket.on('output', function(data) {
    if (!term) {
         buf += data;
         return;
    }
    term.io.writeUTF16(data);
});

socket.on('disconnect', function() {
    console.log("Socket.io connection closed");
});
