"use strict";

(function() {
	showStatus('Setting up WebGL...');
	console.log('Initializing WebGL...');
	var canvas = document.getElementById('canvas');
	var statusLabel = document.getElementById('status');
	var gl = webgl.init(canvas);
	
	var game;
	var renderer;
	var input;
	var elapsedSum = 0;
	var elapsedCount = 0;

	window.onload = init;
	
	function init() {
		showStatus('Initializing audio...');
		var audioContext = createAudioContext();
		if (!audioContext)
			console.log('WARNING: failed to create audio context');
		
		showStatus('Loading resources...');
		window.resources = new Resources(audioContext);

		showStatus('Initializing video...');
		renderer = new Renderer(gl);
		window.renderer = renderer;
		
		input = new Input();
		
		showStatus('Waiting for resources to load...');
		$('#progress').text('0%');
		$(resources).on('progress', function() {
			$('#progress').text((resources.progress * 100).toFixed(0) + '%');
		});
		$(resources).on('load', startLoop);
	}
	
	function createAudioContext() {
		var audioContextClass = webkitAudioContext || mozAudioContext || AudioContext;
		if (audioContextClass)
			return new audioContextClass();
		else
			return null;
	}
	
	function initViewport() {
		window.addEventListener('resize', updateViewport);
		function updateViewport() {
			canvas.width = canvas.clientWidth;
			canvas.height = canvas.clientHeight;
			gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight);
		}
		updateViewport();
	}
	
	function startLoop() {
		console.log('Initializing game...');
		game = new Game();
		window.game = game;
		$(document).triggerHandler('game');
		
		initViewport();
		console.log('Render loop started');
		$('#splash').hide();
		$('#status').show();
		var last = new Date().getTime();
		function iteration() {
			// TODO: improve the data flow
			game.world.camera.size = {width: canvas.width, height: canvas.height};
			
			var elapsed = (new Date().getTime() - last) / 1000;
			if (elapsed > 0.1)
				elapsed = 0.1;
			last = new Date().getTime();
			game.update(elapsed, input);
			renderer.renderWorld(game.world);
			requestAnimFrame(iteration, canvas);
			
			// Display FPS
			elapsedSum += elapsed;
			elapsedCount++;
			if (elapsedSum >= 0.5) {
				statusLabel.textContent = (elapsedCount / elapsedSum).toFixed(1) + ' FPS, ' + renderer.triangleCount + ' triangles';
				elapsedSum = 0;
				elapsedCount = 0;
			}
		}
		iteration();
	}
})();
