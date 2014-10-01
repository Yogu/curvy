function StartScreen(context) {
	this.context = context;
	var self = this;
	$(function() {
		self._init();
	});
	$(this).on('show', function() {
		//self._show();
	});
	this.controller = new ServerConnection();
}

StartScreen.prototype =  {
	id: 'start',
	
	_init: function() {
		var self = this;
		var controller = this.controller;
		
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

		$(controller).on('players', function() {
			self._updatePlayers();
		});
		
		$(controller).on('statechange', function() { self._updateState();});
		$(controller).on('playerstatechange', function() { self._updateState();});
		this._updateState();
		
		$(controller).on('call', function(e, call) {
			console.log(call);
			self._showIncomingCall(call);
		});
		
		// Ping
		setInterval(function() {
			if (controller.isConnected)
				controller.doPing(); 
		}, 1000);
		$(controller).on('ping', function(e, pingTime) {
			$('#server-ping').text('Server Ping: ' + pingTime + 'ms');
		});
		
		$(controller).on('chat', function(e, data) {
			addToChat(data.message, data.sender);
		});
		
		$(controller).on('player-joined', function(e, data) {
			addToChat(data.player + ' joined');
		});
		
		$(controller).on('player-left', function(e, data) {
			addToChat(data.player + ' left');
		});
		
		$(controller).on('gameover', function(e, data) {
			addToChat(data.winner + ' beats ' + data.loser + ' by ' + data.winnerScore + ':' +
					data.loserScore);
		});
		
		function addToChat(message, user) {
			var date = new Date();
			var hours = date.getHours().toString();
			var minutes = date.getMinutes().toString();
			if (minutes.length == 1)
				minutes = '0' + minutes;
			var li = $('<li>').appendTo($('#chat-messages'));
			if (user)
				li.append($('<span>').addClass('user').text(user));
			li.append(
				$('<span>').addClass('message').text(message),
				$('<span>').addClass('time').text(hours + ':' + minutes));
			$('#chat-messages').scrollTop($('#chat-messages').height());
		}
		
		$('#chat-form').submit(function(e) {
			e.preventDefault();
			var message = $('#chat-input').val().trim();
			if (message)
				controller.sendChat(message);
			$('#chat-input').val('');
		});
		
		function login() {
			controller.login($('#user').val());
		}
		
		function logout() {
			controller.close();
		}
		
		function fullscreen() {
	    	$('body').addClass('fullscreen');
	    	var elem = $('#wrap')[0];
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
		
		// request pointer lock if lost focus and regained
		document.addEventListener('click', fullscreenchange);
		
	    function fullscreenchange() {
	    	var elem = $('#wrap')[0];
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
	    	self._startGame();
	    }
	},
	
	_updatePlayers: function() {
		var controller = this.controller;
		$('#contacts').empty();
		$(this.controller.players).each(function() {
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
		if (this.controller.players.length == 0)
			$('#no-contacts').show();
		else
			$('#no-contacts').hide();
		$('#contacts-box').show();
	},
	
	_updateState: function() {
		var controller = this.controller;
		var self = this;
		$('#multiplayer-stuff').toggle(this.controller.state == 'connected');
		switch(this.controller.state) {
		case 'connected':
			$('#login, #user').attr('disabled', 'disabled');
			$('#logout').removeAttr('disabled');
			$('#contacts-box').show();

			switch (this.controller.playerState) {
			case 'idle':
				$('#network-status').text('Click on a player to connect');
				break;
			case 'calling':
				$('#network-status').text('Connecting with ' + controller.peer);
				break;
			case 'busy':
				$('#network-status').text('Playing with ' + controller.peer);
				self._startGame();
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
			switch (this.controller.state) {
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
	},
    
    _showIncomingCall: function(call) {
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
    },
    
    _startGame: function() {
    	var game = new Game(this.controller.peerChannel);
    	if (this.controller.peerChannel)
    		game.endScore = 10; // play until someone reaches 10 points
    	var screen = new GameScreen(this.context, game, this.controller);
		this.control.showScreen(screen);
    }
};