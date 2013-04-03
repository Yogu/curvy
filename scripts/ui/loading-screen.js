function LoadingScreen(context) {
	this.context = context;
	var self = this;
	$(this).on('show', function() {
		self._init();
	});
}

LoadingScreen.prototype =  {
	id: 'loading',

	_init: function() {
		var self = this;
		this.context.canvas = document.getElementById('canvas');
		this.context.gl = webgl.init(canvas);
		this._initViewport();
		
		showStatus('Initializing audio...');
		var audioContext = this._createAudioContext();
		this.context.audioContext = audioContext;
		if (!audioContext)
			console.log('WARNING: failed to create audio context');
		
		showStatus('Loading resources...');
		var resources = new Resources(audioContext);
		this.context.resources = resources;
		window.resources = resources;

		showStatus('Initializing renderer...');
		this.context.renderer = new Renderer(this.context.gl);
		
		this.context.input = new Input();

		showStatus('Waiting for resources to load...');
		$('#progress').text('0%');
		$(resources).on('progress', function() {
			$('#progress').text((resources.progress * 100).toFixed(0) + '%');
		});
		$(resources).on('load', function() {
			$(self).triggerHandler('finish');
		});
	},

	_initViewport: function() {
		window.addEventListener('resize', updateViewport);
		var canvas = this.context.canvas;
		var gl = this.context.gl;
		function updateViewport() {
			canvas.width = $('body')[0].clientWidth;
			canvas.height = $('body')[0].clientHeight;
			gl.viewport(0, 0, canvas.width, canvas.height);
		}
		updateViewport();
	},
	
	_createAudioContext: function() {
		var audioContextClass = window.webkitAudioContext || window.mozAudioContext
			|| window.AudioContext || null;
		if (audioContextClass)
			return new audioContextClass();
		else {
			console.log('Your browser does not support Audio API - sounds disabled.');
			return null;
		}
	}
};
