(function() {
	"use strict";
	
	self.Ball = null;
	/**
	 * @constructor
	 */
	Ball = function(world) {
		Entity.call(this, world);
		
		this.world = world;
		this.radius = 0.5;
		this.mesh = resources.models.sphere.mesh;
		this.mesh.corrections = {
				scale: [this.radius, this.radius, this.radius]
			};
		this.reset();
	};
	
	$.extend(Ball.prototype, Entity.prototype, {
		update: function(elapsed) {
			var offset = vec3.scale(vec3.create(), this.speed, elapsed);
			vec3.add(this.position, this.position, offset);
			
			for (var axis = 0; axis < 3; axis++) {
				if (this.position[axis] - this.radius < this.world.min[axis]) {
					this.position[axis] = this.world.min[axis] + this.radius;
				} else if (this.position[axis] + this.radius > this.world.max[axis]) {
					// front
					if (axis == 2) {
						var paddle = this.world.paddle.getRect();
						if (this.position[0] - this.radius >= paddle.right ||
							this.position[0] + this.radius <= paddle.left ||
							this.position[1] - this.radius >= paddle.top ||
							this.position[1] + this.radius <= paddle.bottom) {
							this.reset();
						}
					}
					this.position[axis] = this.world.max[axis] - this.radius;
				} else
					continue;
				
				this.speed[axis] *= -1.01;
			}
		},
		
		reset: function() {
			this.speed = [Math.random() * 5 - 10,Math.random() * 7 - 14,-10];
			this.position = [0,0,0];
		}
	});
})();
