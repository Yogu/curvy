(function() {
	"use strict";
	
	self.Paddle = null;
	/**
	 * @constructor
	 */
	Paddle = function(world) {
		Entity.call(this, world);
		
		this.world = world;
		this.mesh = resources.models.paddle.mesh;
		this.mesh.corrections = {
			scale: [1.5, 0.9, 1]
		};
	};
	
	$.extend(Paddle.prototype, Entity.prototype, {
		update: function(elapsed) {
			
		}
	});
})();
