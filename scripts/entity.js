(function() {
	"use strict";
	
	self.Entity = null;
	/**
	 * @constructor
	 */
	Entity = function(world) {
		Body.call(this, world);
		
		this.model = null;
	};
	
	Entity.prototype = $.extend(Body.prototype, {
		render: function(r) {
			var self = this;
			r.updateMatrix(function(matrix) {
				matrix.translate(self.position);
				matrix.rotateX(self.rotation[0]);
				matrix.rotateY(self.rotation[1]);
				matrix.rotateZ(self.rotation[2]);
				self.model.render(r);
			});
		}
	});
})();
