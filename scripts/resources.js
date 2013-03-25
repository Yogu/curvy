"use strict";

function Resources(audioContext) {
	var self = this;
	var totalCount = 0;
	var loadedCount = 0;
	var isDone = false;
	this.progress = 0;
	
	this.materials = registerResource(new Materials('models/material.json'));
	
	var models = [
		'sphere', 'beam', 'paddle'
	];

	// Initialize models
	this.models = {};
	for (var i = 0; i < models.length; i++) {
		var name = models[i];
		var url = 'models/' + name + '.obj';
		this.models[name] = registerResource(new Model(url));
	}
	$(this.materials).on('load', function() {
		console.log('materials loaded');
		for (var i = 0; i < models.length; i++) {
			var name = models[i];
			self.models[name].loadModel();
		}
	});
	
	// Load sounds
	var sounds = ['lost', 'paddle', 'opponent-paddle', 'wall', 'wall2'];
	this.sounds = {};
	for (var i = 0; i < sounds.length; i++) {
		var name = sounds[i];
		var url = 'sounds/' + name + '.ogg';
		var sound;
		if (audioContext != null) {
			sound = registerResource(new Sound(url, audioContext));
			sound.load();
		} else
			sound = {play: function(){}};
		this.sounds[name] = sound;
	}
	
	function registerResource(obj) {
		console.log('registered resource');
		// Don't register resources when game has already started
		if (isDone)
			return obj;
		
		totalCount++;
		$(obj).on('load', function(){
			console.log('resource loaded');
			if (!isDone) {
				loadedCount++;
				self.progress = loadedCount / totalCount;
				$(self).triggerHandler('progress');
				if (loadedCount == totalCount)
					done();
			}
		});
		return obj;
	}
	self.registerResource = registerResource;
	
	function done() {
		isDone = true;
		$(self).triggerHandler('load');
	}
}
