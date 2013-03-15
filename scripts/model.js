"use strict";

self.Model = function(url) { 
	var self = this;
	var vertexCount;
	var mesh = null;

	this.isReady = function() { return mesh != null; };
	this.minVector = [null,null,null];
	this.maxVector = [null,null,null];

	// Temporarily lists of vertices/normals/texturecoords that have occurred in the file
	// indices in OBJ format are 1-based, so we can add a ZERO element.
	var indexedVertices = [[0,0,0]];
	var indexedNormals = [[0,0,0]];
	var indexedTextureCoords = [[0,0]];
	
	// Assigns triplet code (e.g. '42//21', for vertex 42 and normal 21) to their indices in the
	// following lists
	var indexedTriplets = [];
	
	// Lists of vertices, normals and texture coords that gets exported to OpenGL
	var vertices = [];
	var normals = [];
	var textureCoords = [];
	
	// Map surfaceName => triangle array (list of vertex indices)
	var surfaces = {};
	
	var currentMaterialName = 'white';
	
	var polygonCount = 0;
	var triangleCount = 0;
	var surfaceCount = 0;
	
	this.loadModel = function() {
		if (mesh !== null)
			throw new Error("Called Model.load() twice");
		
		$.ajax({
			dataType: 'text',
			url: url,
			success: function(data)  {
				parseFile(data);
				
				// Convert the map into a list and assign the material objects
				var surf = [];
				for (var name in surfaces) {
					surf.push({
						material: resources.materials[name],
						triangles: surfaces[name]
					});
				}

				console.log('Mesh for ' + url + ': ' + normals.length + ' normals');
				mesh = new Mesh({
					vertices: vertices,
					textureCoords: textureCoords,
					normals: normals,
					surfaces: surf
				});
				
				surfaceCount = surf.length;

				console.log("Parsed model with " + vertices.length + " vertices, " + polygonCount +
					" polygons, " + surfaceCount + " surfaces and " + triangleCount + " triangles");
				self.mesh = mesh;
				$(self).trigger('load');
			},
			error: function(error) {
				throw error.statusText;
			}
		});
	};
		
	function parseFile(data) {
		data.split("\n").forEach(parseLine);
	}
	
	function parseLine(line) {
		var parts = line.trim().split(/\s+/);
		if (parts.length > 0) {
			var key = parts.shift(); // remove and return first element
			switch (key) {
			case 'v':
				if (parts.length != 3)
					throw "Corrupt OBJ file: vertex with " + parts.length + " components; exactly three required. " +
					"full line: " + line;
				
				var vertex = parts.map(function(v) { return parseFloat(v);});
				indexedVertices.push(vertex);
				for (var i = 0; i < 3; i++) {
					if (self.minVector[i] === null || vertex[i] < self.minVector[i])
						self.minVector[i] = vertex[i];
					if (self.maxVector[i] === null || vertex[i] > self.maxVector[i])
						self.maxVector[i] = vertex[i];
				}
				break;
			case 'vn':
				if (parts.length == 3)
					indexedNormals.push(parts.map(function(v) { return parseFloat(v);}));
				else
					throw "Corrupt OBJ file: normal with " + parts.length + " components; exactly three required. " +
					"full line: " + line;
				break;
			case 'vt':
				if (parts.length == 2)
					indexedTextureCoords.push(parts.map(function(v) { return parseFloat(v);}));
				else
					throw "Corrupt OBJ file: texture coord with " + parts.length + " components; exactly two required. " +
					"full line: " + line;
				break;
			case 'f':
				if (parts.length < 3)
					throw "Corrupt OBJ file: face with " + parts.length + " vertices; at least three required. "+
						"full line: " + line;
				// splitting polygons into triangles: connect origin with two adjacent vertices
				for (var i = 1; i < parts.length - 1; i++) {
					addVertex(parts[0]);
					addVertex(parts[i]);
					addVertex(parts[i+1]);
					triangleCount++;
				}
				polygonCount++;
				break;
			case 'usemtl':
				currentMaterialName = parts[0].trim();
				if (resources.materials[currentMaterialName] == null)
					throw Error("Material referenced by model file not found: " + currentMaterialName);
			}
		}
	}
	
	// Adds an entry to *indices*, either by adding the specified triple or by referencing an
	// existing, equivalent triple
	function addVertex(specifier) {
		var index;
		if (specifier in indexedTriplets)
			index = indexedTriplets[specifier];
		else {
			index = addTriple(specifier);
			indexedTriplets[specifier] = index;
		}
		if (!(currentMaterialName in surfaces))
			surfaces[currentMaterialName] = [];
		surfaces[currentMaterialName].push(parseInt(index));
		
		// Adds a triple and returns the triple's index
		function addTriple(specifier) {
			// specifier is in format vertex/texturecoord/normal, where the numbers are indices
			var a = specifier.split('/').map(function(v) { return v == '' ? 0 : parseInt(v); });
			var v = indexedVertices[a[0]];
			var t = indexedTextureCoords[a[1]];
			var n = indexedNormals[a[2]];
			if (v === undefined)
				throw Error("Vertex " + v + " referenced by face " + specifier + " does not exist");
			if (t === undefined)
				throw Error("TextureCoord " + t + " referenced by face " + specifier + " does not exist");
			if (n === undefined)
				throw Error("Normal " + n + " referenced by face " + specifier + " does not exist");

			// the values for the indices are stored in the indexed* arrays, so we pick the
			// right values and add them to the final vertices/normals/textureCoords array
			vertices = vertices.concat(v);
			textureCoords = textureCoords.concat(t);
			normals = normals.concat(n);
			return vertices.length / 3 - 1; // vertices contains 3 elements per vertex
		}
	}
};
