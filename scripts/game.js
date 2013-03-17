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
			self.resetWorld();
			if (channel != null) {
				var turning = vec3.fromValues(-1, 1, -1);
				
				if (channel.isCaller)
					vec3.multiply(self.world.ball.position, self.world.ball.position, turning);
				
				$(channel).on('update', function(e, data) {
					self.world.opposingPaddle.position[0] = -data.paddle.position[0];
					self.world.opposingPaddle.position[1] = data.paddle.position[1];
					// Only download ball position if it's not my turn
					if (self.world.ball.position[2] < 0) {
						self.world.ball.position = vec3.multiply(data.ball.position, data.ball.position, turning);
						self.world.ball.speed = vec3.multiply(data.ball.speed, data.ball.speed, turning);
						self.world.ball.spin = vec3.multiply(data.ball.spin, data.ball.spin, turning);
						self.world.ball.rotation = vec3.multiply(data.ball.rotation, data.ball.rotation, turning);
						self.world.ball.frozen = data.ball.frozen;
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
							frozen: this.world.ball.frozen
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
			// width / height of accessible space
			var width = this.world.width - this.world.paddle.width;
			var height = this.world.height - this.world.paddle.height;
			var length = this.world.length;
			
			// corners of accessible space
			var min = [-width/2, -height/2, length / 2];
			var max = [width/2, height/2, length / 2];
			var min = this.world.camera.worldToScreenPoint(min);
			var max = this.world.camera.worldToScreenPoint(max);
			var minX = min[0], minY = min[1], maxX = max[0], maxY = max[1];
			
			// adjust cursor into accessible space and let go from
			var x = input.cursor[0], y = input.cursor[1];
			var x = Math.min(maxX, Math.max(minX, x));
			var y = Math.min(maxY, Math.max(minY, y));
			
			// Adjust cursor (only works in fullscreen mode)
			input.cursor = [x,y];
			
			// x/y -> 0..1
			var x = (x - minX) / (maxX - minX);
			var y = (y - minY) / (maxY - minY);
			
			// x/y -> world coordinates
			var x = (x - 0.5) * width;
			var y = -(y - 0.5) * height;
			this.world.paddle.position = [x,y,length / 2];
			
			// start ball if it's frozen on my side
			if (this.world.ball.frozen && this.world.ball.position[2] > 0) {
				// can we start the ball?
				if (input.mouse.left && this.world.paddle.touchesBall(this.world.ball)) {
					this.world.ball.start();
				}
			}
		}
	};
})();