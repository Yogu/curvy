"use strict";

/**
 * Creates a mesh consisting of several surfaces, each with triangles and materials. The vertices,
 * normals and textureCoords are shared across all surfaces.
 * 
 * buffers: {
 *   vertices: Float32Array() | Array
 *   normals: Float32Array() | Array,
 *   textureCoords: Float32Array() | Array,
 *   surfaces: [
 *     {
 *       material: Material,
 *       triangles: Uint16Array | Array (the vertex indices)
 *     }, ...
 *   ]
 * }
 */
self.Mesh = function(buffers) {
	var self = this;
	var buffersBuilt = false;

	var glVertexBuffer;
	var surfacesBuffer;
	var glNormalBuffer;
	var glTextureCoordBuffer;
	
	var triangleCount = 0;
	
	// Create native Arrays, if neccessary
	buffers.vertices = utils.ensureIsBuffer(buffers.vertices, Float32Array);
	buffers.normals = utils.ensureIsBuffer(buffers.normals, Float32Array);
	buffers.textureCoords = utils.ensureIsBuffer(buffers.textureCoords, Float32Array);
	buffers.surfaces.forEach(function(surface) {
		surface.triangles = utils.ensureIsBuffer(surface.triangles, Uint16Array);
	});
	
	this.render = function(r) {
		var self = this;
		if (this.corrections) {
			var corrections = this.corrections;
			r.updateMatrix(function(matrix) {
				if (corrections.scale != undefined)
					matrix.scale(corrections.scale);
				if (corrections.rotation != undefined) {
					matrix.rotateX(corrections.rotation[0]);
					matrix.rotateY(corrections.rotation[1]);
					matrix.rotateZ(corrections.rotation[2]);
				}

				if (corrections.offset != undefined)
					matrix.translate(corrections.offset);
				
				self.renderWithoutCorrections(r);
			});
		} else
			this.renderWithoutCorrections(r);
	};
	
	this.renderWithoutCorrections = function(r) {
		if (!buffersBuilt) {
			buildBuffers(r);
			buffersBuilt = true;
		}

		r.drawElements({
			vertices: glVertexBuffer,
			normals: glNormalBuffer,
			textureCoords: glTextureCoordBuffer,
			surfaces: surfacesBuffer,
		});
	}
	
	function buildBuffers(r) {
		triangleCount = 0;
		glVertexBuffer
			= r.createBuffer(r.gl.ARRAY_BUFFER, utils.arrayToFloat32Array(buffers.vertices));
		glNormalBuffer = r.createBuffer(r.gl.ARRAY_BUFFER, buffers.normals);
		glTextureCoordBuffer = r.createBuffer(r.gl.ARRAY_BUFFER, buffers.textureCoords);
		surfacesBuffer = [];
		for (var i = 0; i < buffers.surfaces.length; i++) {
			var surface = buffers.surfaces[i];
			var buffer = r.createBuffer(r.gl.ELEMENT_ARRAY_BUFFER,
				utils.arrayToUint16Array(surface.triangles));
			surfacesBuffer.push({
				material: surface.material,
				vertexCount: surface.triangles.length,
				triangles: buffer});
			triangleCount += surface.triangles.length;
		}
	}
	
	
};
