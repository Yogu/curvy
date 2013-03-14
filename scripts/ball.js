(function() {
	"use strict";
	
	self.Ball = null;
	/**
	 * @constructor
	 */
	Ball = function(world) {
		Entity.call(this, world);
		
		this.radius = 1;
		this.model = resources.models.sphere;
	};
	
	Ball.prototype = $.extend(Entity.prototype, {
		
	});
})();
