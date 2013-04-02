"use strict";

function ServerConnection(userName, url) {
	var self = this;
	this.userName = userName;
	this.state = 'connecting';
	this.isConnected = false;
	this.playerState = 'idle';
	this.peer = null;

	url = (typeof(url) == 'undefined') ? ServerConnection.WEBSOCKET_URL : url;
	this._socket = io.connect(url, {'force new connection':true});

	// connection
	this._socket.on('error', function(data) {
		console.error('socket.io error: ' + data);
	});
	this._socket.on('err', function(data) {
		console.error('server sent error: ' + data.message);
	});
	this._socket.on('disconnect', function(data) {
		this.state = 'disconnected';
		this.isConnected = false;
	});
	this._socket.on('connect', function() {
		console.log('socket.io connected');
	});
	this._socket.on('connect_failed', function() {
		self.state = 'connect_failed';
		self.isConnected = false;
		console.log('socket.io connection failed');
	});
	
	// login
	this._socket.on('name_not_available', function(data) {
		self.state = 'name_not_available';
		self.isConnected = false;
	});
	this._socket.on('accepted', function(data) {
		self.state = 'connected';
		self.isConnected = true;
	});
	
	// player list
	this._socket.on('players', function(players) {
		self.players = players.filter(function(p) { return p.name != self.userName;});
		$(self).triggerHandler('players');
	});
	
	// calls
	this._socket.on('call', function(data) {
		data.accept = function() {
			self._socket.emit('call', {recipient: data.sender});
		};
		data.reject = function() {
			self._socket.emit('reject', {recipient: data.sender});
		};
		$(self).triggerHandler('call', data);
	});
	this._socket.on('accept', function(data) {
		self.playerState = 'busy';
		self.peer = data.sender;
		$(self).triggerHandler('accept', data);
	});
	this._socket.on('reject', function(data) {
		// ignore invalid reject messages
		if (self.playerState == 'calling' && self.peer == data.sender) {
			self.playerState = 'idle';
			self.peer = null;
			$(self).triggerHandler('reject', data);
		}
	});
	this._socket.on('hangup', function(data) {
		if (self.playerState == 'busy') {
			self.playerState = 'idle';
			self.peer = null;
			$(self).triggerHandler('hangup', data);
		}
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
	
	call: function(callee) {
		if (!this.isConnected)
			throw new Error("tried to call, but is not connected");
		this.playerState = 'calling';
		this.peer = callee;
		this._socket.emit('call', {recipient: callee});
	},
	
	hangup: function() {
		this.playerState = 'idle';
		this.peer = null;
		this._socket.emit('hangup');
	}
};