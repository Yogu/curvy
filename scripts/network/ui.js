"use strict";

(function() {
	var controller = new Network();
	
	$(function() {
		$('#login').click(login);
		$('#logout').click(logout);
		$('#user').val('Curver' + Math.floor(Math.random() * 900 + 100));
	});
	
	$(controller).on('contacts', function() {
		$('#contacts').empty();
		$(controller.contacts).each(function() {
			var contact = this;
				$('<a>').attr('href', 'call').text(contact).click(callThis).appendTo($('<li>').
						appendTo($('#contacts')));
			function callThis(e) {
				e.preventDefault();
				controller.call(contact);
			}
		});
		if (controller.contacts.length == 0)
			$('#no-contacts').show();
		else
			$('#no-contacts').hide();
		$('#contacts-box').show();
	});
	
	$(controller).on('logout', function() {
		$('#logout').attr('disabled', 'disabled');
		$('#login, #user').removeAttr('disabled');
		$('#network-status').text('You are logged out.');
		$('#contacts-box').hide();
	});
	
	$(controller).on('call', function(e, call) {
		console.log(call);
		call.accept();
	});
	
	function login() {
		controller.login($('#user').val(),
			function() {
				$('#network-status').text('You are now logged in.');
			},
			function() {
				// Name not available
				logout();
				$('#network-status').text('This name is not available. Please choose a different one.');
			});

		$('#logout').removeAttr('disabled');
		$('#login, #user').attr('disabled', 'disabled');
		$('#network-status').text('Logging in...');
	}
	
	function logout() {
		controller.logout();
	}
})();