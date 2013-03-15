self.Input = function() {
	var self = this;
	
	var pressedKeys = {};
	
	self.cursor = [0,0];
	
	var keys = {
		UP: 38,
		DOWN: 40,
		LEFT: 37,
		RIGHT: 39,
		PAGE_UP: 33,
		PAGE_DOWN: 34,
		A: 65,
		F: 70,
		CTRL: 17
	}
	
	document.addEventListener('keydown', function(event) {
		self.pressedKeys[event.keyCode] = true;
	});
	
	document.addEventListener('keyup', function(event) {
		self.pressedKeys[event.keyCode] = false;
	});
	
	window.addEventListener('blur', function(event) {
		self.pressedKeys = [];
	});
	
	$(document).mousemove(function(e) {
		self.cursor = [e.pageX, e.pageY];
	});
	
	function idToKey(id) {
		var key;
		switch (id) {
		case 'left':
			return keys.LEFT;
		case 'right':
			return keys.RIGHT;
		case 'up':
			return keys.UP;
		case 'down':
			return keys.DOWN;
		case 'jump':
			return keys.A;
		default:
			return false;
		}		
	}
};
