"use strict";

function PeerChannel(connector) {
	var self = this;
	this._connector = connector;
	this.state = 'disconnected';
	this.isConnected = false;
	this._queue = [];
	
	$(connector).on('init', function(e, data) {
		if (self.state == 'connecting' || self.state == 'disconnected') {
			if (self.state == 'disconnected')
				self.connect();
			self.state = 'connected';
			self.isConnected = true;
			self._sendQueue();
		}
	});
	
	$(connector).on('data', function(e, data) {
		$(self).triggerHandler(data.event, data.data);
	});
}

PeerChannel.prototype = {
	connect: function() {
		if (this.state == 'disconnected') {
			this.state = 'connecting';
			this._connector.send('init', null);
		}
	},
		
	send: function(event, data) {
		data = typeof(data) == 'undefined' ? null : data;
		
		if (this.isConnected) {
			this._connector.send('data', {event: event, data: data});
		} else {
			this._queue.push({event: event, data: data});
		}
	},
	
	_sendQueue: function() {
		for (var i = 0; i < this._queue.length; i++) {
			var item = this._queue[i];
			this.send(item.event, item.data);
		}
		this._queue = [];
	}
};