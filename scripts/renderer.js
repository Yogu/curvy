"use strict";

self.Renderer = function(gl) {
	var self = this;
	
	var attributes = {
		normal: null,
		textureCoords: null
	};
	
	var uniforms = {
		projectionMatrix: null,
		modelviewMatrix: null,
		normalMatrix: null,
		color: null,
		sampler: null,
		textureEnabled: null
	};
	
	initOpenGL();
	initShaders();
	
	// Init configuration
	function initOpenGL() {
		// Clear to black, fully opaque
		gl.clearColor(0.3, 0.3, 0.7, 1.0);
		// Clear everything
		gl.clearDepth(1.0);
		
		// Near things obscure far things
		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LEQUAL);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		gl.enable(gl.BLEND);
		
		gl.enable(gl.CULL_FACE);
	}
	
	//
	// initShaders
	//
	// Initialize the shaders, so WebGL knows how to light our scene.
	//
	function initShaders() {
		var vertexShader = webgl.createShaderFromScriptElement(gl, "3d-vertex-shader");
		var fragmentShader = webgl.createShaderFromScriptElement(gl, "3d-fragment-shader");
		var program = webgl.createShaderProgram(gl, [ vertexShader, fragmentShader ]);
		gl.useProgram(program);
		
		attributes.position = gl.getAttribLocation(program, "aPosition");
		gl.enableVertexAttribArray(attributes.position);
		attributes.normal = gl.getAttribLocation(program, "aNormal");
		gl.enableVertexAttribArray(attributes.normal);
		attributes.textureCoords = gl.getAttribLocation(program, "aTextureCoord");
		gl.enableVertexAttribArray(attributes.textureCoords);
		uniforms.modelviewMatrix = gl.getUniformLocation(program, "uModelviewMatrix");
		uniforms.projectionMatrix = gl.getUniformLocation(program, "uProjectionMatrix");
		uniforms.normalMatrix = gl.getUniformLocation(program, "uNormalMatrix");
		uniforms.sampler = gl.getUniformLocation(program, "uSampler");
		uniforms.color = gl.getUniformLocation(program, "uColor");
		uniforms.textureEnabled = gl.getUniformLocation(program, "uTextureEnabled");
	}

	var matrix = mat4.identity(mat4.create());
	var matrices = [];
	var normalMatrixBase = matrix;
	
	function pushMatrix() {
		matrices.push({matrix: mat4.clone(matrix), normalMatrixBase: mat4.clone(normalMatrixBase) });
	}
	
	function popMatrix() {
		var obj = matrices.pop();
		matrix = obj.matrix;
		normalMatrixBase = obj.normalMatrixBase;
	}
	
	var renderFunctions = {
		gl: gl,
			
		updateMatrix: function(callback) {
			pushMatrix();
			try {
				callback(matrixFunctions);
			} finally {
				popMatrix();
			}
		},

		/**
		 * Uploads the buffer data to the video memory
		 * 
		 * @return WebGLBuffer
		 */
		createBuffer: function(type, buffer) {
			var glBuffer = gl.createBuffer();
			gl.bindBuffer(type, glBuffer);
			gl.bufferData(type, buffer, gl.STATIC_DRAW);
			return glBuffer;
		},
		
		/**
		 * Draws the elements specified by the options parameter
		 * 
		 * vertices, normals and textureCoords should be created using
		 * createBuffer(gl.ARRAY_BUFFER, Float32Array).
		 * 
		 * triangles should be created using createBuffer(gl.ARRAY_ELEMENT_BUFFER, Uint16Array).
		 * 
		 * options: {
		 *   vertices: WebGLBuffer
		 *   normals: WebGLBuffer
		 *   textureCoords: WebGLBuffer
		 *   surfaces: [
		 *     {
		 *       material: Material,
		 *       vertexCount: int,
		 *       triangles: WebGLBuffer 
		 *     }, ...
		 *   ]
		 * }
		 */
		drawElements: function(options) {
			applyMatrix();
			
			gl.bindBuffer(gl.ARRAY_BUFFER, options.vertices);
			gl.vertexAttribPointer(attributes.position, 3, gl.FLOAT, false, 0, 0);
			
			gl.bindBuffer(gl.ARRAY_BUFFER, options.normals);
			gl.vertexAttribPointer(attributes.normal, 3, gl.FLOAT, false, 0, 0);
			
			gl.bindBuffer(gl.ARRAY_BUFFER, options.textureCoords);
			gl.vertexAttribPointer(attributes.textureCoords, 2, gl.FLOAT, false, 0, 0);
			
			// Draw the triangles.
			for (var i = 0; i < options.surfaces.length; i++) {
				var surface = options.surfaces[i];
				surface.material.apply(renderFunctions);
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, surface.triangles);
				gl.drawElements(gl.TRIANGLES, surface.vertexCount, gl.UNSIGNED_SHORT, 0);

				triangleCount += surface.vertexCount / 3;
			}
		},
		
		loadTexture: function(url) {
			var texture = gl.createTexture();
			var image = new Image();
			image.onload = handleTextureLoaded;
			image.src = url;

			function handleTextureLoaded() {
				$(texture).triggerHandler('load');
				gl.bindTexture(gl.TEXTURE_2D, texture);
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
				gl.generateMipmap(gl.TEXTURE_2D);
				gl.bindTexture(gl.TEXTURE_2D, null);
			}
			
			return texture;
		},
		
		bindTexture: function(texture) {
			if (texture !== null) {
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, texture);
				gl.uniform1i(uniforms.sampler, 0);
				gl.uniform1i(uniforms.textureEnabled, 1);
			} else {
				gl.uniform1i(uniforms.textureEnabled, 0);
			}
		},
		
		setColor: function(color) {
			gl.uniform4f(uniforms.color, color[0], color[1], color[2], color[3]);
		}
	};
	
	var matrixFunctions = {
		translate: function(vector) {
			mat4.translate(matrix, matrix, vector);
			mat4.translate(normalMatrixBase, normalMatrixBase, vector);
		},

		rotateX: function(angle) {
			mat4.rotateX(matrix, matrix, angle);
			mat4.rotateX(normalMatrixBase, normalMatrixBase, angle);
		},

		rotateY: function(angle) {
			mat4.rotateY(matrix, matrix, angle);
			mat4.rotateY(normalMatrixBase, normalMatrixBase, angle);
		},

		rotateZ: function(angle) {
			mat4.rotateZ(matrix, matrix, angle);
			mat4.rotateZ(normalMatrixBase, normalMatrixBase, angle);
		},
		
		scale: function(vector) {
			mat4.scale(matrix, matrix, vector);
			mat4.scale(normalMatrixBase, normalMatrixBase, vector);
		}
	};
	
	var triangleCount;
	
	this.renderWorld = function(world) {
		gl.uniformMatrix4fv(uniforms.projectionMatrix, false, world.camera.getProjectionMatrix());
		
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		resources.materials.white.apply(renderFunctions);
		
		// Normal matrix base should not be affected by camera
		matrix = world.camera.getMatrix();
		normalMatrixBase = mat4.identity(mat4.create());
		
		triangleCount = 0;
		world.render(renderFunctions);
		self.triangleCount = triangleCount;
	};
	
	function applyMatrix() {
		gl.uniformMatrix4fv(uniforms.modelviewMatrix, false, matrix);
		
		// Normal matrix
		var normalMatrix = mat4.invert(mat4.create(), normalMatrixBase);
		if (normalMatrix != null) { // invertable?
			mat4.transpose(normalMatrix, normalMatrix);
			gl.uniformMatrix4fv(uniforms.normalMatrix, false, normalMatrix);
		}
	}
};
