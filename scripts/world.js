"use strict";

/**
 * Creates a world
 * 
 * @returns {World}
 */
self.World = function() {
	var self = this;
	
	this.length = 20;
	this.width = 10;
	this.height = 8;
	
	this.ball = new Ball(this);
	this.ball.position = vec3.fromValues(0, 0, -length + this.ball.radius)
	
	this.camera = new Body(this);
	this.camera.position = vec3.fromValues(-length - 5, 0, 0);
	
	this.update = function(elapsed, input) {
		self.ball.update(elapsed);
	};
	
	this.render = function(r) {
		self.ball.render(r);
	};
	
	this.applyCamera = function(matrix) {
		// order is important!
		matrix.rotateX(self.camera.rotation[0]);
		matrix.rotateZ(self.camera.rotation[2]);
		matrix.rotateY(self.camera.rotation[1]);
		matrix.translate(vec3.negate(vec3.create(), self.camera.position));
	};
};
