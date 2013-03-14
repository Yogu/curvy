(function() {
	"use strict";
	
	self.Body = null;
	/**
	 * @constructor Creates a new body
	 * 
	 * @param {World} world The world that will contain this body
	 */
	Body = function(world) {
		this.world = world;
		
		this.position = vec3.create();
		this.speed = vec3.create();
		this.rotation = vec3.create();
		this.mass = 1;
	};
	
	Body.prototype = {
		update: function(elapsed) {
			
		},
	};
})();
