"use strict";

self.Materials = function(url) {
	var textures = [];
	var self = this;
	
	var texturePath = 'images/';
	
	$.getJSON(url, function(data) {
		for (var name in data) {
			var material = data[name];
			material.apply = (function(material) {
				return function(r) {
					applyMaterial(r, material);
				};
			})(material);
			self[name] = material;

			if ('texture' in material)
				preloadTexture(material.texture);
		}
		console.log('Material file loaded');
		$(self).trigger('load');
	});
	
	function applyMaterial(r, material) {
		if ('texture' in material)
			bindTexture(r, material.texture);
		else
			r.bindTexture(null); 
		if ('color' in material)
			r.setColor(material.color);
		else
			r.setColor([1,1,1,1]);
	}
	
	function bindTexture(r, fileName) {
		r.bindTexture(loadTextureIfNotPresent(r, fileName));
	}
	
	function loadTextureIfNotPresent(r, fileName) {
		if (fileName in textures)
			return textures[fileName];
		else {
			var texture = loadTexture(r, fileName);
			textures[fileName] = texture;
			return texture;
		}
	}
	
	function loadTexture(r, fileName) {
		var url = texturePath + fileName;
		return resources.registerResource(r.loadTexture(url));
	}
	
	function preloadTexture(fileName) {
		var url = texturePath + fileName;
		var image = new Image();
		var notifier = { };
		image.onload = function() {
			$(notifier).triggerHandler('load');
		};
		image.src = url;
		resources.registerResource(notifier);
	}
};
