"use strict";

function Network() {
	this.user = null;
	this.serverConnection = null;
	this.channels = {};
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
			$(self).trigger('contacts');
		});
		$(this.serverConnection).on('close', function() {
			$(self).trigger('logout');
		});
		$(this.serverConnection).on('call', function(e, data) {
			console.log('Incoming call from ' + data.contact);
			$(self).trigger('call', {
				caller: data.contact,
				accept: function() {
					self._createDataChannel(data.contact, data.description);
				}
			});
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
		$(this).trigger('logout');
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
		else if (this.contacts.indexOf(contact) < 0)
			throw new Error('Contact not found');
		else if (contact in this.channels) {
			return this.channels[contact];
		} else {
			return this._createDataChannel(contact, null);
		}
	},
	
	_createDataChannel: function(contact, description) {
		if (contact in this.channels)
			this.channels[contact].close();
		var channel = new DataChannel(this.serverConnection, contact, description);
		console.log('Opened data channel for ' + contact);
		this.channels[contact] = channel;
		return channel;
	}
};
