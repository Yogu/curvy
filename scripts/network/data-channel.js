"use strict";

function DataChannel(serverConnection, contact, description) {
	var self = this;
	this.contact = contact;
	var configuration = {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]};
	
	var RTCPeerConnection = typeof(mozRTCPeerConnection) != 'undefined' ? mozRTCPeerConnection : 
		typeof(webkitRTCPeerConnection) != 'undefined' ? webkitRTCPeerConnection : RTCPeerConnection;
	
	var pc = new RTCPeerConnection(null);//configuration);

	// send any ice candidates to the other peer
	pc.onicecandidate = function (e) {
		serverConnection.send('candidate', {contact: contact, candidate: e.candidate});
	};

	var isCaller = description === null;
	if (isCaller)
		pc.createOffer(gotDescription);
	else {
		pc.setRemoteDescription(new RTCSessionDescription(description));
		pc.createAnswer(gotDescription);
	}
	
	function gotDescription(desc) {
		pc.setLocalDescription(desc);
		serverConnection.send(isCaller ? 'call' : 'accept', {contact: contact, description: desc});
	}

	$(serverConnection).on('accept', function(e, data) {
		if (data.contact == contact)
			pc.setRemoteDescription(new RTCSessionDescription(data.description));
	});
	
	$(serverConnection).on('reject', function(e, data) {
		if (data.contact == contact) {
			$(self).triggerHandler('close', data);
			self.close();
		}
	});
	
	$(serverConnection).on('candidate', function(e, data) {
		if (data.contact == contact)
			pc.addIceCandidate(new RTCIceCandidate(data.candidate));
	});
	
	var dataChannel = null;
	var dataChannelOpen = false;
	pc.onconnection = function() {
		console.log("Peer connection established, creating data channel...");
		dataChannel = pc.createDataChannel('data');
		dataChannel.onopen = function() {
			console.log("Data channel opened");
			dataChannelOpen = true;
			$(self).triggerHandler('open');
		};
		
		dataChannel.onclose = function() {
			console.log("Data channel closed");
			dataChannelOpen = false;
			$(self).triggerHandler('close');
		};
		
		dataChannel.onmessage = function(e) {
			$(this).triggerHandler('message', e.data);
		};
	};
	
	this.close = function() {
		pc.close();
		if (dataChannel != null)
			dataChannel.close();
		console.log('connection with ' + contact + ' closed');
	};
	
	this.send = function(message) {
		if (!dataChannelOpen)
			throw new Error('Tried to send message, but data channel is closed');
		dataChannel.send(message);
	};
};
