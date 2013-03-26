(function() {
	"use strict";
	
	var PHYSICAL_SIZE_FACTOR = 1.1;
	var WIDTH = 3;
	var HEIGHT = WIDTH * 0.6;
	
	self.Paddle = null;
	/**
	 * @constructor
	 */
	Paddle = function(world) {
		Entity.call(this, world);
		
		this.world = world;
		this.mesh = resources.models.paddle.createMesh();
		this.width = WIDTH * PHYSICAL_SIZE_FACTOR;
		this.height = HEIGHT * PHYSICAL_SIZE_FACTOR;
		this.mesh.corrections = {
			scale: [WIDTH / 2, HEIGHT / 2, 1]
		};
		this.lastPosition = null;
		this.speed = [0,0,0];
	};
	
	$.extend(Paddle.prototype, Entity.prototype, {
		update: function(elapsed) {
			if (this.lastPosition !== null) {
				var newSpeed = [
				                (this.lastPosition[0] - this.position[0]) / elapsed,
				                (this.lastPosition[1] - this.position[1]) / elapsed];
				this.speed[0] += (newSpeed[0] - this.speed[0]) * 0.5;
				this.speed[1] += (newSpeed[1] - this.speed[1]) * 0.5;
			}
			this.lastPosition = vec3.clone(this.position);
		},
		
		getRect: function() {
			return {
				left: this.position[0] - this.width / 2,
				right: this.position[0] + this.width / 2,
				bottom: this.position[1] - this.height / 2,
				top: this.position[1] + this.height / 2
			};
		},
		
		touchesBall: function(ball) {
			var rect = this.getRect();
			return ball.position[0] - ball.radius <= rect.right &&
					ball.position[0] + ball.radius >= rect.left &&
					ball.position[1] - ball.radius <= rect.top &&
					ball.position[1] + ball.radius >= rect.bottom;
		}
	});
})();
