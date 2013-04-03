function ScreenControl() {
	this.activeScreen = null;
}

ScreenControl.prototype = {
	showScreen: function(screen) {
		var self = this;
		if (this.activeScreen != screen) {
			var lastScreen = this.activeScreen;
			if (this.activeScreen) {
				this.activeScreen.isVisible = false;
				$(this.activeScreen).triggerHandler('hide');
			}
			screen.control = self;
			$(screen).one('finish', function() {
				self.showScreen(lastScreen || self.defaultScreen);
			});
			
			$('.screen').removeClass('active');
			$('#' + screen.id + '-screen').addClass('active');
			screen.isVisible = true;
			this.activeScreen = screen;
			$(screen).triggerHandler('show');
		}
	}
};
