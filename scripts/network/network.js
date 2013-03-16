"use strict";

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
		this.serverConnection = new ServerConnection(user);
		$(this.serverConnection).on('name_not_available', function() {
			self.logout();
			if (error) error();
		});
		$(this.serverConnection).on('accepted', function() {
			if (success) success();
		});
		$(this.serverConnection).on('contacts', function(e, contacts) {
			self.contacts = contacts.filter(function(c) { return c != self.user;});
			$(self).triggerHandler('contacts');
		});
		$(this.serverConnection).on('close', function() {
			$(self).triggerHandler('logout');
		});
		$(this.serverConnection).on('call', function(e, data) {
			if (this.channel != null) {
				console.log('Rejecting call from ' + data.contact + ' because there is already an active channel');
				this.serverConnection.send('reject', {contact: data.contact, reason: 'busy'});
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
		// Close channels
		for (contact in this.channels) {
			channels[contact].close();
		}
		
		if (this.serverConnection != null)
			this.serverConnection.close();
		this.serverConnection = null;
		this.channels = {};
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
		if (this.channel != null && this.channel.contact == contact)
			return this.channel;
		
		return this._createDataChannel(contact, null);
	},
	
	_createDataChannel: function(contact, description) {
		var self = this;
		if (self.channel != null)
			self.channel.close();
		self.channel = new DataChannel(this.serverConnection, contact, description);
		
		console.log('Opening data channel for ' + contact);
		$(self.channel).on('close', function() {
			self.channel = null;
		});
		return self.channel;
	}
};
