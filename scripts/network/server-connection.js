"use strict";

function ServerConnection(userName, url) {
	var self = this;
	this.userName = userName;
	this.state = 'connecting';
	this.isConnected = false;

	url = (typeof(url) == 'undefined') ? ServerConnection.WEBSOCKET_URL : url;
	this._socket = io.connect(url, {'force new connection':true});

	this._socket.on('error', function(data) {
		console.error('socket.io error: ' + data);
	});
	this._socket.on('err', function(data) {
		console.error('server sent error: ' + data.message);
	});
	this._socket.on('name_not_available', function(data) {
		self.state = 'name_not_available';
		self.isConnected = false;
	});
	this._socket.on('accepted', function(data) {
		self.state = 'connected';
		self.isConnected = true;
	});
	this._socket.on('disconnect', function(data) {
		this.state = 'disconnected';
		this.isConnected = false;
	});
	this._socket.on('contacts', function(contacts) {
		self.contacts = contacts.filter(function(c) { return c != self.userName;});
		$(self).triggerHandler('contacts');
	});
	this._socket.on('connect', function() {
		console.log('socket.io connected');
	});
	this._socket.on('connect_failed', function() {
		self.state = 'connect_failed';
		self.isConnected = false;
		console.log('socket.io connection failed');
	});

	self._socket.emit('login', {user: userName});
}

ServerConnection.WEBSOCKET_URL = 'http://curvy.herokuapp.com/';

ServerConnection.prototype = {
	close: function() {
		if (this._socket) {
			try  {
				this._socket.disconnect();
			} catch (e) {
				console.log('error disconnection socket.io: ' + e);
			}
			this._socket = null;
		}
		this.state = 'disconnected';
		this.isConnected = false;
	},
};