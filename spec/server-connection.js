describe('ServerConnection', function() {
	var uniqueUserName = null;
	
	beforeEach(function() {
		ServerConnection.WEBSOCKET_URL = 'http://localhost:8888';	
		uniqueUserName = 'user' + Math.floor(Math.random() * 10000);
	});
	
	it('should be connecting after creation', function() {
		var connection = new ServerConnection('user');
		expect(connection.state).toEqual('connecting');
		expect(connection.isConnected).toEqual(false);
		
		connection.close();
	});
	
	it('should connect', function() {
		var connection = new ServerConnection(uniqueUserName);
		
		waitsFor(function() {
			return connection.isConnected;
		}, 'isConnected to be true');
		runs(function() {
			expect(connection.state).toEqual('connected');
			
			connection.close();
		});
	});
	
	it('should not connect if user name is not available', function() {
		var connection1 = new ServerConnection(uniqueUserName);
		var connection2 = null;
		
		waitsFor(function() {
			return connection1.isConnected;
		}, 'first connection to be established');
		
		runs(function() {
			connection2 = new ServerConnection(uniqueUserName);
		});
		
		waitsFor(function() {
			return connection2.state != 'connecting';
		}, 'state not to equal connecting');
		runs(function() {
			expect(connection2.state).toEqual('name_not_available');

			connection1.close();
			connection2.close();
		});
	});
	
	it('should receive contact list', function() {
		var connection = new ServerConnection(uniqueUserName);
		var contactsReceived = false;
		
		$(connection).on('contacts', function(e, contacts) {
			contactsReceived = true;
		});
		
		waitsFor(function() {
			return contactsReceived;
		}, 'contacts event to be fired');
		
		runs(function() {
			expect(connection.contacts.length).not.toBeLessThan(1);

			connection.close();
		});
	});
});
