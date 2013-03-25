(function() {
	"use strict";
	
	var SPEED = 15;
	var SPEED_INCREASE = 0.2; // m/s per played second
	
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
		this.frozen = true;
		
		this.spin = [0,0,0];
	};
	
	$.extend(Ball.prototype, Entity.prototype, {
		update: function(elapsed) {
			if (this.frozen) {
				this.resetIn -= elapsed;
				if (this.resetIn < 0)
					this.reset();
			}
			
			if (!this.frozen) {
				// spin to rotation
				var rotationDiff = vec3.scale(vec3.create(), this.spin, elapsed);
				vec3.add(this.rotation, this.rotation, rotationDiff);
				
				// spin to speed
				var offset = vec3.scale(vec3.create(), this.spin, elapsed);
				vec3.add(this.speed, this.speed, offset);
				
				offset = vec3.scale(vec3.create(), this.speed, elapsed);
				vec3.add(this.position, this.position, offset);
				
				// Increase speed by time
				var currentSpeed = vec3.length(this.speed);
				var targetSpeed = currentSpeed + SPEED_INCREASE * elapsed;
				if (currentSpeed > 0)
					vec3.scale(this.speed, this.speed, targetSpeed / currentSpeed);
				
				for (var axis = 0; axis < 3; axis++) {
					if (this.position[axis] - this.radius < this.world.min[axis]) {
						this.position[axis] = this.world.min[axis] + this.radius;
					} else if (this.position[axis] + this.radius > this.world.max[axis]) {
						// front
						if (axis == 2) {
							if (this.world.paddle.touchesBall(this)) {
								// apply spin
								this.getSpinFromPaddle();
							} else {
								this.stop();
							}
						}
						this.position[axis] = this.world.max[axis] - this.radius;
					} else
						continue;
					
					this.speed[axis] *= -1;
					if (axis == 2)
						resources.sounds.paddle.play();
					else 
						resources.sounds.wall2.play();
				}
			}
		},
		
		reset: function() {
			this.speed = [0,0,0];
			this.frozen = true;
			this.position = [0,0,this.world.max[2] - this.radius];
			this.mesh.surfaces[0].material = resources.materials.green;	
		},
		
		stop: function() {
			this.speed = [0,0,0];
			this.spin = [0,0,0];
			this.frozen = true;
			this.resetIn = 1.5;
			this.mesh.surfaces[0].material = resources.materials.red;
		},
		
		start: function() {
			this.speed = [0,0,-SPEED];
			this.frozen = false;
			this.mesh.surfaces[0].material = resources.materials.green;
			this.getSpinFromPaddle();
		},
		
		getSpinFromPaddle: function() {
			vec3.add(this.spin, this.spin, vec3.scale(vec3.create(), this.world.paddle.speed, 1));
		}
	});
})();
