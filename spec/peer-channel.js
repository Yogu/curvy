describe('PeerChannel', function() {
	var connector1 = null;
	var connector2 = null;
	
	/**
	 * Mock class for a dual-end pipe
	 */
	function Connector(name) {
		var allowedEvents = ['connection', 'data', 'volatile'];
		this.name = name;
		
		this.send = function(type, data) {
			if (!this.peer)
				throw new Error('Connector not connected to any peer');
			if (allowedEvents.indexOf(type) < 0)
				throw new Error('Invalid event type: ' + type);
			
			console.log(this.name + '->' + this.peer.name + ': ' + type);
			data = JSON.parse(JSON.stringify(data));
			if (data) console.log(data);
			$(this.peer).triggerHandler(type == 'volatile' ? 'data' : type, data);
		};
		this.connectTo = function(peer) {
			this.peer = peer;
		};
	}
	
	beforeEach(function() {
		connector1 = new Connector('1');
		connector2 = new Connector('2');
		connector1.connectTo(connector2);
		connector2.connectTo(connector1);
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
		}, 'channel2.isConnected to be true');
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
		}, 'channel1.isConnected to be true');
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
		}, 'channel1.isConnected to be true');
		runs(function() {
			expect(channel1.rtcConnected).toEqual(true);
			
			channel1.close();
			channel2.close();
		});
	});
	
	it('should not use RTCPeerConnection if disabled on caller side', function() {
		var channel1 = new PeerChannel(connector1);
		var channel2 = new PeerChannel(connector2);
		channel1.name = '1'; channel2.name = '2';
		channel1.disableRTC = true;
		channel1.connect();
		waitsFor(function() {
			return channel1.isConnected && channel2.isConnected;
		}, 'both channels to be connected');
		runs(function() {
			expect(channel1.rtcConnected).toEqual(false);
		});
	});
	
	it('should not use RTCPeerConnection if disabled on callee side', function() {
		var channel1 = new PeerChannel(connector1);
		var channel2 = new PeerChannel(connector2);
		channel1.name = 'a1'; channel2.name = 'a2';
		channel2.disableRTC = true;
		channel1.connect();
		waitsFor(function() {
			return channel1.isConnected && channel2.isConnected;
		}, 'both channels to be connected');
		runs(function() {
			expect(channel1.rtcConnected).toEqual(false);
		});
	});
	
	it('should send and receive', function() {
		var isCalled = false;
		var receivedData = null;
		var sentData = { param: 'theData', boolean: true, number: 12.4};
		runs(function() {
			var channel1 = new PeerChannel(connector1);
			var channel2 = new PeerChannel(connector2);
			channel1.name = '1'; channel2.name = '2';
			channel1.connect();
			$(channel2).on('theevent', function(e, data) { isCalled = true; receivedData = data; });
			channel1.send('theevent', sentData);
		});
		
		waitsFor(function() { return isCalled;}, "The event listener to be called");
		
		runs(function() {
			expect(receivedData).toEqual(sentData);
		});
	});
	
	it('should send and receive before connection is established', function() {
		var isCalled = false;
		var receivedData = null;
		var sentData = { param: 'theData', boolean: true, number: 12.4};
		runs(function() {
			var channel1 = new PeerChannel(connector1);
			var channel2 = new PeerChannel(connector2);
			channel1.name = '1'; channel2.name = '2';
			$(channel2).on('theevent', function(e, data) { isCalled = true; receivedData = data; });
			channel1.send('theevent', sentData);
		});
		
		waitsFor(function() { return isCalled;}, "The event listener to be called");
		
		runs(function() {
			expect(receivedData).toEqual(sentData);
		});
	});
	
	it('should send and receive volatile messages before connection is established', function() {
		var isCalled = false;
		var receivedData = null;
		var sentData = { param: 'theData', boolean: true, number: 12.4};
		runs(function() {
			var channel1 = new PeerChannel(connector1);
			var channel2 = new PeerChannel(connector2);
			channel1.name = '1'; channel2.name = '2';
			$(channel2).on('theevent', function(e, data) { isCalled = true; receivedData = data; });
			channel1.sendVolatile('theevent', sentData);
		});
		
		waitsFor(function() { return isCalled;}, "The event listener to be called");
		
		runs(function() {
			expect(receivedData).toEqual(sentData);
		});
	});
	
	it('should send and receive messages without RTC', function() {
		var isCalled = false;
		var receivedData = null;
		var sentData = { param: 'theData', boolean: true, number: 12.4};
		runs(function() {
			var channel1 = new PeerChannel(connector1);
			var channel2 = new PeerChannel(connector2);
			channel1.name = '1'; channel2.name = '2';
			channel1.disableRTC = true;
			channel1.connect();
			$(channel2).on('theevent', function(e, data) { isCalled = true; receivedData = data; });
			channel1.sendVolatile('theevent', sentData);
		});
		
		waitsFor(function() { return isCalled;}, "The event listener to be called");
		
		runs(function() {
			expect(receivedData).toEqual(sentData);
		});
	});
	
	it('send and receive volatile messages over RTC', function() {
		var isCalled = false;
		var receivedData = null;
		var channel1 = null;
		var channel2 = null;
		var sentData = { param: 'theData', boolean: true, number: 12.4};
		runs(function() {
			channel1 = new PeerChannel(connector1);
			channel2 = new PeerChannel(connector2);
			channel1.name = '1'; channel2.name = '2';
			channel1.connect();
			$(channel2).on('theevent', function(e, data) { isCalled = true; receivedData = data; });
		});
		
		waitsFor(function() { return channel1.isConnected && channel2.isConnected;},
				"both channels to be connected");
		
		runs(function() {
			channel1.sendVolatile('theevent', sentData);
		});
		
		waitsFor(function() { return isCalled;}, "The event listener to be called");
		
		runs(function() {
			expect(receivedData).toEqual(sentData);
		});
	});
});
