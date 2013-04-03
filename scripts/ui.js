"use strict";

(function() {
	var controller = new ServerConnection();
	
	$(function() {
		$('#login-box').show();
		$('#button-box').show();
		
		$('#login').click(login);
		$('#logout').click(logout);
		$('#user').val('Curver' + Math.floor(Math.random() * 900 + 100));
		$('#reset').click(function() {
			game.resetWorld();
		});
		$('#fullscreen').click(fullscreen);
		$('#singleplayer').click(enterSingleplayerMode);
		document.addEventListener('mozfullscreenchange', fullscreenchange, false);
		document.addEventListener('webkitfullscreenchange', fullscreenchange, false);
		document.addEventListener('fullscreenchange', fullscreenchange, false);
	});
	
	$(controller).on('players', function() {
		$('#contacts').empty();
		$(controller.players).each(function() {
			var contact = this.name;
			var a = $('<a>').attr('href', 'call').text(contact).click(callThis);
			var li = $('<li>').appendTo($('#contacts')).data('contact', contact);
			a.appendTo(li);;
			li.toggleClass('active', contact == controller.name);
			li.toggleClass('busy', contact != controller.name && this.state == 'busy');
			function callThis(e) {
				e.preventDefault();
				controller.call(contact);
			}
		});
		if (controller.players.length == 0)
			$('#no-contacts').show();
		else
			$('#no-contacts').hide();
		$('#contacts-box').show();
	});
	
	function updateState() {
		switch(controller.state) {
		case 'connected':
			$('#login, #user').attr('disabled', 'disabled');
			$('#logout').removeAttr('disabled');
			$('#contacts-box').show();

			switch (controller.playerState) {
			case 'idle':
				$('#network-status').text('Click on a player to connect');
				game.setChannel(null);
				break;
			case 'calling':
				$('#network-status').text('Connecting with ' + controller.peer);
				game.setChannel(null);
				break;
			case 'busy':
				$('#network-status').text('Playing with ' + controller.peer);
				enablePeerPing();
				game.setChannel(controller.peerChannel);
				break;
			}

			$('#contacts li').each(function() {
				$(this).toggleClass('active', controller.peer == $(this).data('contact'));
			});
			break;
		case 'connecting':
			$('#login, #user').attr('disabled', 'disabled');
			$('#logout').removeAttr('disabled');
			$('#network-status').text('Connecting...');
			$('#contacts-box').hide();
			break;
		default:
			switch (controller.state) {
			case 'disconnected':
				$('#network-status').text('Enter your name and log in');
				break;
			case 'name_not_available':
				$('#network-status').text('Sorry, name not available. Please choose a different one.');
				break;
			default:
				$('#network-status').text('Connection failed');
				break;
			}
			$('#logout').attr('disabled', 'disabled');
			$('#login, #user').removeAttr('disabled');
			$('#contacts-box').hide();
		}
	}
	
	$(controller).on('statechange', updateState);
	$(controller).on('playerstatechange', updateState);
	updateState();
	
	$(controller).on('call', function(e, call) {
		console.log(call);
		showIncomingCall(call);
	});
	
	// Ping
	setInterval(function() {
		if (controller.isConnected)
			controller.doPing(); 
	}, 1000);
	$(controller).on('ping', function(e, pingTime) {
		$('#server-ping').text('Server Ping: ' + pingTime + 'ms');
	});
	
	// Score
	$(document).on('game', function() {
		$(game).on('score', function() {
			$('#score').text(game.ownScore + ' : ' + game.opponentScore);
		});
	});
	
	function login() {
		controller.login($('#user').val());
	}
	
	function logout() {
		controller.close();
	}
	
	function fullscreen() {
    	$('body').addClass('fullscreen');
    	var elem = $('#canvas-wrap')[0];
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
	
	function peerPingReceived(e, pingTime) {
		$('#peer-ping').text('Peer Ping: ' + pingTime + 'ms');
	}
	
	function enablePeerPing() {
		$(controller.peerChannel).off('ping', peerPingReceived).on('ping', peerPingReceived);
		var ping = null;
		ping = function() {
			if (controller.peerChannel) {
				controller.peerChannel.doPing();
				setTimeout(ping, 1000);
			}
		};
		setTimeout(ping, 0);
	}
	
	// request pointer lock if lost focus and regained
	document.addEventListener('click', fullscreenchange);
	
    function fullscreenchange() {
    	var elem = $('#canvas-wrap')[0];
    	if (document.mozFullscreenElement || document.webkitFullscreenElement || document.fullscreenElement) {
    	    elem.requestPointerLock = elem.requestPointerLock    ||
    	                              elem.mozRequestPointerLock ||
    	                              elem.webkitRequestPointerLock;
    	    elem.requestPointerLock();
    	} else {
	    	$('body').removeClass('fullscreen');
    	}
    }
    
    function enterSingleplayerMode() {
    	if (controller.isConnected)
    		controller.hangup();
    }
    
    function showIncomingCall(call) {
    	var div = $('<div>');
    	$('<span>').appendTo(div).addClass('title').text(call.sender + ' wants to play with you');
    	var accept = $('<button>').appendTo(div).addClass('accept').text('Accept');
    	var reject = $('<button>').appendTo(div).addClass('accept').text('Reject');
    	accept.click(function() {
    		call.accept();
    		div.remove();
    	});
    	reject.click(function() {
    		call.reject();
    		div.remove();
    	});
    	$('#incoming-calls').append(div);
    }
})();