"use strict";

(function() {
	var context = {};
	var startScreen = new StartScreen(context);
	var loadingScreen = new LoadingScreen(context);
	
	var screenControl = new ScreenControl();
	screenControl.defaultScreen = startScreen;
	
	$(function() {
		screenControl.showScreen(loadingScreen);
	});
})();
