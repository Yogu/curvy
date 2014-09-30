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
			var self = this;
			this.world = new World();
			$(this.world.ball).on('lost', function() {
				if (self.channel != null) {
					self.channel.send('lost');
				}
				console.log('player lost ball');
				self.opponentScore++;
				$(self).triggerHandler('score');
			});

			this.resetScore();
		},
		
		resetScore: function() {
			this.ownScore = 0;
			this.opponentScore = 0;
			$(this).triggerHandler('score');
		},
		
		setChannel: function(channel) {
			if (channel != this.channel) {
				this.channel = channel;
				var self = this;
				this.resetWorld();
				this.resetScore();
				
				if (channel != null) {
					var turning = vec3.fromValues(-1, 1, -1);
					
					if (channel.isCaller)
						vec3.multiply(self.world.ball.position, self.world.ball.position, turning);
					
					$(channel).on('u', function(e, data) {
						var i = 0;
						self.world.opposingPaddle.position[0] = -data[i++];
						self.world.opposingPaddle.position[1] = data[i++];
						// Only download ball position if it's not my turn
						if (self.world.ball.position[2] < 0) {
							self.world.ball.position = vec3.multiply(vec3.create(),
									vec3.fromValues(data[i++], data[i++], data[i++]), turning);
							self.world.ball.speed = vec3.multiply(vec3.create(),
									vec3.fromValues(data[i++], data[i++], data[i++]), turning);
							self.world.ball.spin = vec3.multiply(vec3.create(),
									vec3.fromValues(data[i++], data[i++], data[i++]), turning);
							self.world.ball.rotation = vec3.multiply(vec3.create(),
									vec3.fromValues(data[i++], data[i++], data[i++]), turning);
							self.world.ball.frozen = !!data[i++];
						}
					});
					$(channel).on('lost', function(e, data) {
						console.log('opponent lost ball');
						self.world.ball.stop();
						self.ownScore++;
						$(self).triggerHandler('score');
					});
				}
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
					// Compress this for better performance and to circumvent rate limit
					var data = new Float32Array([
						this.world.paddle.position[0],
						this.world.paddle.position[1],
						this.world.ball.position[0],
						this.world.ball.position[1],
						this.world.ball.position[2],
						this.world.ball.speed[0],
						this.world.ball.speed[1],
						this.world.ball.speed[2],
						this.world.ball.spin[0],
						this.world.ball.spin[1],
						this.world.ball.spin[2],
						this.world.ball.rotation[0],
						this.world.ball.rotation[1],
						this.world.ball.rotation[2],
						this.world.ball.frozen ? 1 : 0
					]);
					this.channel.sendVolatile('u', data);
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
			if (input.mouse.left) {
				if (this.world.ball.readyToStart && this.world.ball.position[2] > 0) {
					if (this.world.paddle.touchesBall(this.world.ball)) {
						// don't allow to press mouse and then move onto ball
						if (!this.mousePressedOutsideBall)
							this.world.ball.start();
					} else
						this.mousePressedOutsideBall = true;
				}
			} else
				this.mousePressedOutsideBall = false;
		}
	};
})();