function GameScreen(context, game, controller) {
	this.context = context;
	this.game = game;
	this.controller = controller;
	var self = this;
	$(this).on('show', function() {
		self._start();
	});
	$(function() {
		$('#show-menu').click(function() {
			if (controller.isConnected)
				controller.hangup();
			$(self).triggerHandler('finish');
			$(controller).off('playerstatechange', onplayerstatechange);
		});
	});
	
	function onplayerstatechange() {
		if (controller.playerState == 'idle') {
			$(self).triggerHandler('finish');
			$(controller).off('playerstatechange', onplayerstatechange);
		}
	}
	
	$(controller).on('playerstatechange', onplayerstatechange);
}

GameScreen.prototype =  {
	id: 'game',
	
	_start: function() {
		window.game = this.game;
		$(document).triggerHandler('game');
		var self = this;
		
		this._lastTick = new Date().getTime();
		this._elapsedSum = 0;
		this._elapsedCount = 0;
		console.log('Render loop started');
		this._tick();

		// Score
		$(game).on('score', function() {
			$('#score').text(game.ownScore + ' : ' + game.opponentScore);
		});
		$('#score').text(game.ownScore + ' : ' + game.opponentScore);
		
		$(game).on('end', function() {
			if (self.controller.isConnected)
				self.controller.hangup();
		});
		
		function peerPingReceived(e, pingTime) {
			$('#peer-ping').text('Ping: ' + pingTime + 'ms');
		}
		
		if (game.channel) {
			$(game.channel).off('ping', peerPingReceived).on('ping', peerPingReceived);
			var ping = function() {
				if (game.channel) {
					game.channel.doPing();
					setTimeout(ping, 1000);
				}
			};
			setTimeout(ping, 0);
		}
	},
	
	_tick: function() {
		// TODO: improve the data flow
		this.game.world.camera.size = {width: canvas.width, height: canvas.height};
		
		// calculate FPS
		var elapsed = (new Date().getTime() - this._lastTick) / 1000;
		var cutElapsed = elapsed > 0.1 ? 0.1 : elapsed;
		this._lastTick = new Date().getTime();
		
		this.game.update(cutElapsed, this.context.input);
		this.context.renderer.renderWorld(this.game.world);
		
		var self = this;
		if (this.isVisible) {
			requestAnimFrame(function() {
				self._tick();
			}, this.context.canvas);
		}
		
		this._displayFPS(elapsed);
	},
	
	_displayFPS: function(elapsed) {
		this._elapsedSum += elapsed;
		this._elapsedCount++;
		if (this._elapsedSum >= 0.5) {
			var fps = (this._elapsedCount / this._elapsedSum).toFixed(1);
			$('#status').text(fps + ' FPS');
			this._elapsedSum = 0;
			this._elapsedCount = 0;
		}
	}
};
