(function() {
	var log = function(msg) {
		if (window.console && window.console.log) {
			window.console.log(msg);
		}
	};
	var error = function(msg) {
		if (window.console) {
			if (window.console.error) {
				window.console.error(msg);
			} else if (window.console.log) {
				window.console.log(msg);
			}
		}
		alert(msg);
	};
	var loggingOff = function() {
		log = function() {
		};
		error = function() {
		};
	};
	var glEnumToString = function(gl, value) {
		for ( var p in gl) {
			if (gl[p] == value) {
				return p;
			}
		}
		return "0x" + value.toString(16);
	};
	var GET_A_WEBGL_BROWSER = ''
			+ 'This page requires a browser that supports WebGL. http://get.webgl.org';
	var OTHER_PROBLEM = ''
			+ "It doesn't appear your computer can support WebGL. http://get.webgl.org/troubleshooting";
	var setupWebGL = function(canvas, opt_attribs) {
		function showLink(str) {
			alert(str);
		}
		;
		if (!window.WebGLRenderingContext) {
			alert(GET_A_WEBGL_BROWSER);
			return null;
		}
		var context = create3DContext(canvas, opt_attribs);
		if (!context) {
			alert(OTHER_PROBLEM);
		}
		return context;
	};
	var create3DContext = function(canvas, opt_attribs) {
		var names = [ "webgl", "experimental-webgl" ];
		var context = null;
		for ( var ii = 0; ii < names.length; ++ii) {
			try {
				context = canvas.getContext(names[ii], opt_attribs);
			} catch (e) {
			}
			if (context) {
				break;
			}
		}
		return context;
	}
	var getWebGLContext = function(canvas) {
		return setupWebGL(canvas);
	};
	var loadShader = function(gl, shaderSource, shaderType, opt_errorCallback) {
		var errFn = opt_errorCallback || error;
		var shader = gl.createShader(shaderType);
		gl.shaderSource(shader, shaderSource);
		gl.compileShader(shader);
		var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
		if (!compiled) {
			lastError = gl.getShaderInfoLog(shader);
			errFn("*** Error compiling shader '" + shader + "':" + lastError);
			gl.deleteShader(shader);
			return null;
		}
		return shader;
	}
	var loadProgram = function(gl, shaders, opt_attribs, opt_locations) {
		var program = gl.createProgram();
		for ( var ii = 0; ii < shaders.length; ++ii) {
			gl.attachShader(program, shaders[ii]);
		}
		if (opt_attribs) {
			for ( var ii = 0; ii < opt_attribs.length; ++ii) {
				gl
						.bindAttribLocation(program,
								opt_locations ? opt_locations[ii] : ii,
								opt_attribs[ii]);
			}
		}
		gl.linkProgram(program);
		var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
		if (!linked) {
			lastError = gl.getProgramInfoLog(program);
			error("Error in program linking:" + lastError);
			gl.deleteProgram(program);
			return null;
		}
		return program;
	};
	var createShaderFromScript = function(gl, scriptId, opt_shaderType,
			opt_errorCallback) {
		var shaderSource = "";
		var shaderType;
		var shaderScript = document.getElementById(scriptId);
		if (!shaderScript) {
			throw ("*** Error: unknown script element" + scriptId);
		}
		shaderSource = shaderScript.text;
		if (!opt_shaderType) {
			if (shaderScript.type == "x-shader/x-vertex") {
				shaderType = gl.VERTEX_SHADER;
			} else if (shaderScript.type == "x-shader/x-fragment") {
				shaderType = gl.FRAGMENT_SHADER;
			} else if (shaderType != gl.VERTEX_SHADER
					&& shaderType != gl.FRAGMENT_SHADER) {
				throw ("*** Error: unknown shader type");
				return null;
			}
		}
		return loadShader(gl, shaderSource, opt_shaderType ? opt_shaderType
				: shaderType, opt_errorCallback);
	};
	this.createProgram = loadProgram;
	this.createShaderFromScriptElement = createShaderFromScript;
	this.getWebGLContext = getWebGLContext;
	window.requestAnimFrame = (function() {
		return window.requestAnimationFrame
				|| window.webkitRequestAnimationFrame
				|| window.mozRequestAnimationFrame
				|| window.oRequestAnimationFrame
				|| window.msRequestAnimationFrame
				|| function(callback, element) {
					return window.setTimeout(callback, 1000 / 60);
				};
	})();
	window.cancelRequestAnimFrame = (function() {
		return window.cancelCancelRequestAnimationFrame
				|| window.webkitCancelRequestAnimationFrame
				|| window.mozCancelRequestAnimationFrame
				|| window.oCancelRequestAnimationFrame
				|| window.msCancelRequestAnimationFrame || window.clearTimeout;
	})();
}());
