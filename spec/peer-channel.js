describe('PeerChannel', function() {
	var connector1;
	var connector2;
	
	beforeEach(function() {
		connector1 = {
			send: function(type, data) {
				$(connector2).triggerHandler(type, data);
			}
		};
		connector2 = {
			send: function(type, data) {
				$(connector1).triggerHandler(type, data);
			}
		};
	});
	
	it('should be connecting after creation', function() {
		var channel = new PeerChannel(connector1);
		expect(channel.state).toEqual('connecting');
		expect(channel.isConnected).toEqual(false);
	});
	
	it('should connect', function() {
		var channel1 = new PeerChannel(connector1);
		var channel2 = new PeerChannel(connector2);
		expect(channel1.state).toEqual('connected');
		expect(channel2.state).toEqual('connected');
		expect(channel1.isConnected).toEqual(true);
		expect(channel2.isConnected).toEqual(false);
	});
	
	it('should send and receive', function() {
		var isCalled = false;
		runs(function() {
			var channel1 = new PeerChannel(connector1);
			var channel2 = new PeerChannel(connector2);
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
			$(channel2).on('theevent', function(e, data) { isCalled = true; receivedData = data; });
			channel1.send('theevent');
		});
		
		waitsFor(function() { return isCalled;}, "The event listener should be called");
		
		runs(function() {
			expect(receivedData).toEqual(sentData);
		})
	});
});
