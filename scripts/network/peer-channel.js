"use strict";

var RTCPeerConnection = window.mozRTCPeerConnection || window.webkitRTCPeerConnection || window.RTCPeerConnection;
var RTCSessionDescription = window.mozRTCSessionDescription || window.webkitRTCSessionDescription || window.RTCSessionDescription;
var RTCIceCandidate = window.mozRTCIceCandidate || window.webkitRTCIceCandidate || window.RTCIceCandidate;
var RTC_CONFIGURATION = {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]};

function PeerChannel(connector) {
	var self = this;
	this._connector = connector;
	this.state = 'disconnected';
	this.isConnected = false;
	this.disableRTC = false;
	this.rtcConnected = false;
	this.isCaller = false;
	
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
				self._rtc.addIceCandidate(cand);
			}
		} else if (data.fallback) {
			if (self.state == 'connecting' || self.state == 'disconnected') {
				console.log('disabled rtc because of peer');
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
		self._handleEvent(data.event, data.data);
	});
}

PeerChannel.prototype = {
	connect: function() {
		if (this.state == 'disconnected') {
			this.state = 'connecting';
			this.isCaller = true;
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
	
	sendGameover: function(data) {
		this._connector.send('gameover', data);
	},
		
	sendVolatile: function(event, data) {
		data = typeof(data) == 'undefined' ? null : data;
		
		if (this.rtcConnected) {
			// Only the update ('u') event uses this
			try {
				if (data instanceof ArrayBuffer)
					this._dataChannel.send(new Float32Array(data.buffer));
				else
					this._dataChannel.send(JSON.stringify({e: event, d: data}));
			} catch (e) {
				console.log('Error sending over RTCDataChannel');
				console.log(e);
				
			}
		} else {
			this._connector.send('volatile', { event: event, data: data});
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
	
	doPing: function() {
		this.sendVolatile('ping', {sendTime: new Date().getTime()});
	},
	
	_connected: function() {
		console.log(this.name + ' connected');
		this.state = 'connected';
		this.isConnected = true;
	},
	
	_initRTC: function(description) {
		var self = this;
		
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
			rtc = new RTCPeerConnection(RTC_CONFIGURATION);
		} catch (e) {
			console.error(e);
			return false;
		}
		if (!rtc.createDataChannel)
			return false;

		if (description) {
			rtc.ondatachannel = function(e) {
				self._dataChannel = e.channel;
				self._setupDataChannel();
			};
		} else {
			try {
				self._dataChannel = rtc.createDataChannel('data', {maxRetransmits: 0});
				self._setupDataChannel();
			} catch (e) {
				console.error(e);
				return false;
			}
		}

		rtc.name = this.name;
		this._rtc = rtc;
		
		function gotDescription(desc) {
			if (self._rtc) {
				self._rtc.setLocalDescription(desc);
				console.log('local description set for ' + self.name);
				self._connector.send('connection', {description: desc});
			}
		}

		function descriptionFailure(error) {
			console.log(error);
			console.log('RTCPeerConnection failed, disabling rtc');
			self.rtcConnected = false;
			self.disableRTC = true;
		}

		if (description) {
			rtc.setRemoteDescription(new RTCSessionDescription(description));
			console.log('remote description set for ' + self.name);
			rtc.createAnswer(gotDescription, descriptionFailure);
		} else {
			rtc.createOffer(gotDescription, descriptionFailure);
		}

		rtc.onicecandidate = function (e) {
			if (e.candidate != null) // misterious...
				self._connector.send('connection', {candidate: e.candidate});
		};

		this.state = 'connecting';
		
		return true;
	},
	
	_setupDataChannel: function() {
		var dataChannel = this._dataChannel;
		var self = this;
		
		dataChannel.binaryMode = 'arraybuffer';
		
		dataChannel.onopen = function() {
			self.rtcConnected = true;
			self._connected();
		};

		dataChannel.onmessage = function(e) {
			// Only the update ('u') event uses this
			if (e.data instanceof ArrayBuffer)
				self._handleEvent('u', new Float32Array(e.data));
			
			try {
				var obj = JSON.parse(e.data);
			} catch (e) {
				console.error('Invalid json over RTC: ' + e);
				return;
			}
			if (!obj.e)
				console.log('Received RTC message without event: ' + e.data);
			
			self._handleEvent(obj.e, obj.d || null);
		};
		
		dataChannel.onerror = function(e) {
			console.log('dataChannel errored');
			console.log(e);
		}
		
		dataChannel.onclose = function() {
			// If this connection uses RTC, close it
			if (!self.disableRTC)
				self.close();
		};
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
	},
	
	_handleEvent: function(event, data) {
		switch (event) {
		case 'ping':
			this.sendVolatile('pingback', data);
			break;
		case 'pingback':
			this.pingTime = new Date() - data.sendTime;
			$(this).triggerHandler('ping', this.pingTime);
			break;
		default:
			$(this).triggerHandler(event, data);
		}
	}
};
