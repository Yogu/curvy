(function() {
	"use strict";
	
	var NEAR_CLIPPING = 0.01;
	var FAR_CLIPPING = 1000;
	
	self.Camera = null;
	/**
	 * @constructor
	 */
	Camera = function(world) {
		Body.call(this, world);
		
		this.model = null;
		this.size = {
			width: 1,
			height: 1
		};
		this.tmp = 0;
		this.factor = 1 - 1 / 400;
	};
	
	$.extend(Camera.prototype, Body.prototype, {
		getProjectionMatrix: function() {
			return mat4.perspective(mat4.create(), 45, this.size.width / this.size.height, NEAR_CLIPPING, FAR_CLIPPING);
		},
		
		getMatrix: function() {
			var matrix = mat4.identity(mat4.create());
			mat4.rotateX(matrix, matrix, this.rotation[0]);
			mat4.rotateZ(matrix, matrix, this.rotation[2]);
			mat4.rotateY(matrix, matrix, this.rotation[1]);
			mat4.translate(matrix, matrix, vec3.negate(vec3.create(), this.position));
			return matrix;
		},
		
		screenToWorldPoint: function(screenPoint, zPlane) {
			// let x/y screen coordinates go from -1 to 1 within the screen
			var sx = (screenPoint[0] / this.size.width) * 2 - 1;
			var sy = 1 - (screenPoint[1] / this.size.height) * 2;
			
			// calculate the positive matrix
			var matrix = mat4.multiply(mat4.create(), this.getProjectionMatrix(), this.getMatrix());
			
			// add the condition z = 1 with the row (1 = 0 * x + 0 * y + 1 * z + 0 * w)
			/*matrix[2] = matrix[6] = matrix[14] = 0;
			matrix[10] = 1;*/
			
			// solve for (x,y,z,w) (given sx, sy, 1 and w=1)
			mat4.invert(matrix, matrix);
			var worldPoint = vec4.transformMat4(vec4.create(), [sx, sy, this.factor, 1], matrix);
			if ((this.tmp++) % 20 == 0)
				;//console.log(worldPoint);
			// vec4 to vec3
			worldPoint = vec3.fromValues( 
				worldPoint[0] / worldPoint[3], 
				worldPoint[1] / worldPoint[3], 
				worldPoint[2] / worldPoint[3]);
			return worldPoint;
		}
	});
})();
