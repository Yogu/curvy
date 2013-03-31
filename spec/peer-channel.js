describe('PeerChannel', function() {
	var connector1;
	var connector2;
	
	beforeEach(function() {
		connector1 = {
			send: function(type, data) {
				console.log('1 -> 2: ' + type);
				if (data) console.log(data);
				$(connector2).triggerHandler(type, data);
			}
		};
		connector2 = {
			send: function(type, data) {
				console.log('2 -> 1: ' + type);
				if (data) console.log(data);
				$(connector1).triggerHandler(type, data);
			}
		};
	});
	
	it('should be disconnected after creation', function() {
		var channel = new PeerChannel(connector1);
		expect(channel.state).toEqual('disconnected');
		expect(channel.isConnected).toEqual(false);
	});
	
	it('should be connecting after conect()', function() {
		var channel = new PeerChannel(connector1);
		channel.connect();
		expect(channel.state).toEqual('connecting');
		expect(channel.isConnected).toEqual(false);
	});
	
	it('should accept connection', function() {
		var channel1 = new PeerChannel(connector1);
		var channel2 = new PeerChannel(connector2);
		channel1.name = '1'; channel2.name = '2';
		channel1.connect();
		waitsFor(function() {
			return channel2.isConnected;
		}, 'channel2.isConnected should be true');
		runs(function() {
			expect(channel2.state).toEqual('connected');
		});
	});
	
	it('should respond on connection', function() {
		var channel1 = new PeerChannel(connector1);
		var channel2 = new PeerChannel(connector2);
		channel1.connect();
		waitsFor(function() {
			return channel1.isConnected;
		}, 'channel1.isConnected should be true');
		runs(function() {
			expect(channel1.state).toEqual('connected');
		});
	});
	
	it('should use RTCPeerConnection', function() {
		var channel1 = new PeerChannel(connector1);
		var channel2 = new PeerChannel(connector2);
		channel1.name = '1'; channel2.name = '2';
		channel1.connect();
		waitsFor(function() {
			return channel1.isConnected;
		}, 'channel2.isConnected should be true');
		runs(function() {
			expect(channel1.disableRTC).toEqual(false, 'fallback used instead');
		});
	});
	
	it('should send and receive', function() {
		var isCalled = false;
		runs(function() {
			var channel1 = new PeerChannel(connector1);
			var channel2 = new PeerChannel(connector2);
			channel1.connect();
			$(channel2).on('theevent', function() { isCalled = true; });
			channel1.send('theevent');
		});
		
		waitsFor(function() { return isCalled;}, "The event listener should be called");
	});
	
	it('should pass data', function() {
		var isCalled = false;
		var receivedData = null;
		var sentData = { param: 'theData', boolean: true, number: 12.4};
		runs(function() {
			var channel1 = new PeerChannel(connector1);
			var channel2 = new PeerChannel(connector2);
			channel1.connect();
			$(channel2).on('theevent', function(e, data) { isCalled = true; receivedData = data; });
			channel1.send('theevent', sentData);
		});
		
		waitsFor(function() { return isCalled;}, "The event listener should be called");
		
		runs(function() {
			expect(receivedData).toEqual(sentData);
		})
	});
});
