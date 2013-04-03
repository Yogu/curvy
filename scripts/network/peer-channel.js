"use strict";

var RTCPeerConnection = window.mozRTCPeerConnection || window.webkitRTCPeerConnection 
|| window.RTCPeerConnection;
var RTC_CONFIGURATION = {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]};

function PeerChannel(connector) {
	var self = this;
	this._connector = connector;
	this.state = 'disconnected';
	this.isConnected = false;
	this.disableRTC = false;
	this.rtcConnected = false;
	
	$(connector).on('connection', function(e, data) {
		if (data.description) {
			if (self.state == 'connecting' || self.state == 'disconnected') {
				if (self.disableRTC || !self._initRTC(data.description)) {
					self.disableRTC = true;
					self._connector.send('connection', {fallback: true});
				}
			}
		} else if (data.candidate) {
			if (self._rtc != null) {
				var cand = new RTCIceCandidate(data.candidate);
				console.log('received ice candidate for ' + self.name);
				console.log(self._dataChannel);
				self._rtc.addIceCandidate(cand);
			}
		} else if (data.fallback) {
			if (self.state == 'connecting' || self.state == 'disconnected') {
				self.disableRTC = true;
				self._connected();
				self._closeRTC();
				self._connector.send('connection', {fallback: true});
			}
		} else if (data.close) {
			self.close();
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
			if (this.disableRTC || !this._initRTC()) {
				console.log('connect: fallback');
				this.disableRTC = true;
				this._connector.send('connection', {fallback: true});
			}
		}
	},
		
	send: function(event, data) {
		data = typeof(data) == 'undefined' ? null : data;
		var message = {event: event, data: data};
		
		this._connector.send('data', message);
	},
		
	sendVolatile: function(event, data) {
		data = typeof(data) == 'undefined' ? null : data;
		var message = {event: event, data: data};
		
		if (this.rtcConnected) {
			this._dataChannel.send(JSON.stringify(message));
		} else {
			this._connector.send('volatile', message);
		}
	},
	
	close: function() {
		console.log(this.name + ' closed');
		this._closeRTC();
		this.state = 'disconnected';
		this.isConnected = false;
		this.rtcConnected = false;
		if (this.state == 'connecting' || this.state == 'connected')
			this._connector.send('connection', {close: true});
	},
	
	_connected: function() {
		console.log(this.name + ' connected');
		this.state = 'connected';
		this.isConnected = true;
	},
	
	_initRTC: function(description) {
		if (this._rtc) {
			if (description) {
				console.log('remote description set for ' + this.name);
				this._rtc.setRemoteDescription(new RTCSessionDescription(description));
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
				self._connector.send('connection', {description: desc});
			}
		}

		if (description) {
			rtc.setRemoteDescription(new RTCSessionDescription(description));
			console.log('remote description set for ' + self.name);
			rtc.createAnswer(gotDescription);
		} else
			rtc.createOffer(gotDescription);

		rtc.onicecandidate = function (e) {
			if (e.candidate != null) // misterious...
				self._connector.send('connection', {candidate: e.candidate});
		};
		
		dataChannel.onopen = function() {
			self.rtcConnected = true;
			self._connected();
			dataChannel.onmessage = function(e) {
				console.log('received rtc message: ' + e.data);
				try {
					var obj = JSON.parse(e.data);
				} catch (e) {
					console.error('Invalid json over RTC: ' + e);
					return;
				}
				if (!obj.event)
					console.log('Received RTC message without event: ' + e.data);
				
				$(self).triggerHandler(obj.event, obj.data || null);
			};
		};
		
		dataChannel.onclose = function() {
			// If this connection uses RTC, close it
			if (!self.disableRTC)
				self.close();
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