(function() {
	window.Game = null;
	
	var NETWORK_UPDATE_INTERVAL = 0.1;
	
	/**
	 * @constructor Creates the game logic
	 */
	Game = function() {
		this.resetWorld();
		this.channel = null;
		this.timeToNetworkUpdate = 0;
	};
	
	Game.prototype = {
		resetWorld: function() {
			this.world = new World();
		},
		
		setChannel: function(channel) {
			this.channel = channel;
			var self = this;
			if (channel != null) {
				$(channel).on('update', function(e, data) {
					self.world.opposingPaddle.position[0] = -data.paddle.position[0];
					self.world.opposingPaddle.position[1] = data.paddle.position[1];
					// Only download ball position if it's not my turn
					if (self.world.ball.position[2] < 0) {
						self.world.ball.position = vec3.negate(data.ball.position, data.ball.position);
						self.world.ball.speed = vec3.negate(data.ball.speed, data.ball.speed);
						self.world.ball.spin = vec3.negate(data.ball.spin, data.ball.spin);
						self.world.ball.rotation = vec3.negate(data.ball.rotation, data.ball.rotation);
					}
				});
			}
		},
			
		/**
		 * Processes one step in game logic
		 * 
		 * Applies input and updates camera and world.
		 * 
		 * @param elapsed time in milliseconds since last call of update()
		 * @param {Input} input information about pressed keys etc.
		 */
		update: function(elapsed, input) {
			this.applyInput(elapsed, input);
			this.world.update(elapsed);
			
			if (this.channel != null) {
				this.timeToNetworkUpdate -= elapsed;
				if (this.timeToNetworkUpdate < 0) {
					this.channel.send('update', {
						paddle: {position: this.world.paddle.position},
						ball: {
							position: this.world.ball.position,
							speed: this.world.ball.speed,
							spin: this.world.ball.spin,
							rotation: this.world.ball.rotation,
						}});
					this.timeToNetworkUpdate = NETWORK_UPDATE_INTERVAL;
				}
			}
		},
		
		/**
		 * Checks the pressed keys and does their actions, e.g. moves the player
		 * 
		 * @param elapsed time in milliseconds since last call
		 * @param {Input} input information about pressed keys
		 */
		applyInput: function(elapsed, input) {
			var pos = this.world.camera.screenToWorldPoint(input.cursor, this.world.length / 2);
			this.world.paddle.position = pos;
			
			if (this.world.ball.freezed) {
				// can we start the ball?
				if (input.mouse.left && this.world.paddle.touchesBall(this.world.ball)) {
					this.world.ball.start();
				}
			}
		}
	};
})();