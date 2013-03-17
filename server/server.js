var http = require("http");
var url = require("url");
var WebSocketServer = require('websocket').server;
var EventEmitter = require('events').EventEmitter

function start(port,controller) {	
	var webSocketServer = new WebSocketServer({
	    httpServer: server
	});
	console.log('server started on port ' + port);
	
	webSocketServer.on('request', function(request) {
	    var connection = request.accept(null, request.origin);
	    var client = new EventEmitter();
	    client.connection = connection;
	    client.request = request;
	    
	    client.send = function(type, data) {
	    	if (typeof(data) == 'undefined')
	    		data = null;
			var obj = {type: type, data: data};
			var json = JSON.stringify(obj);
			connection.send(json);
	    };
	    
	    client.close = function() {
	    	connection.close();
	    };

	    connection.on('message', function(message) {
	        if (message.type === 'utf8') {
	    		try {
	    			var obj = JSON.parse(message.utf8Data);
	    		} catch (e) {
	    			console.error('Invalid json: ' + e);
	    			return;
	    		}
	    		
    			if (typeof(obj.type) === null)
    				console.error('type field missing');
    			else {
    				var type = obj.type;
    				var data = (typeof(obj.data) !== null) ? obj.data : null;
    				client.emit('message', type, data);
    			}
	        }
	    });
	    
	    controller.accept(client);

	    connection.on('close', function(connection) {
	    	client.emit('close');
	    });
	});
}

exports.start = start;
