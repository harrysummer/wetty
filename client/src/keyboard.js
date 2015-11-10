$(function() {
    $('#keyboard').keyboard({
        noFocus: true,
        ignoreEsc: true,
        usePreview: false,
        lockInput: true,
        keyBinding: 'mousedown touchstart',
        alwaysOpen: true,
        position: {
            of: $('#terminal'),
            my: 'center bottom',
            at: 'center bottom',
            at2: 'center bottom'
        }
    })
    .addMobile({
        container: { theme: 'b', cssClass: 'ui-body' },
        input: { theme: 'b', cssClass: '' },
        buttonMarkup: { theme:'b', cssClass:'ui-btn', shadow:'true', corners:'true'  },
        buttonHover : { theme:'b', cssClass:'ui-btn-hover'  },
        buttonAction: { theme:'b', cssClass:'ui-btn-active'  },
        buttonActive: { theme:'b', cssClass:'ui-btn-active'  },
        allThemes   : 'a b c'
    });
    $('.ui-keyboard-input').bind('keyboardChange', function(e, keyboard, el){
        console.log(keyboard.last);
        var key = keyboard.last.key;
        socket.emit('input', key);
    });
    var keyboard = $('#keyboard').getkeyboard();
    keyboard.reveal();
});
