describe('BoundingBox', function() {
	it('should assign minVector and maxVector', function() {
		var box = new BoundingBox([1,2,3], [4,5,6]);
		expect(box.minVector).toEqual([1,2,3]);
		expect(box.maxVector).toEqual([4,5,6]);
	});
	
	describe('collision', function() {
		var box;
		
		beforeEach(function() {
			box = new BoundingBox([0,0,0], [1,1,1]);
		});
		
		it('should not collide in empty world', function() {
			var world = {
				isBlocked: function(vector) {
					return false;
				}
			};
			
			expect(box.getImpactOnMove([0,0,0], 0, 3, world), [3,0,0]);
			expect(box.getImpactOnMove([0,0,0], 1, 2, world), [0,2,0]);
			expect(box.getImpactOnMove([1,0,0], 2, -4, world), [1,0,-4]);
		});
	});
});

describe('Body', function() {
	
});