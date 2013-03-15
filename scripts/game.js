(function() {
	window.Game = null;
	/**
	 * @constructor Creates the game logic
	 */
	Game = function() {
		this.resetWorld();
	};
	
	Game.prototype = {
		resetWorld: function() {
			this.world = new World();
		},
			
		/**
		 * Processes one step in game logic
		 * 
		 * Applies input and updates camera and world.
		 * 
		 * @param elapsed time in milliseconds since last call of update()
		 * @param {Input} input information about pressed keys etc.
		 */
		update: function(elapsed, input) {
			this.applyInput(elapsed, input);
			this.world.update(elapsed);
		},
		
		/**
		 * Checks the pressed keys and does their actions, e.g. moves the player
		 * 
		 * @param elapsed time in milliseconds since last call
		 * @param {Input} input information about pressed keys
		 */
		applyInput: function(elapsed, input) {
			var pos = this.world.camera.screenToWorldPoint(input.cursor, this.world.length / 2);
			this.world.paddle.position = pos;
		}
	};
})();