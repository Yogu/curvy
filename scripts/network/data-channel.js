"use strict";

function DataChannel(serverConnection, contact, description) {
	var self = this;
	this.contact = contact;
	var configuration = {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]};
	
	var RTCPeerConnection = typeof(mozRTCPeerConnection) != 'undefined' ? mozRTCPeerConnection : 
		typeof(webkitRTCPeerConnection) != 'undefined' ? webkitRTCPeerConnection : RTCPeerConnection;
	
	var pc = new RTCPeerConnection(configuration, {optional: [{RtpDataChannels: true}]});
	pc.onerror = function(e) {
		console.log('RTCPeerConnection error: ' + e);
	}

	// send any ice candidates to the other peer
	pc.onicecandidate = function (e) {
		if (e.candidate != null) // misterious...
			serverConnection.send('candidate', {contact: contact, candidate: e.candidate});
	};
	
	function gotDescription(desc) {
		pc.setLocalDescription(desc);
		serverConnection.send(isCaller ? 'call' : 'accept', {contact: contact, description: desc});
	}

	$(serverConnection).on('accept', function(e, data) {
		if (data.contact == contact && !self.isClosed)
			pc.setRemoteDescription(new RTCSessionDescription(data.description));
	});
	
	$(serverConnection).on('reject', function(e, data) {
		if (data.contact == contact && !self.isClosed) {
			self.isClosed = true;
			$(self).triggerHandler('reject', data);
			// no close needed, because connection never established
		}
	});
	
	$(serverConnection).on('candidate', function(e, data) {
		if (data.contact == contact && !self.isClosed)
			pc.addIceCandidate(new RTCIceCandidate(data.candidate));
	});
	
	this.isOpen = false;
	var isCaller = description === null;
	
	var dataChannel = null;
	// reliable data channels not supported by chrome
	if (isCaller) {
		setupDataChannel(pc.createDataChannel('data', {reliable: false}));
	} else {
		pc.ondatachannel = function(e) {
			setupDataChannel(e.channel);
		};
	}

	if (isCaller)
		pc.createOffer(gotDescription);
	else {
		pc.setRemoteDescription(new RTCSessionDescription(description));
		pc.createAnswer(gotDescription);
	}
	
	function setupDataChannel(channel) {
		dataChannel = channel;
		window.dataChannel = dataChannel;
		dataChannel.onopen = dataChannelOpen;
		dataChannel.onclose = dataChannelClose;
		dataChannel.onmessage = dataChannelMessage;
		dataChannel.onerror = function(e) { console.log('error: ' + e);}
	}
	
	function dataChannelOpen() {
		console.log("Data channel opened");
		self.isOpen = true;
		$(self).triggerHandler('open');
	};
	
	function dataChannelClose() {
		console.log("Data channel closed");
		self.isOpen = false;
		$(self).triggerHandler('close');
	};
	
	function dataChannelMessage(e) {
		try {
			var obj = JSON.parse(e.data);
		} catch (e) {
			console.error('Invalid json: ' + e);
			return;
		}
		if (!obj.type)
			console.log('Received message without type: ' + e.data);
		
		if (obj.type == 'close') {
			console.log('close message received');
			self.close();
			$(self).triggerHandler('close', {reason: 'remote'});
		}
		
		$(self).triggerHandler(obj.type, obj.data || null);
	};
	
	this.close = function() {
		if (self.isOpen)
			self.send('close');
		
		if (pc.readyState != 'closed')
			pc.close();
		if (dataChannel != null)
			dataChannel.close();
		console.log('connection with ' + contact + ' closed');
		this.isClosed = true;
	};
	
	this.send = function(type, data) {
		if (!self.isOpen) {
			console.log('Tried to send message, but data channel is closed');
			return false;
		}
		if (!type)
			throw new Error('Type must be specified');
		if (!data)
			data = null;
		var message = {type: type, data: data};
		dataChannel.send(JSON.stringify(message));
	};
};
