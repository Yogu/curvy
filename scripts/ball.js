(function() {
	"use strict";
	
	self.Ball = null;
	/**
	 * @constructor
	 */
	Ball = function(world, radius) {
		Entity.call(this, world);
		
		this.world = world;
		this.radius = radius;
		this.mesh = resources.models.sphere.createMesh();
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
			
			if (!this.freezed) {
				for (var axis = 0; axis < 3; axis++) {
					if (this.position[axis] - this.radius < this.world.min[axis]) {
						this.position[axis] = this.world.min[axis] + this.radius;
					} else if (this.position[axis] + this.radius > this.world.max[axis]) {
						// front
						if (axis == 2) {
							if (!this.world.paddle.touchesBall(this)) {
								this.stop();
							}
						}
						this.position[axis] = this.world.max[axis] - this.radius;
					} else
						continue;
					
					this.speed[axis] *= -1.01;
				}
			}
		},
		
		reset: function() {
			this.speed = [0,0,0];
			this.freezed = true;
			this.position = [0,0,this.world.max[2] - this.radius];
			this.mesh.surfaces[0].material = resources.materials.green;	
		},
		
		stop: function() {
			this.speed = [0,0,0];
			this.freezed = true;
			this.resetIn = 3;
			this.mesh.surfaces[0].material = resources.materials.red;
		},
		
		start: function() {
			var speedFactor = 0.5;
			this.speed = [Math.random() * 2 - 4,Math.random() * 3 - 6,-speedFactor * 30];
			this.freezed = false;
			this.mesh.surfaces[0].material = resources.materials.green;
		}
	});
})();
