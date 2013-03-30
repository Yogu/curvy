"use strict";

var WEBSOCKET_URL = 'http://curvy.herokuapp.com/';

function Network() {
	this.user = null;
	this.serverConnection = null;
	this.channel = null;
}

Network.prototype = {
	/**
	 * Tries to log on using the given user name
	 * 
	 * @param user the user name
	 * @param success a callback that is called when the login was successful
	 * @param error a callback that is called when the user name is not available
	 */
	login: function(user, success, error) {
		var self = this;
		this.user = user;
		if (this.serverConnection != null)
			this.logout();
		this.serverConnection = io.connect(WEBSOCKET_URL, {'force new connection':true});
		this.serverConnection.on('error', function(data) {
			console.log('socket.io error: ' + data.message);
		});
		this.serverConnection.on('message', function(message) {
			console.log('received ' + message);
		});
		this.serverConnection.emit('login', {user: user});
		this.serverConnection.on('name_not_available', function() {
			self.logout();
			if (error) error();
		});
		this.serverConnection.on('accepted', function() {
			if (success) success();
		});
		this.serverConnection.on('contacts', function(contacts) {
			self.contacts = contacts.filter(function(c) { return c != self.user;});
			$(self).triggerHandler('contacts');
		});
		this.serverConnection.on('disconnect', function() {
			$(self).triggerHandler('logout');
		});
		this.serverConnection.on('call', function(data) {
			if (self.channel != null) {
				console.log('Rejecting call from ' + data.contact + ' because there is already an active channel');
				self.serverConnection.emit('reject', {contact: data.contact, reason: 'busy'});
			} else {
				console.log('Incoming call from ' + data.contact);
				$(self).triggerHandler('call', {
					caller: data.contact,
					accept: function() {
						self._createDataChannel(data.contact, data.description);
					}
				});
			}
		});
	},
	
	/**
	 * Closes the current session, if existing
	 */
	logout: function() {
		var self = this;
		if (this.channel != null)
			this.channel.close();
		
		if (this.serverConnection != null)
			this.serverConnection.disconnect();
		this.serverConnection = null;
		this.channel = null;
		$(this).triggerHandler('logout');
	},
	
	/**
	 * Starts a channel with the given contact
	 * 
	 * If there is already an active connection with the contact, re-uses the existing one
	 * 
	 * @param contact The contact to call
	 * @return the channel
	 */
	call: function(contact, success) {
		if (contact == this.user)
			throw new Error('Tried to call yourself');
		if (this.contacts.indexOf(contact) < 0)
			throw new Error('Contact not found');
		
		return this._createDataChannel(contact, null);
	},
	
	closeChannel: function() {
		if (this.channel != null) {
			this.channel.close();
			//this._setChannel(null);
		}
	},
	
	_createDataChannel: function(contact, description) {
		var self = this;
		
		if (this.channel != null && this.channel.contact == contact)
			return this.channel;
		if (self.channel != null)
			self.channel.close();
		var channel = new DataChannel(this.serverConnection, contact, description);
		
		console.log('Opening data channel for ' + contact);
		$(channel).on('close', function(e, data) {
			if (self.channel == channel) {
				self._setChannel(null);
			}
			if (data && data.reason == 'remote')
				$(self).triggerHandler('remoteclosed', data);
		});
		$(channel).on('open', function() {
			self._setChannel(channel);
		});
		$(channel).on('reject', function(e, data) {
			$(self).triggerHandler('reject', data);
			if (self.channel == channel) {
				self._setChannel(null);
			}
		});
		self.channel = channel;
		return channel;
	},
	
	_setChannel: function(channel) {
		this.channel = channel;
		game.setChannel(channel);
		$(this).triggerHandler('channel', channel);
	}
};
