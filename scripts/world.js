"use strict";

/**
 * Creates a world
 * 
 * @returns {World}
 */
self.World = function() {
	var self = this;
	
	this.length = 20;
	this.width = 14;
	this.height = 8;
	var ballRadius = 0.5;
	this.max = vec3.fromValues(this.width/2, this.height/2, this.length/2);
	this.min = vec3.negate(vec3.create(), this.max);
	
	this.ball = new Ball(this, ballRadius);
	
	this.camera = new Camera(this);
	this.camera.position = vec3.fromValues(0, 0, this.length / 2 + 8);
	//this.camera.position = vec3.fromValues(0, this.height + 20, 0);
	//this.camera.rotation = vec3.fromValues(Math.PI / 2, 0, 0);

	// let world visually end at ball center, but physically cover the whole ball (easier to play)
	this.room = new Room(this, this.width, this.height, this.length - this.ball.radius * 2);
	
	this.beam = new Beam(this, this.room, this.ball);
	
	this.paddle = new Paddle(this);
	this.opposingPaddle = new Paddle(this);
	this.opposingPaddle.position[2] = this.min[2] + 0.1;
	
	this.update = function(elapsed) {
		self.ball.update(elapsed);
		self.beam.update(elapsed);
		self.paddle.update(elapsed);
		self.opposingPaddle.update(elapsed);
	};
	
	this.render = function(r) {
		self.ball.render(r);
		self.room.render(r);
		self.opposingPaddle.render(r);
		self.beam.render(r);
		self.paddle.render(r);
	};
};
