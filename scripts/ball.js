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
		this.freezed = true;
	};
	
	$.extend(Ball.prototype, Entity.prototype, {
		update: function(elapsed) {
			if (this.freezed) {
				this.resetIn -= elapsed;
				if (this.resetIn < 0)
					this.reset();
			}
			
			var offset = vec3.scale(vec3.create(), this.speed, elapsed);
			vec3.add(this.position, this.position, offset);
			
			for (var axis = 0; axis < 3; axis++) {
				if (this.position[axis] - this.radius < this.world.min[axis]) {
					this.position[axis] = this.world.min[axis] + this.radius;
				} else if (this.position[axis] + this.radius > this.world.max[axis]) {
					// front
					if (axis == 2) {
						if (!this.world.paddle.touchesBall(this))
							this.stop();
					}
					this.position[axis] = this.world.max[axis] - this.radius;
				} else
					continue;
				
				this.speed[axis] *= -1.01;
			}
		},
		
		reset: function() {
			this.stop();
			this.position = [0,0,this.world.length / 2 - this.radius];
		},
		
		stop: function() {
			this.speed = [0,0,0];
			this.freezed = true;
			this.resetIn = 3;
		},
		
		start: function() {
			var speedFactor = 0.5;
			this.speed = [Math.random() * 2 - 4,Math.random() * 3 - 6,-speedFactor * 30];
			this.freezed = false;
		}
	});
})();
