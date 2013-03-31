"use strict";

var RTCPeerConnection = window.mozRTCPeerConnection || window.webkitRTCPeerConnection 
|| window.RTCPeerConnection;
var RTC_CONFIGURATION = {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]};

function PeerChannel(connector) {
	var self = this;
	this._connector = connector;
	this.state = 'disconnected';
	this.isConnected = false;
	this._queue = [];
	this.disableRTC = false;
	
	$(connector).on('fallback', function(e, data) {
		if (self.state == 'connecting' || self.state == 'disconnected') {
			self._connected();
			self._closeRTC();
			connector.send('fallback');
		}
	});
	
	$(connector).on('data', function(e, data) {
		$(self).triggerHandler(data.event, data.data);
	});
	
	$(connector).on('description', function(e, data) {
		if (self.state == 'connecting' || self.state == 'disconnected') {
			if (self.disableRTC || !self._initRTC(data.description)) {
				self.disableRTC = true;
				self._connector.send('fallback', null);
			}
		}
	});
	
	$(connector).on('candidate', function(e, data) {
		if (self._rtc != null) {
			var cand = new RTCIceCandidate(data.candidate);
			console.log('received ice candidate for ' + self.name);
			console.log(self._dataChannel);
			self._rtc.addIceCandidate(cand);
		}
	});
	
	$(connector).on('close', function(e, data) {
		self.close();
	});
}

PeerChannel.prototype = {
	connect: function() {
		if (this.state == 'disconnected') {
			this.state = 'connecting';
			if (this.disableRTC || !this._initRTC()) {
				console.log('connect: fallback');
				this.disableRTC = true;
				this._connector.send('fallback', null);
			}
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
	
	close: function() {
		console.log(this.name + ' closed');
		this._closeRTC();
		if (this.state == 'connecting' || this.state == 'connected')
			connector.send('close');
		this.state = 'disconnected';
		this.isConnected = false;
	},
	
	_connected: function() {
		console.log(this.name + ' connected');
		this.state = 'connected';
		this.isConnected = true;
		this._sendQueue();
	},
	
	_sendQueue: function() {
		while (this._queue.length) {
			var item = this._queue.pop();
			this.send(item.event, item.data);
		}
	},
	
	_initRTC: function(description) {
		if (this._rtc) {
			if (description) {
				console.log('remote description set for ' + this.name);
				this._rtc.setRemoteDescription(description);
			}
			return true;
		}
		
		console.log('_initRTC for ' + this.name);
		
		if (!RTCPeerConnection)
			return false;
		
		var rtc;
		try {
			rtc = new RTCPeerConnection(RTC_CONFIGURATION, {optional: [{RtpDataChannels: true}]});
		} catch (e) {
			console.error(e);
			return false;
		}
		if (!rtc.createDataChannel)
			return false;

		var dataChannel;
		try {
			dataChannel = rtc.createDataChannel('data', {reliable: false});
		} catch (e) {
			console.error(e);
			return false;
		}
		rtc.name = this.name;
		
		this._rtc = rtc;
		this._dataChannel = dataChannel;
		var self = this;
		
		function gotDescription(desc) {
			if (self._rtc) {
				self._rtc.setLocalDescription(desc);
				console.log('local description set for ' + self.name);
				console.log(self._rtc.name);
				self._connector.send('description', {description: desc});
			}
		}

		if (description) {
			rtc.setRemoteDescription(description);
			console.log('remote description set for ' + self.name);
			rtc.createAnswer(gotDescription);
		} else
			rtc.createOffer(gotDescription);

		rtc.onicecandidate = function (e) {
			if (e.candidate != null) // misterious...
				self._connector.send('candidate', {candidate: e.candidate});
		};
		
		dataChannel.onopen = function() {
			self._connected();
		};
		
		dataChannel.onclose = function() {
			self._close();
		};

		this.state = 'connecting';
		
		return true;
	},
	
	_closeRTC: function() {
		if (this._rtc != null) {
			try {
				this._rtc.close();
			} catch (e) {
				console.error(e);
			}
			this._rtc = null;
			this._dataChannel = null;
		}
	}
};