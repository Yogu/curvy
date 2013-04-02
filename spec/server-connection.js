describe('ServerConnection', function() {
	var uniqueUserName = null;
	
	beforeEach(function() {
		uniqueUserName = 'user' + Math.floor(Math.random() * 10000);
	});
	
	it('should be disconnected after creation', function() {
		var connection = new ServerConnection('user');
		expect(connection.state).toEqual('disconnected');
		expect(connection.isConnected).toEqual(false);
	});
	
	it('should be connecting after conect()', function() {
		var connection = new ServerConnection('user');
		connection.connect();
		expect(connection.state).toEqual('connecting');
		expect(connection.isConnected).toEqual(false);
	});
	
	it('should connect', function() {
		var connection = new ServerConnection(uniqueUserName);
		connection.connect();
		
		waitsFor(function() {
			return connection.isConnected;
		}, 'isConnected to be true');
		runs(function() {
			expect(connection.state).toEqual('connected');
		});
	});
	
	it('should not connect if user name is not available', function() {
		var connection1 = new ServerConnection(uniqueUserName);
		connection1.connect();
		var connection2 = new ServerConnection(uniqueUserName);
		connection2.connect();
		
		waitsFor(function() {
			return connection.state != 'connecting';
		}, 'state not to equal connecting');
		runs(function() {
			expect(connection.state).toEqual('name_not_available');
		});
	});
	
	it('should receive contact list', function() {
		var connection = new ServerConnection(uniqueUserName);
		connection.connect();
		var contactsReceived = false;
		var receivedContacts = null;
		
		$(connection).on('contacts', function(e, contacts) {
			contactsReceived = true;
			receivedContacts = contacts;
		});
		
		waitsFor(function() {
			return contactsReceived;
		}, 'contacts event to be fired');
		runs(function() {
			expect(typeof(receivedContacts)).toEqual('Array');
		});
	});
});
