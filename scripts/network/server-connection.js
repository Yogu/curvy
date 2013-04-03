"use strict";

function ServerConnection(userName, url) {
	var self = this;
	this.userName = userName;
	this.state = 'connecting';
	this.isConnected = false;
	this.playerState = 'idle';
	this.peer = null;
	this._isCaller = false; // controls master/slave peer channel

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
		console.log('socket.io disconnected');
		if (self.state != 'name_not_available')
			self._setState('disconnected');
	});
	this._socket.on('connect', function() {
		console.log('socket.io connected');
	});
	this._socket.on('connect_failed', function() {
		self._setState('connect_failed');
		console.log('socket.io connection failed');
	});
	
	// login
	this._socket.on('name_not_available', function(data) {
		self._setState('name_not_available');
	});
	this._socket.on('accepted', function(data) {
		self._setState('connected');
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
		self._isCaller = data.isCaller;
		self._setPlayerState('busy', data.sender);
		$(self).triggerHandler('accept', data);
	});
	this._socket.on('reject', function(data) {
		// ignore invalid reject messages
		if (self.playerState == 'calling' && self.peer == data.sender) {
			self._setPlayerState('idle');
			$(self).triggerHandler('reject', data);
		}
	});
	this._socket.on('hangup', function(data) {
		if (self.playerState == 'busy') {
			self._setPlayerState('idle');
			$(self).triggerHandler('hangup', data);
		}
	});
	
	var setConnectorHandler = function(type) {
		self._socket.on(type, function(data) {
			if (self.connector && self.connector.peer == data.sender)
				$(self.connector).triggerHandler(type, data.data);
		});
	};
	var connectorEvents = ['connection', 'data', 'volatile'];
	for (var i = 0; i < connectorEvents.length; i++) {
		setConnectorHandler(connectorEvents[i]); 
	}

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
		this._setState('disconnected');
	},
	
	call: function(callee) {
		if (!this.isConnected)
			throw new Error("tried to call, but is not connected");
		this._setPlayerState('calling', callee);
		this._socket.emit('call', {recipient: callee});
	},
	
	hangup: function() {
		this._setPlayerState('idle');
		this._socket.emit('hangup');
	},
	
	_send: function(type, data) {
		if (this._socket)
			this._socket.emit(type, data);
		else
			console.warn('tried to send, but server connection closed');
	},
	
	_setState: function(state) {
		if (this.state != state) {
			this.state = state;
			this.isConnected = state == 'connected';
			$(this).triggerHandler('statechange');
			if (!this.isConnected)
				this._setPlayerState('idle');
		}
	},
	
	_setPlayerState: function(state, peer) {
		if (state != 'idle' && !peer)
			throw new Error('_setPlayerState with state != idle, but no peer');
		
		if (this.playerState != state || peer != this.peer) { 
			this._initPeerChannelFor(peer);
			this.playerState = state;
			this.peer = peer || null;
			$(this).triggerHandler('playerstatechange');
		}
	},
	
	_initPeerChannelFor: function(peer) {
		if (peer) {
			if (this.connector && this.connector.peer == peer) {
				if (this.peerChannel.state == 'disconnected' && this._isCaller) {
					console.log('server deciced I am the caller, so calling peer...');
					this.peerChannel.connect();
				}
			} else
				this._initPeerChannel(peer);
		} else
			this._closePeerChannel();
	},
	
	_initPeerChannel: function(peer) {
		this._closePeerChannel();
		var self = this;
		this.connector = {
			send: function(type, data) {
				if (['connection', 'data', 'volatile'].indexOf(type) < 0)
					throw new Error('Invalid event for connector');
				self._send(type, {recipient: peer, data: data});
			},
			peer: peer
		};
		this.peerChannel = new PeerChannel(this.connector);
		this.peerChannel.name = this.userName + '->'+ peer;
		if (this._isCaller)
			this.peerChannel.connect();
		console.log('initialized peer channel, is ' + (this._isCaller ? 'caller' : 'callee'));
	},
	
	_closePeerChannel: function() {
		if (this.connector) {
			this.connector = null;
		}
		if (this.peerChannel) {
			this.peerChannel.close();
			this.peerChannel = null;
		}
	}
};