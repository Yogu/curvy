"use strict";

function ServerConnection(user) {
	var url = 'ws://' + document.location.host + '/connect?user='
			+ encodeURI(user);
	var connection = new WebSocket(url);
	this.user = user;

	connection.onopen = function() {
		console.log('opened');
	};
	
	var self = this;
	
	this.send = function(type, data) {
		var obj = {type: type, data: data};
		var json = JSON.stringify(obj);
		connection.send(json);
	};

	// Log errors
	connection.onerror = function(error) {
		console.log('WebSocket Error ' + error);
	};

	connection.onmessage = function(e) {
		console.log('Server: ' + e.data);
		try {
			var obj = JSON.parse(e.data);
		} catch (e) {
			console.error('Invalid json: ' + e);
			return;
		}
		
		if (!obj.type)
			console.error('type field missing');
		else {
			var type = obj.type;
			var data = obj.data ? obj.data : null;
			$(self).trigger(type, [data]);
		}
	};
	
	connection.onclose = function(e) {
		$(self).on('close');
	};
	
	this.close = function() {
		connection.close();
	};
};