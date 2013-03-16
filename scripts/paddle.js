(function() {
	"use strict";
	
	self.Paddle = null;
	/**
	 * @constructor
	 */
	Paddle = function(world) {
		Entity.call(this, world);
		
		this.world = world;
		this.mesh = resources.models.paddle.createMesh();
		this.width = 3;
		this.height = this.width * 0.6;
		this.mesh.corrections = {
			scale: [this.width / 2, this.height / 2, 1]
		};
	};
	
	$.extend(Paddle.prototype, Entity.prototype, {
		update: function(elapsed) {
			
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
