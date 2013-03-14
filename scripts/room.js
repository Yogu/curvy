(function() {
	"use strict";
	
	self.Room = null;
	/**
	 * @constructor
	 */
	Room = function(world, width, height, length) {
		var self = this;
		Entity.call(this, world);
		
		this.width = width;
		this.height = height;
		this.length = length;
		this.generateMesh();
	};
	
	Room.prototype = $.extend(Entity.prototype, {
		generateMesh: function() {
			var vertices = cubeVertices;
			var vertexIndices = cubeVertexIndices;
			var normals = cubeVertexNormals;
			var tileWidth = 2;
			var width = this.width / tileWidth;
			var height = this.height / tileWidth;
			var length = this.length / tileWidth;
			var textureCoordinates = [
			                  		// Front
			                		0.0,	0.0,
			                		width,	0.0,
			                		width,	height,
			                		0.0,	height,
			                		// Back
			                		0.0,	0.0,
			                		height,	0.0,
			                		height,	width,
			                		0.0,	width,
			                		// Top
			                		0.0,	0.0,
			                		length,	0.0,
			                		length,	width,
			                		0.0,	width,
			                		// Bottom
			                		0.0,	0.0,
			                		width,	0.0,
			                		width,	length,
			                		0.0,	length,
			                		// Right
			                		0.0,	0.0,
			                		height,	0.0,
			                		height,	length,
			                		0.0,	length,
			                		// Left
			                		0.0,	0.0,
			                		length,	0.0,
			                		length,	height,
			                		0.0,	height
			                	];
			this.mesh = new Mesh({
				vertices: vertices,
				normals: normals,
				textureCoords: textureCoordinates,
				surfaces: [{
					material: resources.materials.block,
					triangles: vertexIndices
				}]
			});
			
			this.mesh.corrections = {
				scale: [this.width, this.height, this.length],
				offset: [-0.5, -0.5, -0.5]
			}
		}
	});
	

	
	// Cube Data
	var cubeVertices = [
		// Front face
		0, 0, 1,
		1, 0, 1,
		1, 1, 1,
		0, 1, 1,
		
		// Back face
		0, 0, 0,
		0, 1, 0,
		1, 1, 0,
		1, 0, 0,
		
		// Top face
		0, 1, 0,
		0, 1, 1,
		1, 1, 1,
		1, 1, 0,
		
		// Bottom face
		0, 0, 0,
		1, 0, 0,
		1, 0, 1,
		0, 0, 1,
		
		// Right face
		1, 0, 0,
		1, 1, 0,
		1, 1, 1,
		1, 0, 1,
		
		// Left face
		0, 0, 0,
		0, 0, 1,
		0, 1, 1,
		0, 1, 0
	];
	
	var cubeVertexIndices = [
		2,	1,	0,			3,	2,	0,		// front
		6,	5,	4,			7,	6,	4,		// back
		10,	9,	8,		11,	10, 8,	 // top
		14, 13, 12,		 15, 14, 12,	 // bottom
		18, 17, 16,		 19, 18, 16,	 // right
		22, 21, 20,		 23, 22, 20		// left
	];
	
	var cubeVertexNormals = [
	  // Front
	   0.0,  0.0,  1.0,
	   0.0,  0.0,  1.0,
	   0.0,  0.0,  1.0,
	   0.0,  0.0,  1.0,
	   
	  // Back
	   0.0,  0.0, -1.0,
	   0.0,  0.0, -1.0,
	   0.0,  0.0, -1.0,
	   0.0,  0.0, -1.0,
	   
	  // Top
	   0.0,  1.0,  0.0,
	   0.0,  1.0,  0.0,
	   0.0,  1.0,  0.0,
	   0.0,  1.0,  0.0,
	   
	  // Bottom
	   0.0, -1.0,  0.0,
	   0.0, -1.0,  0.0,
	   0.0, -1.0,  0.0,
	   0.0, -1.0,  0.0,
	   
	  // Right
	   1.0,  0.0,  0.0,
	   1.0,  0.0,  0.0,
	   1.0,  0.0,  0.0,
	   1.0,  0.0,  0.0,
	   
	  // Left
	  -1.0,  0.0,  0.0,
	  -1.0,  0.0,  0.0,
	  -1.0,  0.0,  0.0,
	  -1.0,  0.0,  0.0
	];
})();
