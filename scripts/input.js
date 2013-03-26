self.Input = function() {
	var self = this;
	
	self.pressedKeys = {};
	
	self.cursor = [0,0];
	self.mouse = {
		left: false,
		right: false,
		middle: false
	};
	
	var keys = {
		UP: 38,
		DOWN: 40,
		LEFT: 37,
		RIGHT: 39,
		PAGE_UP: 33,
		PAGE_DOWN: 34,
		A: 65,
		F: 70,
		CTRL: 17,
	};
	
	document.addEventListener('keydown', function(event) {
		self.pressedKeys[event.keyCode] = true;
	});
	
	document.addEventListener('keyup', function(event) {
		self.pressedKeys[event.keyCode] = false;
	});
	
	document.addEventListener('mousedown', function(event) {
		switch (event.button) {
		case 0:
			self.mouse.left = true;
			break;
		case 1:
			self.mouse.middle = true;
			break;
		case 2:
			self.mouse.right = true;
			break;
		}
	});
	
	document.addEventListener('mouseup', function(event) {
		switch (event.button) {
		case 0:
			self.mouse.left = false;
			break;
		case 1:
			self.mouse.middle = false;
			break;
		case 2:
			self.mouse.right = false;
			break;
		}
	});
	
	window.addEventListener('blur', function(event) {
		self.pressedKeys = [];
		self.mouse = {
				left: false,
				right: false,
				middle: false
			};
	});
	
    document.addEventListener("mousemove", function(e) {
		if (document.mozPointerLockElement || document.webkitPointerLockElement || document.pointerLockElement) {
			var movement = [
			                e.movementX || e.mozMovementX || e.webkitMovementX || 0,
			                e.movementY || e.mozMovementY || e.webkitMovementY || 0];
			vec2.add(self.cursor, self.cursor, movement);
		} else {
			self.cursor = [e.pageX, e.pageY];
		}
	}, false);
	
	function idToKey(id) {
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
