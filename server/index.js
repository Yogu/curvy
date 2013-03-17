var server = require('./server.js');
var controller = require('./controller.js');

server.start(8888, controller);