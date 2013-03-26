var contacts = {};
var clients = [];

function accept(client) {
	var query = client.request.resourceURL.query;
	if (!query.user) {
		client.send('error', {message: 'specify user name'});
		client.close();
		return;
	}
	
	var name = query.user;
	var contact = addContact(name);
	if (!contact) {
		client.send('name_not_available');
		client.close();
		return;
	}
	
	client.send('accepted');
	client.contact = contact;
	contact.client = client;
	clients.push(client);
	sendContacts(client);
	console.log(contact.name + ' logged in');
	
	client.on('message', function(type, data) {
		switch (type) {
		case 'call':
		case 'accept':
		case 'reject':
		case 'candidate':
		case 'close':
		case 'data':
			if (data.contact && data.contact in contacts) {
				var contact = contacts[data.contact];
				var client = contact.client;
				console.log(type + ' from ' + name + ' to ' + data.contact);
				data.contact = name; // was recipient, becomes sender in the answer
				client.send(type, data);
			} else
				console.log('invalid call/accept/reject/candidate/close/data message');
			break;
		default:
			console.log('invalid message type: ' + type);
		}
	});

	client.on('close', function() {
		var index = clients.indexOf(client);
		if (index >= 0)
			clients.slice(index, 1);
		removeContact(contact);
		console.log(contact.name + ' logged out');
	});
};

function sendContacts(client) {
	client.send('contacts', Object.keys(contacts));
}

function sendContactsToAllClients() {
	for (var i = 0; i < clients.length; i++) {
		sendContacts(clients[i]);
	}
}

function addContact(name) {
	if (name in contacts)
		return false;
	else {
		var contact = {name: name};
		contacts[name] = contact;
		sendContactsToAllClients();
		return contact;
	}
}

function removeContact(contact) {
	if (contact.name in contacts) {
		delete contacts[contact.name];
		sendContactsToAllClients();
	}
}

exports.accept = accept;