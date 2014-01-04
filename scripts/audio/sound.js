"use strict";

function Sound(url, context) {
	this.context = context;
	this.url = url;
}

Sound.prototype.load = function() {
	var request = new XMLHttpRequest();
	request.open("GET", this.url, true);
	request.responseType = "arraybuffer";
	var sound = this;
	request.onload = function() {
		sound.context.decodeAudioData(request.response, function(buffer) {
			if (!buffer) {
				console.error('error decoding audio file data: ' + url);
				return;
			}
			sound.buffer = buffer;
			$(sound).triggerHandler('load');
		}, function(error) {
			console.error('decodeAudioData error', error);
		});
	};
	request.onerror = function() {
		console.error('BufferLoader: XHR error');
	};
	request.send();
};

Sound.prototype.play = function() {
	if (!this.buffer) {
		console.log('Tried to play sound that is not initialized yet');
		return;
	}
	
	var source = this.context.createBufferSource();
	source.buffer = this.buffer;
	source.connect(this.context.destination);
	source.start();
};
