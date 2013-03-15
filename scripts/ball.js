(function() {
	"use strict";
	
	self.Ball = null;
	/**
	 * @constructor
	 */
	Ball = function(world) {
		Entity.call(this, world);
		
		this.world = world;
		this.radius = 1;
		this.mesh = resources.models.sphere.mesh;
		this.speed = [3,5,-10];
		this.position = [0,0,0];
	};
	
	$.extend(Ball.prototype, Entity.prototype, {
		update: function(elapsed) {
			var offset = vec3.scale(vec3.create(), this.speed, elapsed);
			vec3.add(this.position, this.position, offset);
			
			for (var axis = 0; axis < 3; axis++) {
				if (this.position[axis] - this.radius < this.world.min[axis]) {
					this.position[axis] = this.world.min[axis] + this.radius;
				} else if (this.position[axis] + this.radius > this.world.max[axis]) {
					this.position[axis] = this.world.max[axis] - this.radius;
				} else
					continue;
				
				this.speed[axis] *= -1;
			}
		}
	});
})();
