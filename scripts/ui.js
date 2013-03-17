"use strict";

(function() {
	var controller = new Network();
	
	$(function() {
		$('#login').click(login);
		$('#logout').click(logout);
		$('#user').val('Curver' + Math.floor(Math.random() * 900 + 100));
		$('#reset').click(function() {
			game.resetWorld();
		});
		$('#fullscreen').click(fullscreen);
		document.addEventListener('mozfullscreenchange', fullscreenchange, false);
		document.addEventListener('webkitfullscreenchange', fullscreenchange, false);
		document.addEventListener('fullscreenchange', fullscreenchange, false);
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
				if (!controller.channel || controller.channel.contact != contact)
					$('#network-status').text('Connecting with ' + contact + '...');
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
		$('#network-status').text('Accepted request from ' + call.caller);
	});
	
	$(controller).on('channel', function(e, channel) {
		if (controller.channel)
			$('#network-status').text('Now playing with ' + controller.channel.contact);
	});	
	
	$(controller).on('reject', function(e, data) {
		$('#network-status').text('Connection rejected by ' + data.contact + ' (reason: ' + data.reason + ')');
	});	
	
	$(controller).on('remoteclosed', function(e, data) {
		$('#network-status').text('Connection closed by remote player');
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
	
	function fullscreen() {
    	$('body').addClass('fullscreen');
    	var elem = $('#canvas')[0];
        if (elem.requestFullscreen) {
        	elem.requestFullscreen();
        }
        else if (elem.mozRequestFullScreen) {
        	elem.mozRequestFullScreen();
        }
        else if (elem.webkitRequestFullScreen) {
        	elem.webkitRequestFullScreen();
        }
	}
	
    function fullscreenchange() {
    	var elem = $('#canvas')[0];
    	if (document.mozFullscreenElement || document.webkitFullscreenElement || document.fullscreenElement) {
    	    elem.requestPointerLock = elem.requestPointerLock    ||
    	                              elem.mozRequestPointerLock ||
    	                              elem.webkitRequestPointerLock;
    	    elem.requestPointerLock();
    	} else {
	    	$('body').removeClass('fullscreen');
    	}
    }
})();