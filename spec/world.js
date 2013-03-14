describe('World', function() {
	var world;
	
	beforeEach(function() {
		world = new World();
	});
	
	it('should be empty after creation', function() {
		expect(world.getIDAt([0,0,0])).toEqual(0);
	});
	
	it('allows putting objects', function() {
		world.place([0,0,0], Block.blocks.solid);
		expect(world.getIDAt([0,0,0])).toEqual(1);
	});
	
	it('keeps objects after pushing', function() {
		world.place([0,0,0], Block.blocks.solid);
		world.push();
		expect(world.getIDAt([0,0,0])).toEqual(1);
	});
	
	it('allows to add objects after pushing', function() {
		world.place([0,0,0], Block.blocks.solid);
		world.push();
		world.place([1,0,0], Block.blocks.solid);
		expect(world.getIDAt([0,0,0])).toEqual(1);
		expect(world.getIDAt([1,0,0])).toEqual(1);
	});
	
	it('keeps changes after calling popAndApply', function() {
		world.place([0,0,0], Block.blocks.solid);
		world.push();
		world.place([1,0,0], Block.blocks.solid);
		world.popAndApply();
		expect(world.getIDAt([0,0,0])).toEqual(1);
		expect(world.getIDAt([1,0,0])).toEqual(1);
	});
	
	it('discards changes after calling popAndKeep', function() {
		world.place([0,0,0], Block.blocks.solid);
		world.push();
		world.place([1,0,0], Block.blocks.solid);
		world.popAndDiscard();
		expect(world.getIDAt([0,0,0])).toEqual(1);
		expect(world.getIDAt([1,0,0])).toEqual(0);
	});
	
	it('allows placing two blocks on different positions', function() {
		expect(world.place([0,0,0], Block.blocks.solid)).toEqual(true);
		expect(world.place([0,0,1], Block.blocks.solid)).toEqual(true);
	});
	
	it('disallows placing two blocks on the same position', function() {
		world.place([0,0,0], Block.blocks.solid);
		expect(world.place([0,0,0], Block.blocks.solid)).toEqual(false);
	});
	
	it('disallows placing blocks on places that are marked as "keep free"', function() {
		expect(world.keepFree([0,0,1])).toEqual(true);
		expect(world.place([0,0,1], Block.blocks.solid)).toEqual(false);
	});
	
	it('disallows marking a blocked position as "keep free"', function() {
		expect(world.place([0,0,1], Block.blocks.solid)).toEqual(true);
		expect(world.keepFree([0,0,1])).toEqual(false);
	});
	
	it('marks the place above a block as "safe"', function() {
		expect(world.isSafe([0,1,0])).toEqual(false);
		world.place([0,0,0], Block.blocks.solid);
		expect(world.isSafe([0,1,0])).toEqual(true);
	});
	
	it('does not mark blocked places as "safe"', function() {
		world.place([0,0,0], Block.blocks.solid);
		world.place([0,1,0], Block.blocks.solid);
		expect(world.isSafe([0,1,0])).toEqual(false);
	});
});
