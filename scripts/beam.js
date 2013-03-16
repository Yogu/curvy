(function() {
	"use strict";
	
	self.Beam = null;
	/**
	 * @constructor
	 */
	Beam = function(world, room, ball) {
		Entity.call(this, world);
		
		this.world = world;
		this.room = room;
		this.ball = ball;
		this.mesh = resources.models.beam.mesh;
		this.width = 0.1;
		var downscaling = 0.999;
		this.mesh.corrections = {
			scale: [room.width * downscaling, room.height * downscaling, this.width],
			offset: [-0.5, -0.5, -0.5]
		};
	};
	
	$.extend(Beam.prototype, Entity.prototype, {
		update: function(elapsed) {
			this.position[2] = this.ball.position[2];
		},
		
		getRect: function() {
			return {
				left: this.position[0] - this.width / 2,
				right: this.position[0] + this.width / 2,
				bottom: this.position[1] - this.height / 2,
				top: this.position[1] + this.height / 2
			};
		}
	});
})();
