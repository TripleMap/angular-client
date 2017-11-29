'use strict';

var TDMap = {

	Service: {},

	Layers: {},

	Utils: {},

	Routing: {}
};

if (typeof window !== 'undefined' && window.L) {
	window.TDMap = TDMap;
}
'use strict';

TDMap.Service.GeoJSONProvider = {

	initialize: function initialize(options) {
		if (options.dataUrl === undefined && options.dataUrl === null) {
			throw new Error("Не задан url для GeoJSONProvider");
		}
		this.options = options;
	},

	getData: function getData() {
		return TDMap.Utils.Promise.getPromise(this.options.dataUrl, this.options.params, this.options.headers);
	},

	getDataByBounds: function getDataByBounds(bounds) {
		if (!this.options.params) {
			this.options.params = {};
		}
		if (bounds instanceof L.LatLngBounds) {
			this.options.params.bbox = this._getMinMaxBounds(bounds);
		} else {
			this.options.params.bbox = bounds;
		}

		if (this.options.styled) {
			this.options.params.styled = this.options.styled;
		} else {
			delete this.options.params.styled;
		}

		if (this.options.labeled) {
			this.options.params.labeled = this.options.labeled;
		} else {
			delete this.options.params.labeled;
		}
		return TDMap.Utils.Promise.getPromise(this.options.dataUrl, this.options.params, this.options.headers);
	},

	_getMinMaxBounds: function _getMinMaxBounds(bounds) {
		if (bounds) {
			var nw = bounds.getNorthWest();
			var se = bounds.getSouthEast();
			var minMaxStringBounds = [nw.lng, se.lat, se.lng, nw.lat].toString();
			return minMaxStringBounds;
		}
	}
};

TDMap.Service.GeoJSONServiceLayer = L.GeoJSON.extend({
	includes: TDMap.Service.GeoJSONProvider,

	initialize: function initialize(options) {
		this.filteredIds = [];
		this.filterMode = false;
		L.GeoJSON.prototype.initialize.call(this, null, options);
		TDMap.Service.GeoJSONProvider.initialize.call(this, options);

		L.setOptions(this, options);
	},

	setStyles: function setStyles(styles) {
		this.styles = styles;
	},

	removeStyles: function removeStyles() {
		this.options.styled = false;
		this.styles = false;
	},

	setLabels: function setLabels(labels) {
		this.labels = labels;
	},

	removeLabels: function removeLabels() {
		this.options.labeled = false;
		this.labels = false;
	},

	onAdd: function onAdd(map) {
		this.map = map;
		L.GeoJSON.prototype.onAdd.call(this, map);
		map.on('moveend', this._updateData, this);
		this._updateData();
	},

	onRemove: function onRemove(map) {
		//удаляем слой//
		this.clearLayers();
		L.GeoJSON.prototype.onRemove.call(this, map);
		map.off('moveend', this._updateData, this);
	},

	_updateData: function _updateData() {
		var bbox;
		if (this.options.bounds) {
			bbox = this.options.bounds;
		} else if (this.options.circle) {
			bbox = this.options.circle;
		} else {
			bbox = this._map.getBounds();
		}

		var zoom = this._map.getZoom();

		if (zoom > this.options.maxZoom || zoom < this.options.minZoom) {
			this.clearLayers();
			return;
		}

		this._updateDataByBounds(bbox, zoom);
	},

	_updateDataByBounds: function _updateDataByBounds(bbox, zoom) {
		var that = this;
		this.getDataByBounds(bbox).then(function (res) {
			var json;
			if (res.data.geoJSON) {
				json = res.data.geoJSON[0] || res.data.geoJSON;
			} else if (res.data.inbounds) {
				json = res.data.inbounds[0];
			}
			that._replaceData(json.features);
		}, function (error) {
			that.clearLayers();
		});
	},

	styleEnebledInZoom: function styleEnebledInZoom(style) {
		var zoom = this.map.getZoom();
		for (var i = this.styles.length - 1; i >= 0; i--) {
			for (var s = this.styles[i].styles.length - 1; s >= 0; s--) {
				if (this.styles[i].styles[s].id === style.id) {
					if (zoom >= this.styles[i].minZoom && zoom <= this.styles[i].maxZoom) {
						return true;
					}
				}
				if (this.styles[i].otherStyle.id === style.id && this.styles[i].otherStyle.allow === true) {
					if (zoom >= this.styles[i].minZoom && zoom <= this.styles[i].maxZoom) {
						return true;
					}
				}
			}
		}
		return false;
	},

	_replaceData: function _replaceData(features) {
		var that = this;
		if (features !== null && features !== undefined) {
			this.clearLayers();
			for (var i = 0; i < features.length; i++) {
				if (features[i] !== null) {
					if (!this.styles) {
						this.addData(features[i]);
					} else {
						if (features[i].styles && features[i].styles.length > 0) {
							for (var s = 0; s < features[i].styles.length; s++) {
								if (features[i].styles[s] !== null && this.styleEnebledInZoom(features[i].styles[s])) {
									features[i].style = features[i].styles[s];
									var dubleFeature = {};
									for (var key in features[i]) {
										dubleFeature[key] = features[i][key];
									}
									this.addData(dubleFeature);
								}
							}
						}
					}
				}
			}
			this.eachLayer(function (layer) {
				if (layer) that._subscribe(layer);
				if (layer.feature.style) {
					layer.setStyle(layer.feature.style);
				}
			});
			this.map.fire('layer:load');
			if (this.filterMode) {
				this.stayOrRemoveViaFilteredIds();
			}
			this.updateLabels();
		} else {
			this.clearLayers();
		}
	},

	updateLabels: function updateLabels() {
		this.clearLabels();
		if (this.labels && this.labels.length > 0) {
			var zoom = this.map.getZoom();
			if (zoom >= this.labels[0].minZoom && zoom <= this.labels[0].maxZoom) {
				this.labelFeatures(this.labels[0]);
			}
		}
	},

	labelFeatures: function labelFeatures(label) {
		var that = this;

		function Point(x, y) {
			this.x = x;
			this.y = y;
		}

		function Region(points) {
			this.points = points || [];
			this.length = points.length;
		}

		Region.prototype.area = function () {
			var area = 0,
			    i,
			    j,
			    point1,
			    point2;
			for (i = 0, j = this.length - 1; i < this.length; j = i, i++) {
				point1 = this.points[i];
				point2 = this.points[j];
				area += point1.x * point2.y;
				area -= point1.y * point2.x;
			}
			area /= 2;
			return area;
		};

		Region.prototype.centroid = function () {
			var x = 0,
			    y = 0,
			    i,
			    j,
			    f,
			    point1,
			    point2;

			for (i = 0, j = this.length - 1; i < this.length; j = i, i++) {
				point1 = this.points[i];
				point2 = this.points[j];
				f = point1.x * point2.y - point2.x * point1.y;
				x += (point1.x + point2.x) * f;
				y += (point1.y + point2.y) * f;
			}
			f = this.area() * 6;
			return new Point(x / f, y / f);
		};

		function isNumber(str) {
			var pattern = /^[0-9]{1,7}([,.][0-9]{1,7})?$/;
			return pattern.test(str);
		}

		that.eachLayer(function (layer) {
			if (layer._path && layer._path.style.visibility !== 'hidden') {
				var textEval = function textEval() {
					if (label.workField.options.type === 'boolean') {
						if (layer.feature.properties.labelvalue !== 'Да' && layer.feature.properties.labelvalue !== 'Нет') {
							if (layer.feature.properties.labelvalue === null || layer.feature.properties.labelvalue === false) {
								layer.feature.properties.labelvalue = 'Нет';
							} else {
								layer.feature.properties.labelvalue = 'Да';
							}
						}
					}
					if (label.designed) {
						var str;
						if (isNumber(layer.feature.properties.labelvalue)) {
							str = label.designedString.replace('{значение}', layer.feature.properties.labelvalue);
						} else {
							str = label.designedString.replace('{значение}', '\'' + layer.feature.properties.labelvalue + '\'');
						}
						if (label.rounded && label.roundedNumber) {
							str = '(' + str + ').toFixed(' + label.roundedNumber + ')';
						}
						try {
							return eval(str);
						} catch (err) {
							that.fire('ERROR', {
								message: 'Ошибка формирования строки подписи. Проверьте составную подпись'
							});
							throw new Error();
						}
					} else {
						return layer.feature.properties.labelvalue;
					}
				};

				layer._path.id = "layer" + layer._leaflet_id;
				var group = d3.select('.leaflet-overlay-pane').select('svg').append('g').attr("class", 'labels');

				var region;
				if (layer._parts && layer._parts[0] && layer._parts[0].length > 0) {
					region = new Region(layer._parts[0]);
				}

				d3.selectAll("#layer" + layer._leaflet_id).each(function (d, i) {
					if (!region) {
						return;
					}
					var bounds = this.getBBox();
					var pos = {
						x: region.centroid().x,
						y: region.centroid().y
					};
					if (pos.x === 0 && pos.y === 0) {
						return;
					}
					if (isNaN(pos.x) || isNaN(pos.y)) {
						return;
					}

					if (pos.x === Number.POSITIVE_INFINITY || pos.x === Number.NEGATIVE_INFINITY) {
						return;
					}
					if (pos.y === Number.POSITIVE_INFINITY || pos.y === Number.NEGATIVE_INFINITY) {
						return;
					}

					group.append('text').attr("class", "oreol").style("stroke", label.oreolColor).style("opacity", label.oreolOpacity).style("stroke-width", label.oreolWidth).style("font-size", label.fontSize).style("text-anchor", 'middle').style("font-family", 'Roboto,Helvetica Neue,sans-serif').attr("x", pos.x).attr("y", pos.y).text(textEval);
					group.append('text').attr("class", "textpath").style("fill", label.textColor).style("fill-opacity", label.textOpacity).style("text-anchor", 'middle').style("font-size", label.fontSize).style("font-family", 'Roboto,Helvetica Neue,sans-serif').attr("x", pos.x).attr("y", pos.y).text(textEval);
				});
			}
		});
	},

	clearLabels: function clearLabels() {
		$(".labels").remove();
	},

	_subscribe: function _subscribe(layer) {
		if (layer) {
			this.layer = layer;
			layer.on('click', this._clickFireAndForward, this);
		}
	},

	_unSubcribeLayer: function _unSubcribeLayer(layer) {
		layer.off('click', this._clickFireAndForward);
	},

	_clickFireAndForward: function _clickFireAndForward(e) {
		this.fire('tdmap:layer:click', e.target);
	},

	stayOrRemoveViaFilteredIds: function stayOrRemoveViaFilteredIds() {
		var that = this;
		this.eachLayer(function (layer) {
			if (that.filteredIds.indexOf(layer.feature.properties.zu_id) === -1) {
				layer._path.style.visibility = "hidden";
			} else {
				if (layer._path.style.visibility === "hidden") {
					layer._path.style.visibility = 'visible';
				}
			}
		});
	},

	setFilteredIds: function setFilteredIds(arrayOfId) {
		this.filteredIds = arrayOfId;
		this.filterMode = true;
		this.stayOrRemoveViaFilteredIds();
		return this;
	},

	removeFilteredIds: function removeFilteredIds() {
		this.filteredIds = null;
		this.filterMode = false;
		this._updateData();
		return this;
	}
});

TDMap.Service.geoJSONServiceLayer = function (options) {
	return new TDMap.Service.GeoJSONServiceLayer(options);
};
'use strict';

// Based on https://github.com/shramov/leaflet-plugins
// GridLayer like https://avinmathew.com/leaflet-and-google-maps/ , but using MutationObserver instead of jQuery


// рџЌ‚class GridLayer.GoogleMutant
// рџЌ‚extends GridLayer
L.GridLayer.GoogleMutant = L.GridLayer.extend({
	includes: L.Mixin.Events,

	options: {
		minZoom: 0,
		maxZoom: 18,
		tileSize: 256,
		subdomains: 'abc',
		errorTileUrl: '',
		attribution: '', // The mutant container will add its own attribution anyways.
		opacity: 1,
		continuousWorld: false,
		noWrap: false,
		// рџЌ‚option type: String = 'roadmap'
		// Google's map type. Valid values are 'roadmap', 'satellite' or 'terrain'. 'hybrid' is not really supported.
		type: 'roadmap',
		maxNativeZoom: 21
	},

	initialize: function initialize(options) {
		L.GridLayer.prototype.initialize.call(this, options);

		this._ready = !!window.google && !!window.google.maps && !!window.google.maps.Map;

		this._GAPIPromise = this._ready ? Promise.resolve(window.google) : new Promise(function (resolve, reject) {
			var checkCounter = 0;
			var intervalId = null;
			intervalId = setInterval(function () {
				if (checkCounter >= 10) {
					clearInterval(intervalId);
					return reject(new Error('window.google not found after 10 attempts'));
				}
				if (!!window.google && !!window.google.maps && !!window.google.maps.Map) {
					clearInterval(intervalId);
					return resolve(window.google);
				}
				checkCounter++;
			}, 500);
		});

		// Couple data structures indexed by tile key
		this._tileCallbacks = {}; // Callbacks for promises for tiles that are expected
		this._freshTiles = {}; // Tiles from the mutant which haven't been requested yet

		this._imagesPerTile = this.options.type === 'hybrid' ? 2 : 1;
		this.createTile = this.options.type === 'hybrid' ? this._createMultiTile : this._createSingleTile;
	},

	onAdd: function onAdd(map) {
		L.GridLayer.prototype.onAdd.call(this, map);
		this._initMutantContainer();

		this._GAPIPromise.then(function () {
			this._ready = true;
			this._map = map;

			this._initMutant();

			map.on('viewreset', this._reset, this);
			map.on('move', this._update, this);
			map.on('zoomend', this._handleZoomAnim, this);
			map.on('resize', this._resize, this);

			//20px instead of 1em to avoid a slight overlap with google's attribution
			map._controlCorners.bottomright.style.marginBottom = '20px';

			this._reset();
			this._update();
		}.bind(this));
	},

	onRemove: function onRemove(map) {
		L.GridLayer.prototype.onRemove.call(this, map);
		map._container.removeChild(this._mutantContainer);
		this._mutantContainer = undefined;

		map.off('viewreset', this._reset, this);
		map.off('move', this._update, this);
		map.off('zoomend', this._handleZoomAnim, this);
		map.off('resize', this._resize, this);

		map._controlCorners.bottomright.style.marginBottom = '0em';
	},

	getAttribution: function getAttribution() {
		return this.options.attribution;
	},

	setOpacity: function setOpacity(opacity) {
		this.options.opacity = opacity;
		if (opacity < 1) {
			L.DomUtil.setOpacity(this._mutantContainer, opacity);
		}
	},

	setElementSize: function setElementSize(e, size) {
		e.style.width = size.x + 'px';
		e.style.height = size.y + 'px';
	},

	_initMutantContainer: function _initMutantContainer() {
		if (!this._mutantContainer) {
			this._mutantContainer = L.DomUtil.create('div', 'leaflet-google-mutant leaflet-top leaflet-left');
			this._mutantContainer.id = '_MutantContainer_' + L.Util.stamp(this._mutantContainer);
			this._mutantContainer.style.position = 'relative';
			this._mutantContainer.style.pointerEvents = 'none';

			this._map.getContainer().appendChild(this._mutantContainer);
		}

		this.setOpacity(this.options.opacity);
		this.setElementSize(this._mutantContainer, this._map.getSize());

		this._attachObserver(this._mutantContainer);
	},

	_initMutant: function _initMutant() {
		if (!this._ready || !this._mutantContainer) return;
		this._mutantCenter = new google.maps.LatLng(0, 0);

		var map = new google.maps.Map(this._mutantContainer, {
			center: this._mutantCenter,
			zoom: 0,
			tilt: 0,
			mapTypeId: this.options.type,
			disableDefaultUI: true,
			keyboardShortcuts: false,
			draggable: false,
			disableDoubleClickZoom: true,
			scrollwheel: false,
			streetViewControl: false,
			styles: this.options.styles || {},
			backgroundColor: 'transparent'
		});

		this._mutant = map;

		// рџЌ‚event spawned
		// Fired when the mutant has been created.
		this.fire('spawned', {
			mapObject: map
		});
	},

	_attachObserver: function _attachObserver(node) {
		// 		console.log('Gonna observe', node);

		var observer = new MutationObserver(this._onMutations.bind(this));

		// pass in the target node, as well as the observer options
		observer.observe(node, {
			childList: true,
			subtree: true
		});
	},

	_onMutations: function _onMutations(mutations) {
		for (var i = 0; i < mutations.length; ++i) {
			var mutation = mutations[i];
			for (var j = 0; j < mutation.addedNodes.length; ++j) {
				var node = mutation.addedNodes[j];

				if (node instanceof HTMLImageElement) {
					this._onMutatedImage(node);
				} else if (node instanceof HTMLElement) {
					Array.prototype.forEach.call(node.querySelectorAll('img'), this._onMutatedImage.bind(this));
				}
			}
		}
	},

	// Only images which 'src' attrib match this will be considered for moving around.
	// Looks like some kind of string-based protobuf, maybe??
	// Only the roads (and terrain, and vector-based stuff) match this pattern
	_roadRegexp: /!1i(\d+)!2i(\d+)!3i(\d+)!/,

	// On the other hand, raster imagery matches this other pattern
	_satRegexp: /x=(\d+)&y=(\d+)&z=(\d+)/,

	// On small viewports, when zooming in/out, a static image is requested
	// This will not be moved around, just removed from the DOM.
	_staticRegExp: /StaticMapService\.GetMapImage/,

	_onMutatedImage: function _onMutatedImage(imgNode) {
		// 		if (imgNode.src) {
		// 			console.log('caught mutated image: ', imgNode.src);
		// 		}

		var coords;
		var match = imgNode.src.match(this._roadRegexp);
		var sublayer, parent;

		if (match) {
			coords = {
				z: match[1],
				x: match[2],
				y: match[3]
			};
			if (this._imagesPerTile > 1) {
				imgNode.style.zIndex = 0;
			}
			sublayer = 1;
		} else {
			match = imgNode.src.match(this._satRegexp);
			if (match) {
				coords = {
					x: match[1],
					y: match[2],
					z: match[3]
				};
			}
			//	imgNode.style.zIndex = 0;
			sublayer = 0;
		}

		if (coords) {
			var key = this._tileCoordsToKey(coords);
			imgNode.style.position = 'absolute';
			if (this._imagesPerTile > 1) {
				key += '/' + sublayer;
			}
			if (key in this._tileCallbacks && this._tileCallbacks[key]) {
				// console.log('Fullfilling callback ', key);
				this._tileCallbacks[key].pop()(imgNode);
				if (!this._tileCallbacks[key].length) {
					delete this._tileCallbacks[key];
				}
			} else {
				// console.log('Caching for later', key);
				parent = imgNode.parentNode;
				if (parent) {
					parent.removeChild(imgNode);
					parent.removeChild = L.Util.falseFn;
					// 					imgNode.parentNode.replaceChild(L.DomUtil.create('img'), imgNode);
				}
				if (key in this._freshTiles) {
					this._freshTiles[key].push(imgNode);
				} else {
					this._freshTiles[key] = [imgNode];
				}
			}
		} else if (imgNode.src.match(this._staticRegExp)) {
			parent = imgNode.parentNode;
			if (parent) {
				// Remove the image, but don't store it anywhere.
				// Image needs to be replaced instead of removed, as the container
				// seems to be reused.
				imgNode.parentNode.replaceChild(L.DomUtil.create('img'), imgNode);
			}
		}
	},

	// This will be used as this.createTile for 'roadmap', 'sat', 'terrain'
	_createSingleTile: function createTile(coords, done) {
		var key = this._tileCoordsToKey(coords);
		// console.log('Need:', key);

		if (key in this._freshTiles) {
			var tile = this._freshTiles[key].pop();
			if (!this._freshTiles[key].length) {
				delete this._freshTiles[key];
			}
			L.Util.requestAnimFrame(done);
			// 			console.log('Got ', key, ' from _freshTiles');
			return tile;
		} else {
			var tileContainer = L.DomUtil.create('div');
			this._tileCallbacks[key] = this._tileCallbacks[key] || [];
			this._tileCallbacks[key].push(function (c /*, k*/) {
				return function (imgNode) {
					var parent = imgNode.parentNode;
					if (parent) {
						parent.removeChild(imgNode);
						parent.removeChild = L.Util.falseFn;
						// 						imgNode.parentNode.replaceChild(L.DomUtil.create('img'), imgNode);
					}
					c.appendChild(imgNode);
					done();
					// 					console.log('Sent ', k, ' to _tileCallbacks');
				}.bind(this);
			}.bind(this)(tileContainer /*, key*/));

			return tileContainer;
		}
	},

	// This will be used as this.createTile for 'hybrid'
	_createMultiTile: function createTile(coords, done) {
		var key = this._tileCoordsToKey(coords);

		var tileContainer = L.DomUtil.create('div');
		tileContainer.dataset.pending = this._imagesPerTile;

		for (var i = 0; i < this._imagesPerTile; i++) {
			var key2 = key + '/' + i;
			if (key2 in this._freshTiles) {
				tileContainer.appendChild(this._freshTiles[key2].pop());
				if (!this._freshTiles[key2].length) {
					delete this._freshTiles[key2];
				}
				tileContainer.dataset.pending--;
				// 				console.log('Got ', key2, ' from _freshTiles');
			} else {
				this._tileCallbacks[key2] = this._tileCallbacks[key2] || [];
				this._tileCallbacks[key2].push(function (c /*, k2*/) {
					return function (imgNode) {
						var parent = imgNode.parentNode;
						if (parent) {
							parent.removeChild(imgNode);
							parent.removeChild = L.Util.falseFn;
							// 							imgNode.parentNode.replaceChild(L.DomUtil.create('img'), imgNode);
						}
						c.appendChild(imgNode);
						c.dataset.pending--;
						if (!parseInt(c.dataset.pending)) {
							done();
						}
						// 						console.log('Sent ', k2, ' to _tileCallbacks, still ', c.dataset.pending, ' images to go');
					}.bind(this);
				}.bind(this)(tileContainer /*, key2*/));
			}
		}

		if (!parseInt(tileContainer.dataset.pending)) {
			L.Util.requestAnimFrame(done);
		}
		return tileContainer;
	},

	_checkZoomLevels: function _checkZoomLevels() {
		//setting the zoom level on the Google map may result in a different zoom level than the one requested
		//(it won't go beyond the level for which they have data).
		// verify and make sure the zoom levels on both Leaflet and Google maps are consistent
		if (this._map.getZoom() !== undefined && this._mutant.getZoom() !== this._map.getZoom()) {
			//zoom levels are out of sync. Set the leaflet zoom level to match the google one
			this._map.setZoom(this._mutant.getZoom());
		}
	},

	_reset: function _reset() {
		this._initContainer();
	},

	_update: function _update() {
		L.GridLayer.prototype._update.call(this);
		if (!this._mutant) return;

		var center = this._map.getCenter();
		var _center = new google.maps.LatLng(center.lat, center.lng);

		this._mutant.setCenter(_center);
		var zoom = this._map.getZoom();
		if (zoom !== undefined) {
			this._mutant.setZoom(Math.round(this._map.getZoom()));
		}
	},

	_resize: function _resize() {
		var size = this._map.getSize();
		if (this._mutantContainer.style.width === size.x && this._mutantContainer.style.height === size.y) return;
		this.setElementSize(this._mutantContainer, size);
		if (!this._mutant) return;
		google.maps.event.trigger(this._mutant, 'resize');
	},

	_handleZoomAnim: function _handleZoomAnim() {
		var center = this._map.getCenter();
		var _center = new google.maps.LatLng(center.lat, center.lng);

		this._mutant.setCenter(_center);
		this._mutant.setZoom(Math.round(this._map.getZoom()));
	},

	// Agressively prune _freshtiles when a tile with the same key is removed,
	// this prevents a problem where Leaflet keeps a loaded tile longer than
	// GMaps, so that GMaps makes two requests but Leaflet only consumes one,
	// polluting _freshTiles with stale data.
	_removeTile: function _removeTile(key) {
		if (this._imagesPerTile > 1) {
			for (var i = 0; i < this._imagesPerTile; i++) {
				var key2 = key + '/' + i;
				if (key2 in this._freshTiles) {
					delete this._freshTiles[key2];
				}
				// 				console.log('Pruned spurious hybrid _freshTiles');
			}
		} else {
			if (key in this._freshTiles) {
				delete this._freshTiles[key];
				// 				console.log('Pruned spurious _freshTiles', key);
			}
		}

		return L.GridLayer.prototype._removeTile.call(this, key);
	}
});

// рџЌ‚factory gridLayer.googleMutant(options)
// Returns a new `GridLayer.GoogleMutant` given its options
L.gridLayer.googleMutant = function (options) {
	return new L.GridLayer.GoogleMutant(options);
};

TDMap.Service.GoogleMutant = L.GridLayer.GoogleMutant;
TDMap.Service.googleMutant = L.gridLayer.googleMutant;
'use strict';

/*
 * L.TileLayer.Rosreestr
 */
+function () {
    var addTileUrlMixin = function addTileUrlMixin(BaseClass) {
        return BaseClass.extend({
            options: {
                tileSize: 256
            },
            getTileUrl: function getTileUrl(tilePoint) {
                var map = this._map,
                    crs = map.options.crs,
                    tileSize = this.options.tileSize,
                    nwPoint = tilePoint.multiplyBy(tileSize),
                    sePoint = nwPoint.add([tileSize, tileSize]);

                var nw = crs.project(map.unproject(nwPoint, tilePoint.z)),
                    se = crs.project(map.unproject(sePoint, tilePoint.z)),
                    bbox = [nw.x, se.y, se.x, nw.y].join(',');

                return L.Util.template(this._url, L.extend({
                    s: this._getSubdomain(tilePoint),
                    bbox: bbox
                }, this.options));
            }
        });
    };
    var addInteractionMixin = function addInteractionMixin(BaseClass) {
        return BaseClass.extend({
            onAdd: function onAdd(map) {
                L.TileLayer.prototype.onAdd.call(this, map);
                if (this.options.clickable) {
                    L.DomUtil.addClass(this._container, 'leaflet-clickable-raster-layer');
                    if (this._needInitInteraction) {
                        this._initInteraction();
                        this._needInitInteraction = false;
                    }
                }
            },
            _needInitInteraction: true,

            _initInteraction: function _initInteraction() {
                var div = this._container,
                    events = ['dblclick', 'click', 'mousedown', 'mouseover', 'mouseout', 'contextmenu'];

                for (var i = 0; i < events.length; i++) {
                    L.DomEvent.on(div, events[i], this._fireMouseEvent, this);
                }
            },
            _fireMouseEvent: function _fireMouseEvent(e) {
                var map = this._map;
                if (map.dragging && map.dragging.moved()) {
                    return;
                }

                var containerPoint = map.mouseEventToContainerPoint(e),
                    layerPoint = map.containerPointToLayerPoint(containerPoint),
                    latlng = map.layerPointToLatLng(layerPoint);

                this.fire(e.type, {
                    latlng: latlng,
                    layerPoint: layerPoint,
                    containerPoint: containerPoint,
                    originalEvent: e
                });
            }
        });
    };
    L.TileLayer.Rosreestr = addTileUrlMixin(L.TileLayer);

    L.tileLayer.Rosreestr = function (url, options) {
        if (options.clickable) {
            L.TileLayer.Rosreestr = addInteractionMixin(L.TileLayer.Rosreestr);
        }
        return new L.TileLayer.Rosreestr(url, options);
    };
    TDMap.Service.RosreestrProvider = L.TileLayer.Rosreestr;
}();
'use strict';

L.GridLayer.YandexMutant = L.GridLayer.extend({
    includes: L.Mixin.Events,

    options: {
        minZoom: 0,
        maxZoom: 18,
        // The mutant container will add its own attribution anyways.
        attribution: '',
        opacity: 1,
        traffic: false,
        noWrap: false,
        type: 'yandex#map'
    },

    possibleShortMapTypes: {
        schemaMap: 'map',
        satelliteMap: 'satellite',
        hybridMap: 'hybrid',
        publicMap: 'publicMap',
        publicMapInHybridView: 'publicMapHybrid'
    },

    _getPossibleMapType: function _getPossibleMapType(mapType) {
        var result = 'yandex#map';
        if (typeof mapType !== 'string') {
            return result;
        }
        for (var key in this.possibleShortMapTypes) {
            if (mapType === this.possibleShortMapTypes[key]) {
                result = 'yandex#' + mapType;
                break;
            }
            if (mapType === 'yandex#' + this.possibleShortMapTypes[key]) {
                result = mapType;
            }
        }
        return result;
    },

    initialize: function initialize(options) {
        if (options && options.type) {
            options.type = this._getPossibleMapType(options.type);
        }
        L.GridLayer.prototype.initialize.call(this, options);

        this._ready = !!window.ymaps && !!window.ymaps.Map;

        this._YAPIPromise = this._ready ? Promise.resolve(window.ymaps) : new Promise(function (resolve, reject) {
            var checkCounter = 0;
            var intervalId = null;
            intervalId = setInterval(function () {
                if (checkCounter >= 10) {
                    clearInterval(intervalId);
                    return reject(new Error('window.ymaps not found after 10 attempts'));
                }
                if (!!window.ymaps) {
                    clearInterval(intervalId);
                    if (ymaps.Map === undefined) {
                        return ymaps.load(['package.map'], resolve, ymaps);
                    } else {
                        return resolve(window.ymaps);
                    }
                }
                checkCounter++;
            }, 500);
        });

        // Couple data structures indexed by tile key
        this._tileCallbacks = {}; // Callbacks for promises for tiles that are expected
        this._freshTiles = {}; // Tiles from the mutant which haven't been requested yet

        this._imagesPerTile = 1;
        this.createTile = this._createSingleTile;
    },

    onAdd: function onAdd(map) {
        L.GridLayer.prototype.onAdd.call(this, map);
        this._initMutantContainer();

        this._YAPIPromise.then(function () {
            this._ready = true;
            this._map = map;

            this._initMutant();

            map.on('viewreset', this._reset, this);
            map.on('move', this._update, this);
            map.on('zoomend', this._handleZoomAnim, this);
            map.on('resize', this._resize, this);

            map._controlCorners.bottomright.style.marginBottom = '4em';

            this._reset();
            this._update();
        }.bind(this));
    },

    onRemove: function onRemove(map) {
        L.GridLayer.prototype.onRemove.call(this, map);
        map._container.removeChild(this._mutantContainer);
        console.log(this._map);
        this._mutantContainer = undefined;

        map.off('viewreset', this._reset, this);
        map.off('move', this._update, this);
        map.off('zoomend', this._handleZoomAnim, this);
        map.off('resize', this._resize, this);

        map._controlCorners.bottomright.style.marginBottom = '0em';
    },

    getAttribution: function getAttribution() {
        return this.options.attribution;
    },

    setOpacity: function setOpacity(opacity) {
        this.options.opacity = opacity;
        if (opacity < 1) {
            L.DomUtil.setOpacity(this._mutantContainer, opacity);
        }
    },

    setElementSize: function setElementSize(e, size) {
        e.style.width = size.x + 'px';
        e.style.height = size.y + 'px';
    },

    _initMutantContainer: function _initMutantContainer() {
        if (!this._mutantContainer) {
            this._mutantContainer = L.DomUtil.create('div', 'leaflet-yandex-mutant leaflet-top leaflet-left');
            this._mutantContainer.id = '_MutantContainer_' + L.Util.stamp(this._mutantContainer);
            this._mutantContainer.style.zIndex = 'auto';
            this._mutantContainer.style.pointerEvents = 'none';

            this._map.getContainer().appendChild(this._mutantContainer);
        }

        this.setOpacity(this.options.opacity);
        this.setElementSize(this._mutantContainer, this._map.getSize());

        this._attachObserver(this._mutantContainer);
    },

    _initMutant: function _initMutant() {
        if (!this._ready || !this._mutantContainer) return;
        this._mutantCenter = [0, 0];

        // If traffic layer is requested check if control.TrafficControl is ready
        if (this.options.traffic) {
            if (ymaps.control === undefined || ymaps.control.TrafficControl === undefined) {
                return ymaps.load(['package.traffic', 'package.controls'], this._initMutant, this);
            }
        }

        var map = new ymaps.Map(this._mutantContainer, {
            center: this._mutantCenter,
            zoom: 0,
            type: this.options.type,
            behaviors: [],
            controls: []
        }, {
            autoFitToViewport: 'none',
            exitFullscreenByEsc: false,
            yandexMapDisablePoiInteractivity: true
        });

        if (this.options.traffic) {
            map.controls.add(new ymaps.control.TrafficControl({
                shown: true
            }));
        }

        if (this.options.type === 'yandex#null') {
            this.options.type = new ymaps.MapType('null', []);
            map.container.getElement().style.background = 'transparent';
        }
        map.setType(this.options.type);

        this._mutant = map;

        // 🍂event spawned
        // Fired when the mutant has been created.
        this.fire('spawned', {
            mapObject: map
        });
    },

    _attachObserver: function _attachObserver(node) {
        var observer = new MutationObserver(this._onMutations.bind(this));

        // pass in the target node, as well as the observer options
        observer.observe(node, {
            childList: true,
            subtree: true
        });
    },

    _onMutations: function _onMutations(mutations) {
        for (var i = 0; i < mutations.length; ++i) {
            var mutation = mutations[i];
            for (var j = 0; j < mutation.addedNodes.length; ++j) {
                var node = mutation.addedNodes[j];

                if (node instanceof HTMLImageElement) {
                    this._onMutatedImage(node);
                } else if (node instanceof HTMLElement) {
                    Array.prototype.forEach.call(node.querySelectorAll('img'), this._onMutatedImage.bind(this));
                }
            }
        }
    },

    // Only images which 'src' attrib match this will be considered for moving around.
    // Looks like some kind of string-based protobuf, maybe??
    // Only the roads (and terrain, and vector-based stuff) match this pattern
    _roadRegexp: /!1i(\d+)!2i(\d+)!3i(\d+)!/,

    // On the other hand, raster imagery matches this other pattern
    _satRegexp: /x=(\d+)&y=(\d+)&z=(\d+)/,

    // On small viewports, when zooming in/out, a static image is requested
    // This will not be moved around, just removed from the DOM.
    _staticRegExp: /StaticMapService\.GetMapImage/,

    _onMutatedImage: function _onMutatedImage(imgNode) {
        console.log(imgNode);
        var coords;
        var match = imgNode.src.match(this._roadRegexp);
        var sublayer, parent;

        if (match) {
            coords = {
                z: match[1],
                x: match[2],
                y: match[3]
            };
            if (this._imagesPerTile > 1) {
                imgNode.style.zIndex = 1;
            }
            sublayer = 1;
        } else {
            match = imgNode.src.match(this._satRegexp);
            if (match) {
                coords = {
                    x: match[1],
                    y: match[2],
                    z: match[3]
                };
            }
            sublayer = 0;
        }

        if (coords) {
            var key = this._tileCoordsToKey(coords);
            if (this._imagesPerTile > 1) {
                key += '/' + sublayer;
            }
            if (key in this._tileCallbacks && this._tileCallbacks[key]) {
                // console.log('Fullfilling callback ', key);
                this._tileCallbacks[key].pop()(imgNode);
                if (!this._tileCallbacks[key].length) {
                    delete this._tileCallbacks[key];
                }
            } else {
                // console.log('Caching for later', key);
                parent = imgNode.parentNode;
                if (parent) {
                    parent.removeChild(imgNode);
                    parent.removeChild = L.Util.falseFn;
                    //                  imgNode.parentNode.replaceChild(L.DomUtil.create('img'), imgNode);
                }
                if (key in this._freshTiles) {
                    this._freshTiles[key].push(imgNode);
                } else {
                    this._freshTiles[key] = [imgNode];
                }
            }
        } else if (imgNode.src.match(this._staticRegExp)) {
            parent = imgNode.parentNode;
            if (parent) {
                // Remove the image, but don't store it anywhere.
                // Image needs to be replaced instead of removed, as the container
                // seems to be reused.
                imgNode.parentNode.replaceChild(L.DomUtil.create('img'), imgNode);
            }
        }
    },

    // This will be used as this.createTile for 'map', 'satellite'
    _createSingleTile: function _createSingleTile(coords, done) {
        var key = this._tileCoordsToKey(coords);
        // console.log('Need:', key);

        if (key in this._freshTiles) {
            var tile = this._freshTiles[key].pop();
            if (!this._freshTiles[key].length) {
                delete this._freshTiles[key];
            }
            L.Util.requestAnimFrame(done);
            //          console.log('Got ', key, ' from _freshTiles');
            return tile;
        } else {
            var tileContainer = L.DomUtil.create('div');
            this._tileCallbacks[key] = this._tileCallbacks[key] || [];
            this._tileCallbacks[key].push(function (c /*, k*/) {
                return function (imgNode) {
                    var parent = imgNode.parentNode;
                    if (parent) {
                        parent.removeChild(imgNode);
                        parent.removeChild = L.Util.falseFn;
                        //                      imgNode.parentNode.replaceChild(L.DomUtil.create('img'), imgNode);
                    }
                    c.appendChild(imgNode);
                    done();
                    //                  console.log('Sent ', k, ' to _tileCallbacks');
                }.bind(this);
            }.bind(this)(tileContainer /*, key*/));

            return tileContainer;
        }
    },

    _checkZoomLevels: function _checkZoomLevels() {
        //setting the zoom level on the Google map may result in a different zoom level than the one requested
        //(it won't go beyond the level for which they have data).
        // verify and make sure the zoom levels on both Leaflet and Google maps are consistent
        if (this._map.getZoom() !== undefined && this._mutant.getZoom() !== this._map.getZoom()) {
            //zoom levels are out of sync. Set the leaflet zoom level to match the google one
            this._map.setZoom(this._mutant.getZoom());
        }
    },

    _reset: function _reset() {
        this._initContainer();
    },

    _update: function _update() {
        L.GridLayer.prototype._update.call(this);
        if (!this._mutant) return;

        var center = this._map.getCenter();
        var _center = [center.lat, center.lng];

        this._mutant.setCenter(_center);
        console.log(this._mutant);
        var zoom = this._map.getZoom();
        if (zoom !== undefined) {
            this._mutant.setZoom(Math.round(this._map.getZoom()));
        }
    },

    _resize: function _resize() {
        var size = this._map.getSize();
        if (this._mutantContainer.style.width === size.x && this._mutantContainer.style.height === size.y) return;
        this.setElementSize(this._mutantContainer, size);
        if (!this._mutant) return;
        this._mutant.container.fitToViewport();
    },

    _handleZoomAnim: function _handleZoomAnim() {
        var center = this._map.getCenter();
        var _center = [center.lat, center.lng];

        this._mutant.setCenter(_center);
        this._mutant.setZoom(Math.round(this._map.getZoom()));
    },

    // Agressively prune _freshtiles when a tile with the same key is removed,
    // this prevents a problem where Leaflet keeps a loaded tile longer than
    // YMaps, so that YMaps makes two requests but Leaflet only consumes one,
    // polluting _freshTiles with stale data.
    _removeTile: function _removeTile(key) {
        if (this._imagesPerTile > 1) {
            for (var i = 0; i < this._imagesPerTile; i++) {
                var key2 = key + '/' + i;
                if (key2 in this._freshTiles) {
                    delete this._freshTiles[key2];
                }
                //              console.log('Pruned spurious hybrid _freshTiles');
            }
        } else {
            if (key in this._freshTiles) {
                delete this._freshTiles[key];
                //              console.log('Pruned spurious _freshTiles', key);
            }
        }

        return L.GridLayer.prototype._removeTile.call(this, key);
    }
});

// 🍂factory gridLayer.googleMutant(options)
// Returns a new `GridLayer.GoogleMutant` given its options
L.gridLayer.yandexMutant = function (options) {
    return new L.GridLayer.YandexMutant(options);
};

L.gridLayer.yandexMutant = function (options) {
    return new L.GridLayer.YandexMutant(options);
};
TDMap.Service.YandexMutant = L.gridLayer.YandexMutant;
TDMap.Service.yandexMutant = L.gridLayer.yandexMutant;
'use strict';

TDMap.Service.YandexProvider = L.Layer.extend({
	includes: L.Mixin.Events,

	options: {
		minZoom: 0,
		maxZoom: 18,
		attribution: '',
		opacity: 1,
		traffic: false
	},

	possibleShortMapTypes: {
		schemaMap: 'map',
		satelliteMap: 'satellite',
		hybridMap: 'hybrid',
		publicMap: 'publicMap',
		publicMapInHybridView: 'publicMapHybrid'
	},

	_getPossibleMapType: function _getPossibleMapType(mapType) {
		var result = 'yandex#map';
		if (typeof mapType !== 'string') {
			return result;
		}
		for (var key in this.possibleShortMapTypes) {
			if (mapType === this.possibleShortMapTypes[key]) {
				result = 'yandex#' + mapType;
				break;
			}
			if (mapType === 'yandex#' + this.possibleShortMapTypes[key]) {
				result = mapType;
			}
		}
		return result;
	},

	// Possible types: yandex#map, yandex#satellite, yandex#hybrid, yandex#publicMap, yandex#publicMapHybrid
	// Or their short names: map, satellite, hybrid, publicMap, publicMapHybrid
	initialize: function initialize(type, options) {
		L.Util.setOptions(this, options);
		//Assigning an initial map type for the Yandex layer
		this._type = this._getPossibleMapType(type);
	},

	onAdd: function onAdd(map, insertAtTheBottom) {
		this._map = map;
		this._insertAtTheBottom = insertAtTheBottom;

		// create a container div for tiles
		this._initContainer();
		this._initMapObject();

		// set up events
		map.on('viewreset', this._reset, this);

		this._limitedUpdate = L.Util.throttle(this._update, 1, this);
		map.on('move', this._update, this);
		//map.on('drag', this._update, this);

		map._controlCorners.bottomright.style.marginBottom = '3em';

		this._reset();
		this._update(true);
	},

	onRemove: function onRemove(map) {
		this._map._container.removeChild(this._container);

		this._map.off('viewreset', this._reset, this);

		this._map.off('move', this._update, this);
		//this._map.off('drag', this._update, this);
		map._controlCorners.bottomright.style.marginBottom = '0em';
	},

	getAttribution: function getAttribution() {
		return this.options.attribution;
	},

	setOpacity: function setOpacity(opacity) {
		this.options.opacity = opacity;
		if (opacity < 1) {
			L.DomUtil.setOpacity(this._container, opacity);
		}
	},

	setElementSize: function setElementSize(e, size) {
		e.style.width = size.x + 'px';
		e.style.height = size.y + 'px';
	},

	_initContainer: function _initContainer() {
		var tilePane = this._map._container,
		    first = tilePane.firstChild;

		if (!this._container) {
			this._container = L.DomUtil.create('div', 'leaflet-yandex-layer leaflet-top leaflet-left');
			this._container.id = '_YMapContainer_' + L.Util.stamp(this);
			this._container.style.zIndex = 'auto';
		}

		if (this.options.overlay) {
			first = this._map._container.getElementsByClassName('leaflet-map-pane')[0];
			first = first.nextSibling;
			// XXX: Bug with layer order
			if (L.Browser.opera) this._container.className += ' leaflet-objects-pane';
		}
		tilePane.insertBefore(this._container, first);

		this.setOpacity(this.options.opacity);
		this.setElementSize(this._container, this._map.getSize());
	},

	_initMapObject: function _initMapObject() {
		if (this._yandex) return;

		// Check that ymaps.Map is ready
		if (ymaps.Map === undefined) {
			return ymaps.load(['package.map'], this._initMapObject, this);
		}

		// If traffic layer is requested check if control.TrafficControl is ready
		if (this.options.traffic) if (ymaps.control === undefined || ymaps.control.TrafficControl === undefined) {
			return ymaps.load(['package.traffic', 'package.controls'], this._initMapObject, this);
		}
		//Creating ymaps map-object without any default controls on it
		var map = new ymaps.Map(this._container, {
			center: [0, 0],
			zoom: 0,
			behaviors: [],
			controls: []
		});

		if (this.options.traffic) map.controls.add(new ymaps.control.TrafficControl({
			shown: true
		}));

		if (this._type === 'yandex#null') {
			this._type = new ymaps.MapType('null', []);
			map.container.getElement().style.background = 'transparent';
		}
		map.setType(this._type);

		this._yandex = map;
		this._update(true);

		//Reporting that map-object was initialized
		this.fire('MapObjectInitialized', {
			mapObject: map
		});
	},

	_reset: function _reset() {
		this._initContainer();
	},

	_update: function _update(force) {
		if (!this._yandex) return;
		this._resize(force);

		var center = this._map.getCenter();
		var _center = [center.lat, center.lng];
		this._yandex.setCenter(_center);
		var zoom = this._map.getZoom();
		if (zoom !== undefined) {
			this._yandex.setZoom(Math.round(this._map.getZoom()));
		}
	},

	_resize: function _resize(force) {
		var size = this._map.getSize(),
		    style = this._container.style;
		if (style.width === size.x + 'px' && style.height === size.y + 'px') if (force !== true) return;
		this.setElementSize(this._container, size);
		this._yandex.container.fitToViewport();
	}
});
'use strict';

TDMap.Routing.RouteProvider = L.Class.extend({

	options: {
		baseUrl: 'http://188.134.5.249:3030/route/v1/driving/'
	},

	initialize: function initialize(options) {
		L.setOptions(this, options);
		this.startPoint = null;
		this.endPoint = null;
		this.middlePoints = [];
	},

	request: function request() {
		this.checkPoints();
		var that = this;
		var $http = TDMap.Utils.Promise.httpPromise();
		return $http({
			type: 'GET',
			url: that.getUrl(),
			params: {
				alternatives: false,
				overview: false,
				steps: true
			}
		});
	},

	parceResult: function parceResult(res) {
		var routes = [];
		for (var i = 0; i < res.routes.length; i++) {
			var route = {
				distance: res.routes[i].distance,
				waypoints: res.waypoints
			};
			route.legs = [];
			for (var l = 0; l < res.routes[i].legs.length; l++) {
				var leg = {
					distance: res.routes[i].legs[l].distance,
					summary: res.routes[i].legs[l].summary
				};
				leg.steps = [];
				for (var s = 0; s < res.routes[i].legs[l].steps.length; s++) {
					var step = {
						distance: res.routes[i].legs[l].steps[s].distance,
						geometry: this._decode(res.routes[i].legs[l].steps[s].geometry),
						mode: res.routes[i].legs[l].steps[s].mode,
						name: res.routes[i].legs[l].steps[s].name
					};
					leg.steps.push(step);
				}
				route.legs.push(leg);
			}
			routes.push(route);
		}
		return routes;
	},

	getUrl: function getUrl() {
		return this.options.url + this.getEndPointAsString() + ";" + this.getMiddlePointsAsString() + this.getStartPointAsString();
	},

	setStartPoint: function setStartPoint(cords) {
		if (cords instanceof L.LatLng) {
			this.startPoint = cords;
		} else {
			this.startPoint = new L.LatLng(cords[0], cords[1]);
		}
		return this;
	},

	setEndPoint: function setEndPoint(cords) {
		if (cords instanceof L.LatLng) {
			this.endPoint = cords;
		} else {
			this.endPoint = new L.LatLng(cords[0], cords[1]);
		}
		return this;
	},

	setMiddlePoints: function setMiddlePoints(cordsArray) {
		if (this.middlePoints.length > 0) {
			this.middlePoints = [];
		}
		for (var i = 0; i < cordsArray.length; i++) {
			var cords = cordsArray[i];
			if (cords) {
				this.middlePoints.push(cords);
			} else {
				this.middlePoints.push(new L.LatLng(cords[0], cords[1]));
			}
		}
		return this;
	},

	getStartPoint: function getStartPoint() {
		return this.startPoint;
	},

	getEndPoint: function getEndPoint() {
		return this.endPoint;
	},

	getMiddlePoints: function getMiddlePoints() {
		return this.middlePoints;
	},

	getStartPointAsString: function getStartPointAsString() {
		return "" + this.startPoint.lng + ',' + this.startPoint.lat;
	},

	getEndPointAsString: function getEndPointAsString() {
		return "" + this.endPoint.lng + ',' + this.endPoint.lat;
	},

	getMiddlePointsAsString: function getMiddlePointsAsString() {
		var result = '';
		if (this.middlePoints.length > 0) {
			for (var i = 0; i < this.middlePoints.length; i++) {
				result = result + this.middlePoints[i].lng + ',' + this.middlePoints[i].lat + ';';
			}
		}
		return result;
	},
	checkPoints: function checkPoints() {
		if (this.startPoint === null || this.startPoint === undefined) {
			alert('Не задана начальная точка');
			return;
		}
		if (this.endPoint === null || this.endPoint === undefined) {
			alert('Не задана конечная точка');
			return;
		}
	},

	_decode: function _decode(str, precision) {
		var index = 0,
		    lat = 0,
		    lng = 0,
		    coordinates = [],
		    shift = 0,
		    result = 0,
		    byte = null,
		    latitude_change,
		    longitude_change,
		    factor = Math.pow(10, precision || 5);
		while (index < str.length) {
			byte = null;
			shift = 0;
			result = 0;

			do {
				byte = str.charCodeAt(index++) - 63;
				result |= (byte & 0x1f) << shift;
				shift += 5;
			} while (byte >= 0x20);

			latitude_change = result & 1 ? ~(result >> 1) : result >> 1;
			shift = result = 0;
			do {
				byte = str.charCodeAt(index++) - 63;
				result |= (byte & 0x1f) << shift;
				shift += 5;
			} while (byte >= 0x20);
			longitude_change = result & 1 ? ~(result >> 1) : result >> 1;
			lat += latitude_change;
			lng += longitude_change;
			coordinates.push([lat / factor, lng / factor]);
		}
		return coordinates;
	}
});

TDMap.Routing.RouterPolyline = L.Polyline.extend({
	options: {
		className: 'leaflet-interactive router-polyline'
	}
});

TDMap.Routing.RouterSubhiddenVertex = L.Editable.VertexMarker.extend({
	options: {
		className: 'leaflet-div-icon leaflet-editing-icon router-hidden-edge'
	}
});

TDMap.Routing.RouterStartEndVertex = L.Marker.extend({
	options: {
		className: 'router-start-end'
	}
});

TDMap.Routing.RouterWayMarker = L.Marker.extend({

	initialize: function initialize(latlng, editor) {
		var markerOptions = {
			draggable: true,
			icon: L.divIcon({
				className: 'router-way-marker'
			})
		};
		this.editTools = editor;

		L.Marker.prototype.initialize.call(this, latlng, markerOptions);
		this.editTools.wayPoints.addLayer(this);
		this.on('dragend', this.onDragEnd, this);
		this.on('dblclick', this.removeOnClick, this);
	},

	onDragEnd: function onDragEnd(e) {
		this.editTools.redrawRouteViaAndEnd(this);
	},

	removeOnClick: function removeOnClick(e) {
		this.remove();
		delete this.editTools.wayPoints._layers[this._leaflet_id];
		this.editTools.redrawRouteViaAndEnd();
		L.Draggable._dragging = false;
	}
});

TDMap.Routing.RouterEditVertex = L.Editable.VertexMarker.extend({
	options: {
		className: 'leaflet-div-icon leaflet-editing-icon router-edge'
	},

	onAdd: function onAdd(map) {
		L.Editable.VertexMarker.prototype.onAdd.call(this, map);
		this.map = map;
		this.on('mouseout', this.onMouseOut, this);
	},

	onMouseOut: function onMouseOut(e) {
		this.remove();
	},

	onMouseDown: function onMouseDown(e) {
		L.Editable.VertexMarker.prototype.onDragEnd.call(this, e);
		this.replaceEditOnViaMarker(e);
	},

	replaceEditOnViaMarker: function replaceEditOnViaMarker(e) {
		var marker = new TDMap.Routing.RouterWayMarker(e.target._latlng, e.layer.editor.tools);
		e.layer.editor.refresh();
		L.Draggable._dragging = false;
		this.remove();
	}
});

TDMap.Routing.Router = L.Editable.extend({
	options: {
		vertexMarkerClass: TDMap.Routing.RouterSubhiddenVertex,
		markerClass: TDMap.Routing.RouterStartEndVertex,
		polylineClass: TDMap.Routing.RouterPolyline,
		skipMiddleMarkers: true
	},

	initialize: function initialize(map, options) {
		L.Editable.prototype.initialize.call(this, map, options);
		this.tools = this;
		this.map = map;
		this.routeProvider = new TDMap.Routing.RouteProvider();
		this.startPoint = null;
		this.endPoint = null;
		this.wayPoints = new L.layerGroup().addTo(this.map);

		map.on('router:stop', function () {
			this.abortDrawing();
		}, this);
	},

	abortDrawing: function abortDrawing() {
		for (var key in this.editLayer._layers) {
			this.editLayer._layers[key].remove();
			delete this.editLayer._layers[key];
		}
		this.stopDrawing();
		this.wayPoints.remove();
		this.featuresLayer.remove();
	},

	startRouter: function startRouter() {
		this.on('editable:drawing:commit', this.endRouter);
		this.on('editable:dragstart', this.showMCADPoints);
		this.on('editable:dragend', this.redrawRouteViaAndEnd);
		this.on('editable:dragend', this.hideMCADPoints);
		L.Editable.prototype.startMarker.call(this);
	},

	endRouter: function endRouter(e) {
		var point = e.latlng;

		if (e.editTools.startPoint !== null && e.layer.options.routePoint !== 'start') {
			return;
		}
		this.startPoint = e.layer;
		if (e.type === 'editable:drawing:commit') {
			e.layer.options.routePoint = 'start';
		}
		for (var pointedLayers in e.editTools.editLayer._layers) {
			e.editTools.editLayer._layers[pointedLayers].remove();
			delete e.editTools.editLayer._layers[pointedLayers];
		}
		this.getElevenRoutesThenOne();
	},

	bringEndPointToMcad: function bringEndPointToMcad(endPoint) {
		var arrayOfEndPoints = this.arrayOfMCAD();
		var resultArrayOfPoints = [];
		for (var i = 0; i < arrayOfEndPoints.length; i++) {
			resultArrayOfPoints.push({
				layerLatLng: arrayOfEndPoints[i],
				distance: endPoint._latlng.distanceTo(arrayOfEndPoints[i])
			});
		}
		endPoint.setLatLng(resultArrayOfPoints.sort(this.comFunction).slice(0, 1)[0].layerLatLng);
	},

	redrawRouteViaAndEnd: function redrawRouteViaAndEnd(e) {
		var editor;
		if (e) {
			var layer = e.layer || e;
			editor = e.editTools || e.editor.tools;
			if (layer.options.routePoint === 'end') {
				editor.bringEndPointToMcad(e.layer);
			}
		} else {
			editor = this;
		}
		if (!editor.endPoint) {
			return;
		}
		var wayPoints = [];
		editor.wayPoints.eachLayer(function (layer) {
			wayPoints.push(layer._latlng);
		});
		editor.routeProvider.setStartPoint(editor.startPoint._latlng).setEndPoint(editor.endPoint._latlng).setMiddlePoints(wayPoints).request().then(function (res) {
			editor.clearRoutes().drawRoute(editor.routeProvider.parceResult(res.data)[0]);
		});
	},
	clearRoutes: function clearRoutes() {
		this.route.remove();
		delete this.route;
		return this;
	},
	drawRoute: function drawRoute(route) {
		var that = this;
		var concatGeoms = [];
		for (var l = 0; l < route.legs.length; l++) {
			for (var r = 0; r < route.legs[l].steps.length; r++) {
				concatGeoms = concatGeoms.concat(route.legs[l].steps[r].geometry);
			}
		}
		for (var i = concatGeoms.length - 2; i >= 0; i--) {
			if (concatGeoms[i][0] === concatGeoms[i + 1][0] && concatGeoms[i][1] === concatGeoms[i + 1][1]) {
				concatGeoms.splice(i, 1);
			}
		}

		this.route = this.createPolyline(concatGeoms, {
			polylineClass: this.options.polylineClass,
			waypoints: route.waypoints
		}).addTo(this.featuresLayer);

		this.route.on('mouseover mousemove', that.routeMouseOver);
		if (!this.endPoint) {
			var endMarker = this.createMarker(concatGeoms[0], {
				markerClass: this.options.markerClass,
				routePoint: 'end'
			});
			this.featuresLayer.addLayer(endMarker);
			this.endPoint = endMarker;
		}
		this.route.on('click', this.clickWayMarker);
		this.featuresLayer.eachLayer(function (layer) {
			if (!layer.editor) {
				layer.toggleEdit();
			}
		});
		this.fireEvent('router:ready', {
			route: route
		});
		return this;
	},
	clickWayMarker: function clickWayMarker(e) {
		var marker = new TDMap.Routing.RouterWayMarker(e.latlng, e.target.editor.tools);
		e.target.editor.refresh();
	},
	routeMouseOver: function routeMouseOver(e) {
		e.target.editor.tools.clearAllViaMarkers().createViaMarker(e);
	},

	clearAllViaMarkers: function clearAllViaMarkers() {
		var that = this;
		if (this.editMarker) {
			this.editMarker.remove();
		}
		this.editLayer.eachLayer(function (sublayer) {
			if (sublayer instanceof TDMap.Routing.RouterEditVertex) {
				sublayer.remove();
				delete that.editLayer._layers[sublayer._leaflet_id];
			}
		});
		return this;
	},

	createViaMarker: function createViaMarker(e) {
		var that = this;
		var layer = e.target;
		var math = this._closestPolylineData(e.layerPoint, layer);
		this.editMarker = new TDMap.Routing.RouterEditVertex(this.map.layerPointToLatLng(math.point), layer.getLatLngs(), layer.editor);
		this.editLayer.addLayer(this.editMarker);
	},

	_closestPolylineData: function _closestPolylineData(currentPoint, layer, what) {
		var latLngs = layer.getLatLngs();
		var points = layer._rings[0];
		var distArray = [];
		for (var i = points.length - 2; i >= 0; i--) {
			var from = points[i];
			var to = points[i + 1];
			var distance = L.LineUtil.pointToSegmentDistance(currentPoint, from, to);
			distArray.push({
				distance: distance,
				from: from,
				to: to,
				fl: latLngs[i],
				tl: latLngs[i + 1],
				i: i
			});
		}
		var comArray = distArray.sort(this.comFunction);
		var redu = comArray[0];
		return {
			point: L.LineUtil.closestPointOnSegment(currentPoint, redu.from, redu.to),
			features: redu
		};
	},

	getElevenRoutesThenOne: function getElevenRoutesThenOne() {
		var that = this;
		var elevenPoints = this.getElevenPoints();
		var elevenRoutes = [];
		var elevenPromise = [];
		for (var i = 0; i < elevenPoints.length; i++) {
			var provider = new TDMap.Routing.RouteProvider();

			provider.setStartPoint(this.startPoint._latlng).setEndPoint(elevenPoints[i].layerLatLng).setMiddlePoints(this.wayPoints);
			elevenPromise.push(provider.request());
		}
		var $q = angular.injector(["ng"]).get("$q");
		$q.all(elevenPromise).then(function (results) {
			for (var r = 0; r < results.length; r++) {
				elevenRoutes.push(that.routeProvider.parceResult(results[r].data));
			}
			var commArray = elevenRoutes.sort(that.comFunction2);
			that.drawRoute(commArray[0][0]);
		});
	},

	getElevenPoints: function getElevenPoints() {
		var arrayOfEndPoints = this.arrayOfMCAD();
		var resultArrayOfPoints = [];
		for (var i = 0; i < arrayOfEndPoints.length; i++) {
			resultArrayOfPoints.push({
				layerLatLng: arrayOfEndPoints[i],
				distance: this.startPoint._latlng.distanceTo(arrayOfEndPoints[i])
			});
		}

		return resultArrayOfPoints.sort(this.comFunction).slice(0, 11);
	},
	comFunction: function comFunction(a, b) {
		if (a.distance < b.distance) return -1;
		if (a.distance > b.distance) return 1;
		return 0;
	},
	comFunction2: function comFunction2(a, b) {
		if (a[0].distance < b[0].distance) return -1;
		if (a[0].distance > b[0].distance) return 1;
		return 0;
	},

	showMCADPoints: function showMCADPoints(e) {
		if (e.layer.options.routePoint === 'start') {
			return;
		}
		var mcadPoints = this.arrayOfMCAD();
		this.mcadPoints = new L.LayerGroup().addTo(this.map);

		for (var i = 0; i < mcadPoints.length; i++) {
			this.mcadPoints.addLayer(new L.circleMarker(mcadPoints[i], {
				color: '#E53935',
				weight: 2,
				fillColor: '#E53935',
				fillOpacity: 0.4
			}));
		}
	},

	hideMCADPoints: function hideMCADPoints() {
		if (this.mcadPoints) {
			this.mcadPoints.remove();
			delete this.mcadPoints;
		}
	},

	arrayOfMCAD: function arrayOfMCAD() {
		var sezdArray = [[37.370743963, 55.7900346394], [37.378270044, 55.7960801265], [37.3858805489, 55.8090674539], [37.389455252, 55.813351974], [37.3903679421, 55.8159160498], [37.3919461355, 55.8212680135], [37.3953893225, 55.8333960946], [37.394925847, 55.8319678193], [37.3956507702, 55.8356785564], [37.392347022, 55.8497441067], [37.3974159383, 55.8591232043], [37.399958636, 55.8625941994], [37.4031815731, 55.8656151612], [37.4191322597, 55.8738805922], [37.4258562192, 55.8760086759], [37.4316175758, 55.8778166554], [37.4439531536, 55.8815563457], [37.4512047621, 55.8827081777], [37.4862720291, 55.8882668866], [37.4868139389, 55.8884188401], [37.490236527, 55.8895784658], [37.4949211944, 55.8916017297], [37.4996557746, 55.8936968563], [37.5481067871, 55.9084475027], [37.5427946452, 55.9078799665], [37.5708028243, 55.910857441], [37.5818763228, 55.9109853275], [37.5877874176, 55.9101860305], [37.5935701654, 55.908703291], [37.6295144706, 55.8997257115], [37.6664142483, 55.8956172896], [37.6715481304, 55.8954200531], [37.682538441, 55.8951108695], [37.6992520794, 55.8940873477], [37.7073902333, 55.8917043562], [37.7131420827, 55.8891239499], [37.7249975475, 55.8830294581], [37.730901512, 55.8801391721], [37.8278463193, 55.8302772253], [37.8301660734, 55.8289422831], [37.8391218456, 55.814708952], [37.8394926259, 55.8111511412], [37.8396067122, 55.8101895149], [37.8429437356, 55.7779506079], [37.8433050088, 55.7748493065], [37.8436282532, 55.7707316803], [37.8434286022, 55.7670200964], [37.8428771853, 55.7553107823], [37.8423542899, 55.7460542456], [37.8419930167, 55.740777572], [37.8405205908, 55.7291252899], [37.8390659908, 55.7170578494], [37.8378966066, 55.712804242], [37.836848439, 55.7107997849], [37.8314293412, 55.7005991606], [37.8314970799, 55.6854640667], [37.8323455965, 55.683124557], [37.8395686834, 55.6574611634], [37.8387486884, 55.6553452535], [37.8348982768, 55.6505136313], [37.8273828438, 55.6453112266], [37.8204948853, 55.6408043314], [37.8180919433, 55.6392267955], [37.7986117128, 55.6264190387], [37.798233802, 55.6261291856], [37.7809614181, 55.6167931363], [37.7470088691, 55.5989104603], [37.7396645655, 55.5958352148], [37.7323202619, 55.5927731589], [37.7219336578, 55.588387825], [37.7191765729, 55.5872863778], [37.703382755, 55.5814025142], [37.6896686348, 55.5762500511], [37.6838335975, 55.5741539404], [37.6500117722, 55.5726892838], [37.6382585097, 55.5733745886], [37.6352780059, 55.5735761466], [37.6193059282, 55.574511362], [37.6028775054, 55.575462679], [37.6003390859, 55.575615855], [37.5903850589, 55.576671947], [37.5739281146, 55.5805735977], [37.5698923128, 55.5815167072], [37.5298765539, 55.5911157886], [37.5259976207, 55.5920264108], [37.4967972401, 55.6066901578], [37.4937525628, 55.6093362997], [37.4890179826, 55.6134038409], [37.4711563511, 55.6283977433], [37.4677480238, 55.6313805399], [37.4600614614, 55.6377881553], [37.4568100027, 55.640673655], [37.4524580869, 55.6446769169], [37.4289135331, 55.666142281], [37.4255979009, 55.6706382181], [37.4170271699, 55.6820607217], [37.4153016151, 55.6853328693], [37.4109805977, 55.6925354533], [37.400178054, 55.7007653533], [37.3953079964, 55.7043493189], [37.3908015888, 55.7076959317], [37.3830651137, 55.7185373097], [37.3796710471, 55.7252358495], [37.3747653376, 55.7346873495], [37.3729470877, 55.7384889855], [37.3689089091, 55.7629799824], [37.3690515169, 55.7672802708], [37.369179864, 55.7696949637], [37.3693224718, 55.7733768817], [37.3756970421, 55.7931762657]];

		var latlngs = [];
		for (var i = 0; i < sezdArray.length; i++) {
			latlngs.push(new L.latLng(sezdArray[i][1], sezdArray[i][0]));
		}

		return latlngs;
	}
});
'use strict';

TDMap.Utils.GeoUtil = L.Util.extend({

    intersectionByBBox: function intersectionByBBox(hole, polygon, map) {
        this.map = map;
        var that = this;
        var result = this.parseResult(this.isMultiPointInsideBBox(hole, polygon));
        if (result === 'within' || result === 'overlaps') {
            return true;
        } else {
            return false;
        }
    },

    isMultiPointInsideBBox: function isMultiPointInsideBBox(coordinates, bboxCoords) {
        var arrayOfResults = [];
        for (var i = 0; i < coordinates.length; i++) {
            arrayOfResults.push(this.pointIntersectionMath(coordinates[i], bboxCoords));
        }
        return arrayOfResults;
    },

    pointIntersectionMath: function pointIntersectionMath(pointCoordinates, bboxCoords) {
        var x = pointCoordinates[0],
            y = pointCoordinates[1];
        var inside = false;
        for (var i = 0, j = bboxCoords.length - 1; i < bboxCoords.length; j = i++) {
            var xi = bboxCoords[i][0],
                yi = bboxCoords[i][1];
            var xj = bboxCoords[j][0],
                yj = bboxCoords[j][1];
            var intersect = yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi;
            if (intersect) {
                inside = !inside;
            }
        }
        return inside;
    },

    parseResult: function parseResult(result) {
        if (result === true && typeof result === "boolean") {
            return "within";
        } else if (result === false && typeof result === "boolean") {
            return "no intersects";
        } else if (result.constructor === Array) {
            result.sort();
            if (result[0] === result[result.length - 1] && result[0] === true) {
                return "within";
            } else if (result[0] === result[result.length - 1] && result[0] === false) {
                return "no intersects";
            } else {
                return "overlaps";
            }
        }
    }
});
'use strict';

TDMap.MeasurmentUtils = {};

TDMap.MeasurmentUtils.MeasureLine = L.Polyline.extend({
	options: {
		className: 'leaflet-interactive measurment-line'
	}
});

TDMap.MeasurmentUtils.MeasurePolygon = L.Polygon.extend({
	options: {
		className: 'leaflet-interactive measurment-polygon'
	}
});
TDMap.MeasurmentUtils.MeasureVertex = L.Editable.VertexMarker.extend({
	options: {
		className: 'leaflet-div-icon leaflet-editing-icon measurment-edge'
	},
	onAdd: function onAdd(map) {
		L.Editable.VertexMarker.prototype.onAdd.call(this, map);
		this.on('mouseover', this.mouseover);
		this.on('mouseout', this.mouseout);
	},
	mouseover: function mouseover(e) {
		this.editor.fireAndForward('editable:vertex:mouseover', e);
	},
	mouseout: function mouseout(e) {
		this.editor.fireAndForward('editable:vertex:mouseout', e);
	}
});

TDMap.MeasurmentUtils.MeasureMiddleVertex = L.Editable.MiddleMarker.extend({
	options: {
		className: 'leaflet-div-icon leaflet-editing-icon measurment-middleEdge'
	},
	onAdd: function onAdd(map) {
		L.Editable.MiddleMarker.prototype.onAdd.call(this, map);
		this.on('mouseover', this.mouseover);
		this.on('mouseout', this.mouseout);
	},
	mouseover: function mouseover(e) {
		e.left = this.left;
		e.right = this.right;
		this.editor.fireAndForward('editable:middlemarker:mouseover', e);
	},
	mouseout: function mouseout(e) {
		e.middleMarkerId = this._leaflet_id;
		this.editor.fireAndForward('editable:middlemarker:mouseout', e);
	}
});

TDMap.Utils.Measurment = L.Editable.extend({
	options: {
		vertexMarkerClass: TDMap.MeasurmentUtils.MeasureVertex,
		polylineClass: TDMap.MeasurmentUtils.MeasureLine,
		polygonClass: TDMap.MeasurmentUtils.MeasurePolygon,
		middleMarkerClass: TDMap.MeasurmentUtils.MeasureMiddleVertex,
		lineGuideOptions: {
			className: 'measurment-lineguide'
		}
	},

	initialize: function initialize(map, options) {
		L.Editable.prototype.initialize.call(this, map);
		L.setOptions(this, options);
		map.measureTools = this;
		this.map = map;
		var that = this;
		map.on('stopmeasure', function () {
			var id;
			that.abortDrawing();
			for (var o in that.featuresLayer._layers) {
				id = that.featuresLayer._layers[o]._leaflet_id;
			}
			that.removeLabel(id);
			that.featuresLayer.remove();
			that.map.off('zoomend', that.dravingZoomEnd);
		}, this);
	},

	disableMapZoom: function disableMapZoom() {
		if (this.map.doubleClickZoom) {
			this.map.doubleClickZoom.disable();
		}
		if (this.map.touchZoom) {
			this.map.touchZoom.disable();
		}
	},

	enableMapZoom: function enableMapZoom() {
		if (!this.map.doubleClickZoom) {
			this.map.doubleClickZoom.enable();
		}
		if (!this.map.touchZoom) {
			this.map.touchZoom.enable();
		}
	},

	abortDrawing: function abortDrawing() {
		this.off('editable:vertex:mouseover editable:vertex:mouseout editable:middlemarker:mouseover editable:middlemarker:mouseout editable:vertex:drag editable:vertex:dragend editable:drawing:move', this.preMeasureCookLayer);
		this.off('editable:vertex:drag editable:vertex:dragend editable:drawing:move editable:vertex:mouseover editable:vertex:mouseout editable:middlemarker:mouseout', this.preMeasureCookLayer);
		this.off('editable:drawing:end', this.dravingLineEnd);
		this.off('editable:drawing:end', this.dravingPolygonEnd);
		this.enableMapZoom();
		this.stopDrawing();
	},

	startPolylineMeasure: function startPolylineMeasure() {
		var that = this;
		this.disableMapZoom();
		this.on('editable:vertex:mouseover editable:vertex:mouseout editable:middlemarker:mouseover editable:middlemarker:mouseout editable:vertex:drag editable:vertex:dragend editable:drawing:move', this.preMeasureCookLayer);
		this.on('editable:drawing:end', this.dravingLineEnd);
		L.Editable.prototype.startPolyline.call(this);
	},

	dravingLineEnd: function dravingLineEnd(e) {
		this.off('editable:drawing:move', this.preMeasureCookLayer);
		this.preMeasureCookLayer(e);
		this.enableMapZoom();
		this.map.on('zoomend', this.dravingZoomEnd);
	},

	startPolygonMeasure: function startPolygonMeasure() {
		var that = this;
		this.disableMapZoom();
		this.on('editable:vertex:drag editable:vertex:dragend editable:drawing:move editable:vertex:mouseover editable:vertex:mouseout editable:middlemarker:mouseout', this.preMeasureCookLayer);
		this.on('editable:drawing:end', this.dravingPolygonEnd);
		L.Editable.prototype.startPolygon.call(this);
	},

	dravingPolygonEnd: function dravingPolygonEnd(e) {
		var that = this;
		that.off('editable:drawing:move', that.preMeasureCookLayer);
		that.preMeasureCookLayer(e);
		that.enableMapZoom();
		that.map.on('zoomend', this.dravingZoomEnd);
		that.on('editable:middlemarker:mouseover', that.preMeasureCookLayer);
	},

	dravingZoomEnd: function dravingZoomEnd(e) {
		for (var o in e.target.measureTools.featuresLayer._layers) {
			e.layer = e.target.measureTools.featuresLayer._layers[o];
			if (e.layer.toGeoJSON().geometry.type === 'Polygon') {
				e.target.measureTools.preMeasureCookLayer(e);
			} else {
				e.target.measureTools.preMeasureCookLayer(e);
			}
		}
	},

	preMeasureCookLayer: function preMeasureCookLayer(e) {
		var layer = e.layer || e.target;
		if (layer.toGeoJSON().geometry.type === 'Polygon') {
			if (e.target.measureTools) {
				e.target.measureTools.preMeasureCookPolygonLayer(e);
			} else {
				e.editTools.preMeasureCookPolygonLayer(e);
			}
		} else {
			if (e.target.measureTools) {
				e.target.measureTools.preMeasureCookLineLayer(e);
			} else {
				e.editTools.preMeasureCookLineLayer(e);
			}
		}
	},

	preMeasureCookLineLayer: function preMeasureCookLineLayer(e) {
		var layer = e.layer;
		var latlngs = this._getLineLatLngs(layer);
		var newlatLngsArray = [];
		var screenCords;
		var partialArray = [];
		for (var i = 0; i < latlngs.length; i++) {
			newlatLngsArray.push(latlngs[i]);
		}
		this.removeLabel(layer._leaflet_id);
		if (e.type === "editable:drawing:move") {
			var endingPoint = e.latlng;
			screenCords = e.layerPoint;
			newlatLngsArray.push(endingPoint);
		} else if (e.type === "editable:drawing:end" || e.type === 'editable:vertex:dragend' || e.type === "editable:vertex:mouseout" || e.type === "editable:middlemarker:mouseout") {
			screenCords = layer._rings[0][layer._rings[0].length - 1];
		} else if (e.type === "editable:vertex:drag") {
			screenCords = e.vertex.dragging._draggable._newPos;
		} else if (e.type === "editable:vertex:mouseover") {
			screenCords = e.layerPoint;
			var pointIndex;
			for (var l = 0; l < layer._rings[0].length; l++) {
				if (layer._rings[0][l].x === screenCords.x && layer._rings[0][l].y === screenCords.y) {
					pointIndex = l;
				}
			}
			partialArray = [];
			for (var k = 0; k < latlngs.length; k++) {
				if (k - 1 < pointIndex) {
					partialArray.push(latlngs[k]);
				}
			}
			newlatLngsArray = partialArray;
		} else if (e.type === "editable:middlemarker:mouseover") {
			screenCords = e.layerPoint;
			partialArray = [];
			partialArray.push(e.left.latlng);
			partialArray.push(e.right.latlng);
			newlatLngsArray = partialArray;
		}
		if (newlatLngsArray.length < 1) {
			return;
		}
		var self = this;
		if (e.type === "zoomend") {
			setTimeout(function () {
				self.createMouseMoveLabel({
					pathLength: self._getPerimeter(newlatLngsArray)
				}, layer._rings[0][layer._rings[0].length - 1], layer._leaflet_id);
			}, 50);
		} else {
			this.createMouseMoveLabel({
				pathLength: self._getPerimeter(newlatLngsArray)
			}, screenCords, layer._leaflet_id);
		}
	},

	preMeasureCookPolygonLayer: function preMeasureCookPolygonLayer(e) {
		var that = this;
		var layer = e.layer || e.target;
		var latlngs = this._getLineLatLngs(layer);
		var newlatLngsArray = [];
		var screenCords, centerCords;
		var partialArray = [];
		var screenCordsShift = false;
		for (var i = 0; i < latlngs[0].length; i++) {
			newlatLngsArray.push(latlngs[0][i]);
		}
		if (e.type === "editable:drawing:move") {
			var endingPoint = e.latlng;
			screenCords = e.layerPoint || e.vertex.dragging._draggable._newPos;
			newlatLngsArray.push(endingPoint);
			if (latlngs[0][latlngs.length - 1] !== undefined) {
				newlatLngsArray.push(latlngs[0][latlngs.length - 1]);
			}
		} else if (e.type === "editable:drawing:end") {
			screenCords = that.map.latLngToContainerPoint(layer.getCenter());
			newlatLngsArray.push(latlngs[0][latlngs.length - 1]);
			screenCordsShift = true;
		} else if (e.type === "editable:vertex:drag") {
			screenCords = e.vertex.dragging._draggable._newPos;
			newlatLngsArray.push(latlngs[0][latlngs.length - 1]);
		} else if (e.type === "editable:vertex:mouseover") {
			screenCords = e.layerPoint;
			newlatLngsArray.push(latlngs[0][latlngs.length - 1]);
		}
		if (newlatLngsArray.length < 2) {
			return;
		}

		if (e.type === "zoomend" || e.type === "editable:vertex:mouseout" || e.type === "editable:middlemarker:mouseout" || e.type === 'editable:vertex:dragend') {
			this.removeLabel(layer._leaflet_id);
			// даем про!"№;  дом
			setTimeout(function () {
				var array = $('.leaflet-map-pane').css('transform').replace('(', ',').replace(')', '').split(',');
				screenCords = that.map.latLngToContainerPoint(layer.getCenter());
				screenCords.x = screenCords.x - array[array.length - 2];
				screenCords.y = screenCords.y - array[array.length - 1];
				newlatLngsArray.push(latlngs[0][latlngs.length - 1]);
				that.removeLabel(layer._leaflet_id);
				screenCordsShift = true;
				that.createMouseMoveLabel({
					pathLength: that._getPerimeter(newlatLngsArray),
					pathSquare: that.getArea(newlatLngsArray),
					screenCordsShift: screenCordsShift
				}, screenCords, layer._leaflet_id);
			}, 50);
		} else {
			this.removeLabel(layer._leaflet_id);
			this.createMouseMoveLabel({
				pathLength: that._getPerimeter(newlatLngsArray),
				pathSquare: that.getArea(newlatLngsArray),
				screenCordsShift: screenCordsShift
			}, screenCords, layer._leaflet_id);
		}
	},

	_getLineLatLngs: function _getLineLatLngs(layer) {
		return layer.editor.getLatLngs();
	},

	getDistance: function getDistance(e) {
		return e.latlng1.distanceTo(e.latlng2);
	},

	_getPerimeter: function _getPerimeter(latlngs) {
		var distance = 0;
		var currentInc = 0;
		for (var i = 1; i < latlngs.length; i++) {
			var prevLatLng = latlngs[i - 1];
			var currentLatLng = latlngs[i];
			currentInc = this.getDistance({
				latlng1: prevLatLng,
				latlng2: currentLatLng
			});
			distance += Number(currentInc);
		}

		return this.readableDistance(distance);
	},

	getArea: function getArea(latlngs) {
		var area = parseFloat(this.geodesicArea(latlngs));
		return this.readableArea(area);
	},

	geodesicArea: function geodesicArea(latLngs) {
		var DEG_TO_RAD = 0.017453292519943295;
		var pointsCount = latLngs.length,
		    area = 0.0,
		    d2r = DEG_TO_RAD,
		    p1,
		    p2;

		if (pointsCount > 2) {
			for (var i = 0; i < pointsCount; i++) {
				p1 = latLngs[i];
				p2 = latLngs[(i + 1) % pointsCount];
				area += (p2.lng - p1.lng) * d2r * (2 + Math.sin(p1.lat * d2r) + Math.sin(p2.lat * d2r));
			}
			area = area * 6378137.0 * 6378137.0 / 2.0;
		}

		return Math.abs(area);
	},

	readableDistance: function readableDistance(distance) {
		var distanceStr;
		if (distance > 10000) {
			distanceStr = L.Util.template('{distance} км', {
				distance: (distance / 1000).toFixed(3)
			});
		} else {
			distanceStr = L.Util.template('{distance} м', {
				distance: (distance / 1).toFixed(1)
			});
		}
		return distanceStr;
	},

	readableArea: function readableArea(area) {
		var areaStr;
		var metAreaStr = L.Util.template('{area} м\xB2', {
			area: area.toFixed(0)
		});

		function numberWithCommas(x) {
			var parts = x.toString().split(".");
			parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
			return parts.join(".");
		}
		metAreaStr = numberWithCommas(metAreaStr);

		var gaArea = area / 10000;
		var gaAreaStr = L.Util.template('{gaArea} Га', {
			gaArea: gaArea.toFixed(2)
		});
		gaAreaStr = numberWithCommas(gaAreaStr);

		areaStr = metAreaStr + ' / ' + gaAreaStr;

		return areaStr;
	},

	createMouseMoveLabel: function createMouseMoveLabel(obj, screenCords, id) {
		var measurment;
		var dxShift = 0;
		var dyShift = 0;
		if (obj.pathLength) {
			measurment = 'Расстояние: ' + obj.pathLength;
		}
		if (obj.pathSquare) {
			measurment = 'Периметр: ' + obj.pathLength;
			measurment = measurment + '_' + 'Площадь: ' + obj.pathSquare;
		}
		if (obj.screenCordsShift) {
			dxShift = -25 * 3;
			dyShift = 15;
		}
		if (measurment === undefined) {
			return;
		}

		var group = d3.select('.leaflet-overlay-pane').select('svg').append('g').attr("class", 'measurment' + id);

		var rectangle = group.append("rect");
		var text = group.append('text').attr("x", screenCords.x + 25 + dxShift).attr("y", screenCords.y - 15 + dyShift).attr("class", "measurment-label-text").call(wrap, 180);

		function wrap(text, width) {
			text.each(function () {
				var text = d3.select(this),
				    words = measurment.split("_"),
				    word = true,
				    line = [],
				    lineNumber = 0,
				    lineHeight = 1.1,
				    x = text.attr("x"),
				    y = text.attr("y"),
				    dy = 0,
				    tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
				while (word) {
					word = words.pop();
					line.push(word);
					tspan.text(line.join(" "));
					if (tspan.node().getComputedTextLength() > width) {
						line.pop();
						tspan.text(line.join("/"));
						line = [word];
						tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
					}
				}
			});
		}
		var bbox;

		if (text.node() !== null) {
			bbox = text.node().getBBox();
		} else {
			return;
		}

		var rectangleWidth = bbox.width + 6;
		var rectangleHeight = bbox.height + 2;
		rectangle.attr("class", "leaflet-measure-label-rectangle").attr("width", rectangleWidth + 5).attr("height", rectangleHeight).attr("x", bbox.x - 5).attr("y", bbox.y - 1).style("fill", "white").style("fill-opacity", 0.5).style("stroke", "#3f51b5").style("stroke-width", "1px").style("stroke-opacity", 1);
	},

	removeLabel: function removeLabel(type) {
		var elem = $('.measurment' + type).remove();
	},

	checkAndClearAllLabels: function checkAndClearAllLabels() {
		$("[class^='measurment']").remove();
	}
});
"use strict";

TDMap.Utils.Promise = {
	httpPromise: function httpPromise() {
		return angular.injector(["ng"]).get("$http");
	},

	getPromise: function getPromise(url, params, headers) {
		var $http = angular.injector(['ng']).get('$http');

		var request = {
			url: url,
			type: 'GET'
		};

		if (params !== null && params !== undefined) {
			request.params = params;
		}

		if (headers !== null && headers !== undefined) {
			request.headers = headers;
		}
		return $http.get(url, request);
	}
};
"use strict";

TDMap.Utils.CadastrSearchProviderPPK5 = function (map) {
	this.map = map;
};

TDMap.Utils.CadastrSearchProviderPPK5.prototype = {
	getDataByMask: function getDataByMask(cadnum) {},
	getDataByMaskAsynch: function getDataByMaskAsynch(cadnum) {
		var d = $.Deferred();
		getDataFromServer();

		function getDataFromServer() {
			function random() {
				return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
			}

			var urlOptions = {
				text: cadnum,
				tolerance: "16391",
				limit: 16,
				callback: "JQuery" + random() + random()
			};

			var array = [];
			var arrayWithOutCords = [];
			this[urlOptions.callback] = function (data) {};
			var text = Number(cadnum.split(":")[0]).toString() + ":" + Number(cadnum.split(":")[1]).toString() + ":" + Number(cadnum.split(":")[2]).toString() + ":" + Number(cadnum.split(":")[3]).toString();
			$.ajax({
				url: "https://pkk5.rosreestr.ru/api/features/1/" + text,
				type: 'GET',
				dataType: "jsonp",
				success: function success(response) {
					if (response.feature !== undefined && response.feature !== null) {
						if (response.feature.center && response.feature.extent) {
							var cords = L.Projection.SphericalMercator.unproject(L.point(response.feature.center.x, response.feature.center.y));
							var obj = {
								type: "Feature",
								geojson: {
									type: "Point",
									coordinates: [cords[Object.keys(cords)[1]], cords[Object.keys(cords)[0]]]
								}
							};
							obj.properties = response.feature.attrs;
							obj.properties.extent = response.feature.extent;
							obj.properties.center = response.feature.center;
							array.push(obj);
							d.resolve(array, "withCoords");
						} else {
							arrayWithOutCords.push({
								type: "Feature",
								properties: {
									cn: response.feature.attrs.cn,
									id: response.feature.attrs.id
								}
							});
							d.resolve(arrayWithOutCords, "withoutCoords");
						}
					} else {
						d.resolve([], "noObjects");
					}
				},
				error: function error(_error) {
					d.reject(" Failed: " + _error);
				}
			});
		}
		return d.promise();
	},

	getPointsOfImageByMaskAsynch: function getPointsOfImageByMaskAsynch(cadnum, options) {
		var d = $.Deferred();
		getDataFromServer();

		function getDataFromServer() {
			var urlOptions = {
				dpi: '96',
				transparent: 'true',
				format: 'png32',
				layers: 'show:6,7',
				bbox: options.bbox3857,
				bboxSR: options.bboxSR,
				imageSR: options.imageSR,
				size: options.size,
				layerDefs: JSON.stringify({
					"6": "ID = '" + cadnum + "'",
					"7": "ID = '" + cadnum + "'"
				}),
				f: 'image'
			};
			var pstr = L.Util.getParamString(urlOptions);
			$.ajax({
				url: "http://pkk5.rosreestr.ru/arcgis/rest/services/Cadastre/CadastreSelected/MapServer/export?",
				type: 'GET',
				data: urlOptions,
				success: function success(data) {
					var image = new Image();
					image.setAttribute("crossOrigin", "anonymous");
					image.onload = function () {
						var pathPoints = MSQR(image, {
							tolerance: 1.5,
							path2D: true,
							maxShapes: 25
						});

						var c = document.createElement("canvas"),
						    ctx;
						c.width = image.width;
						c.height = image.height;
						ctx = c.getContext("2d");
						ctx.drawImage(image, 0, 0);

						ctx.fillStyle = 'rgb(255, 255, 0)';
						ctx.beginPath();
						for (var z = 0; z < pathPoints.length; z++) {
							if (pathPoints[z].length > 3) {
								for (var i = 0; i < pathPoints[z].length; i++) {
									if (i === 0) {
										ctx.moveTo(pathPoints[z][i].x, pathPoints[z][i].y);
									} else if (i === pathPoints[z].length) {
										ctx.lineTo(pathPoints[z][i].x, pathPoints[z][i].y);
									} else {
										ctx.lineTo(pathPoints[z][i].x, pathPoints[z][i].y);
									}
								}
							}
						}

						ctx.rect(0, 0, image.width, image.height);
						ctx.fill();

						var imgData = ctx.getImageData(0, 0, image.width, image.height);
						for (var d = 0; d < imgData.data.length; d += 4) {
							if (imgData.data[d + 3] === 0) {
								imgData.data[d] = 255;
								imgData.data[d + 1] = 0;
								imgData.data[d + 2] = 0;
								imgData.data[d + 3] = 255;
							} else {
								imgData.data[d] = 0;
								imgData.data[d + 1] = 0;
								imgData.data[d + 2] = 0;
								imgData.data[d + 3] = 0;
							}
						}
						ctx.putImageData(imgData, 0, 0);

						var pinPoints = MSQR(ctx, {
							tolerance: 1.5,
							path2D: true,
							maxShapes: 100
						});
						var polygons = [];
						for (var pp = 0; pp < pathPoints.length; pp++) {
							if (pathPoints[pp].length > 2) polygons.push(pathPoints[pp]);
						}
						var holes = [];

						for (var pin = pinPoints.length - 1; pin >= 0; pin--) {
							if (pinPoints[pin].length > 2) holes.push(pinPoints[pin]);
						}

						d.resolve(polygons, holes, image.width, image.height, urlOptions.bbox);
					};
					image.src = this.url;
				},
				error: function error(_error2) {
					d.reject(" Failed: " + _error2);
				}
			});
		}
		return d.promise();
	},
	getDataByLocation: function getDataByLocation() {},
	getDataByLocationAsynch: function getDataByLocationAsynch(lngLatString) {
		var d = $.Deferred();
		getDataFromServer();

		function getDataFromServer() {
			function random() {
				return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
			}

			var urlOptions = {
				text: lngLatString,
				tolerance: "16",
				limit: 11,
				callback: "JQuery" + random() + random()
			};

			var array = [];
			this[urlOptions.callback] = function (data) {};
			$.ajax({
				url: "https://pkk5.rosreestr.ru/api/features/1?",
				type: 'GET',
				data: urlOptions,
				dataType: "jsonp",
				jsonpCallback: urlOptions.callback,
				crossDomain: true,
				success: function success(response) {
					if (response.features.length > 0) {
						$.each(response.features, function (index, value) {
							var cords = L.Projection.SphericalMercator.unproject(L.point(value.center.x, value.center.y));
							array.push({
								display_name: value.attrs.address,
								type: "Feature",
								geojson: {
									type: "Point",
									coordinates: [cords[Object.keys(cords)[1]], cords[Object.keys(cords)[0]]]
								},
								properties: {
									address: value.attrs.address,
									cn: value.attrs.cn,
									id: value.attrs.id,
									extent: value.extent,
									sort: value.sort,
									type: value.type
								}
							});
						});
						d.resolve(array);
					} else {
						d.resolve([]);
					}
				},
				error: function error(_error3) {
					d.reject(" Failed: " + _error3);
				}
			});
		}
		return d.promise();
	}
};

TDMap.Utils.CadastrSearchPPK5 = function (map, options) {
	this.map = map;
	this.options = options;
	this.pkk5Provider = new TDMap.Utils.CadastrSearchProviderPPK5(this.map);
};

TDMap.Utils.CadastrSearchPPK5.prototype = {
	getGeoJsonByCadNum: function getGeoJsonByCadNum(cadNum) {
		var deferred = $.Deferred();
		var that = this;
		that.pkk5Provider.getDataByMaskAsynch(cadNum).then(function (data, type) {
			var requestResult = data;
			if (type === "withCoords") {
				var bbox = [data[0].properties.extent.xmin, data[0].properties.extent.ymin, data[0].properties.extent.xmax, data[0].properties.extent.ymax];
				var strBbox = bbox.join();
				var bounds = new L.latLngBounds(L.Projection.SphericalMercator.unproject(new L.point(data[0].properties.extent.xmin, data[0].properties.extent.ymax)), L.Projection.SphericalMercator.unproject(new L.point(data[0].properties.extent.xmax, data[0].properties.extent.ymin)));

				var newBoundsNorthEast = that.map.getPixelBounds(bounds._northEast, 18);
				var newBoundsSouthWest = that.map.getPixelBounds(bounds._southWest, 18);
				var futureNE = {
					x: null,
					y: null
				};
				var futureSW = {
					x: null,
					y: null
				};
				futureNE.x = newBoundsNorthEast.min.x + that.map.getSize().x / 2;
				futureNE.y = newBoundsNorthEast.min.y + that.map.getSize().y / 2;
				futureSW.x = newBoundsSouthWest.min.x + that.map.getSize().x / 2;
				futureSW.y = newBoundsSouthWest.min.y + that.map.getSize().y / 2;
				var futureHight = futureSW.y - futureNE.y;
				var futureWidth = futureNE.x - futureSW.x;

				var kW, kH;
				if (futureHight / 4096 > 1) {
					kH = futureHight / 4096;
				} else {
					kH = 1;
				}

				if (futureWidth / 4096 > 1) {
					kW = futureWidth / 4096;
				} else {
					kW = 1;
				}
				var d = [kW, kH].sort();

				var size = [futureWidth / d[1], futureHight / d[1]];
				var strSize = size.join();

				that.pkk5Provider.getPointsOfImageByMaskAsynch(data[0].properties.id, {
					bbox3857: strBbox,
					bboxSR: '3857',
					imageSR: '3857',
					size: strSize
				}).then(function (data, holes) {
					var geometry = {
						type: "MultiPolygon",
						coordinates: []
					};
					for (var v = 0; v < data.length; v++) {
						var polygon = [];
						var exterior = [];
						for (var m = 0; m < data[v].length; m++) {
							var point = L.point(data[v][m].x * d[1] + futureSW.x, data[v][m].y * d[1] + futureNE.y);
							exterior.push([that.map.unproject(point, 18).lng, that.map.unproject(point, 18).lat]);
						}
						if (data[v].length > 0) {
							var lastPoint = L.point(data[v][0].x * d[1] + futureSW.x, data[v][0].y * d[1] + futureNE.y);
							exterior.push([that.map.unproject(lastPoint, 18).lng, that.map.unproject(lastPoint, 18).lat]);
						}

						polygon.push(exterior);
						geometry.coordinates.push(polygon);
					}

					var arrayOfHoles = [];
					for (var h = 0; h < holes.length; h++) {
						var hole = [];
						for (var hh = 0; hh < holes[h].length; hh++) {
							var holePoint = L.point(holes[h][hh].x * d[1] + futureSW.x, holes[h][hh].y * d[1] + futureNE.y);
							hole.push([that.map.unproject(holePoint, 18).lng, that.map.unproject(holePoint, 18).lat]);
						}
						if (holes[h].length > 0) {
							var lastHolePoint = L.point(holes[h][0].x * d[1] + futureSW.x, holes[h][0].y * d[1] + futureNE.y);
							hole.push([that.map.unproject(lastHolePoint, 18).lng, that.map.unproject(lastHolePoint, 18).lat]);
						}

						arrayOfHoles.push(hole);
					}

					//проверка на пересечение
					//проверяем каждый полигон и каждый бублик на предмет пересечения.
					if (arrayOfHoles.length > 0) {
						for (var p = 0; p < geometry.coordinates.length; p++) {
							for (var ah = 0; ah < arrayOfHoles.length; ah++) {
								var intersectResult = TDMap.Utils.GeoUtil.intersectionByBBox(arrayOfHoles[ah], geometry.coordinates[p][0], that.map);
								if (intersectResult) {
									geometry.coordinates[p].push(arrayOfHoles[ah]);
								}
							}
						}
					}

					var o = {
						type: "Feature"
					};
					o.geometry = geometry;
					o.properties = requestResult[0].properties;
					if (o.properties.util_code === null) o.properties.util_code = 999;

					if (o.properties.fp === null) o.properties.fp = 999;

					if (o.properties.area_unit === null) o.properties.area_unit = 999;

					if (o.properties.cad_unit === null) o.properties.cad_unit = 999;

					if (o.properties.category_type === null) o.properties.category_type = 999;

					if (o.properties.util_code === null) o.properties.util_code = 999;

					if (o.properties.statecd === null) o.properties.statecd = 999;
					deferred.resolve(o, 'withCoords');
				}, function (err) {
					deferred.resolve(err, 'error');
				});
			} else if (type === "withoutCoords") {
				deferred.resolve(requestResult, 'withoutCoords');
			} else if (type === "noObjects") {
				deferred.resolve(requestResult, 'noObjects');
			}
		}, function (err) {
			deferred.resolve(err, 'error');
		});

		return deferred.promise();
	},

	getFullListOflngLats: function getFullListOflngLats(bounds) {
		var tolerance = this.options.step;
		var crs = this.options.crs;

		var boundedGeometry = this.getBboxOfPointsArray(bounds);
		var metricBbox = [];

		metricBbox.push(L.Projection.Mercator.project(new L.LatLng(boundedGeometry[0], boundedGeometry[1])));
		metricBbox.push(L.Projection.Mercator.project(new L.LatLng(boundedGeometry[2], boundedGeometry[3])));

		var allX = [];
		var allY = [];
		var allXY = [];
		var i = metricBbox[0].x;
		var j = metricBbox[0].y;
		do {
			allX.push(i);
			i += this.options.step;
		} while (i < metricBbox[1].x);

		do {
			allY.push(j);
			j += this.options.step;
		} while (j < metricBbox[1].y);

		for (var k = 0; k < allX.length; k++) {
			for (var l = 0; l < allY.length; l++) {
				allXY.push([allX[k], allY[l]]);
			}
		}

		return allXY;
	},

	getBboxOfPointsArray: function getBboxOfPointsArray(bounds) {
		var bbox = [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY];

		var arraysOfPointsSort = bounds.reduce(function (prev, coord) {
			return [Math.min(coord[0], prev[0]), Math.min(coord[1], prev[1]), Math.max(coord[0], prev[2]), Math.max(coord[1], prev[3])];
		}, bbox);

		return arraysOfPointsSort;
	},

	getArrayofPointsInsideGeometry: function getArrayofPointsInsideGeometry(bounds) {
		var fullList = this.getFullListOflngLats(bounds);
		var boundedList = [];

		for (var i = 0; i < fullList.length; i++) {
			var checked = this.checkLngLatString([L.Projection.Mercator.unproject(new L.Point(fullList[i][0], fullList[i][1])).lat, L.Projection.Mercator.unproject(new L.Point(fullList[i][0], fullList[i][1])).lng], bounds);
			if (checked === true) {
				boundedList.push([L.Projection.Mercator.unproject(new L.Point(fullList[i][0], fullList[i][1])).lat, L.Projection.Mercator.unproject(new L.Point(fullList[i][0], fullList[i][1])).lng]);
			}
		}

		return boundedList;
	},

	checkLngLatString: function checkLngLatString(pointCoordinates, bboxCoords) {
		var x = pointCoordinates[0],
		    y = pointCoordinates[1];

		var inside = false;

		for (var i = 0, j = bboxCoords.length - 1; i < bboxCoords.length; j = i++) {
			var xi = bboxCoords[i][0],
			    yi = bboxCoords[i][1];
			var xj = bboxCoords[j][0],
			    yj = bboxCoords[j][1];

			var intersect = yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi;

			if (intersect) {
				inside = !inside;
			}
		}

		return inside;
	}
};
'use strict';

TDMap.Utils.SpatialFilterPolygon = L.Polygon.extend({
	options: {
		className: 'leaflet-interactive spatial-filter-polygon'
	}
});
TDMap.Utils.SpatialFilterCircle = L.Circle.extend({
	options: {
		className: 'leaflet-interactive spatial-filter-cirlce'
	}
});

L.Editable.PathEditor.prototype.onVertexMarkerAddEvent = function (e) {
	this.fireAndForward('editable:vertex:add', e);
};

TDMap.Utils.SpatialFilterVertex = L.Editable.VertexMarker.extend({
	options: {
		className: 'leaflet-div-icon leaflet-editing-icon spatial-filter-edge'
	},

	onAdd: function onAdd(map) {
		L.Editable.VertexMarker.prototype.onAdd.call(this, map);
		this.onAddEvent();
	},

	onAddEvent: function onAddEvent() {
		this.editor.onVertexMarkerAddEvent(this);
	}
});

TDMap.Utils.SpatialFilterMiddleVertex = L.Editable.MiddleMarker.extend({
	options: {
		className: 'leaflet-div-icon leaflet-editing-icon spatial-filter-middleEdge'
	}
});

TDMap.Utils.SpatialFilter = L.Editable.extend({
	options: {
		vertexMarkerClass: TDMap.Utils.SpatialFilterVertex,
		polygonClass: TDMap.Utils.SpatialFilterPolygon,
		middleMarkerClass: TDMap.Utils.SpatialFilterMiddleVertex,
		circleClass: TDMap.Utils.SpatialFilterCircle,
		lineGuideOptions: {
			className: 'measurment-lineguide'
		}
	},

	initialize: function initialize(map, options) {
		L.Editable.prototype.initialize.call(this, map);
		L.setOptions(this, options);
		this.map = map;
		this.map.spatialFilter = this;
		map.on('spatialfilter:stop', function () {
			this.abortDrawing();
			this.featuresLayer.remove();
		}, this);
	},

	disableMapZoom: function disableMapZoom() {
		this.map.doubleClickZoom.disable();
		this.map.touchZoom.disable();
	},

	enableMapZoom: function enableMapZoom() {
		this.map.doubleClickZoom.enable();
		this.map.touchZoom.enable();
	},
	enableMapZoomWhile: function enableMapZoomWhile() {
		var self = this;
		setTimeout(function () {
			self.map.doubleClickZoom.enable();
			self.map.touchZoom.enable();
		}, 10);
	},
	abortDrawing: function abortDrawing() {
		this.off('editable:drawing:end', this.enableMapZoomWhile);
		this.off('editable:drawing:end', this.drawingPolygonEnd);
		this.off('editable:vertex:dragend', this.drawingPolygonEnd);
		this.off('editable:drawing:end', this.drawingCircleEnd);
		this.off('editable:vertex:dragend', this.drawingCircleEnd);
		this.enableMapZoom();
		this.stopDrawing();
		this.featuresLayer.remove();
		this.removeLabel();
	},

	startPolygonSpatialFilter: function startPolygonSpatialFilter() {
		this.on('editable:drawing:end', this.drawingPolygonEnd);
		this.on('editable:vertex:dragend', this.drawingPolygonEnd);
		this.on('editable:vertex:deleted', this.drawingPolygonEnd);
		this.on('editable:vertex:add', this.drawingPolygonEnd);
		this.on('editable:drawing:start', this.disableMapZoom, this);
		this.on('editable:drawing:end', this.enableMapZoomWhile, this);
		L.Editable.prototype.startPolygon.call(this);
	},

	startCircleSpatialFilter: function startCircleSpatialFilter() {
		this.on('editable:drawing:start', this.disableMapZoom, this);
		this.on('editable:drawing:end', this.drawingCircleEnd);
		this.on('editable:vertex:dragend', this.drawingCircleEnd);
		this.on('editable:vertex:drag', this.shawRadius);
		this.on('editable:drawing:end', this.enableMapZoomWhile, this);
		this.map.on('zoomend', this.shawRadius, this);
		L.Editable.prototype.startCircle.call(this);
	},

	drawingPolygonEnd: function drawingPolygonEnd(e) {
		if (e.editor) {
			var counter = 0;
			e.editor.editLayer.eachLayer(function (layer) {
				counter++;
			});
			if (counter < 6) {
				return;
			}
		}
		e.editTools.featuresLayer.eachLayer(function (layer) {
			layer.bringToBack();
		});
		var layer = this.featuresLayer._layers[this.featuresLayer._leaflet_id + 1];
		layer._map.fireEvent('spatialfilter:bounds', layer.toGeoJSON().geometry.coordinates);
	},

	drawingCircleEnd: function drawingCircleEnd(e) {
		e.editTools.featuresLayer.eachLayer(function (layer) {
			layer.bringToBack();
		});
		var layer = e.editTools.featuresLayer._layers[e.editTools.featuresLayer._leaflet_id + 1];
		layer._map.fireEvent('spatialfilter:circle', {
			centerPoint: layer._latlng,
			radius: layer.getRadius()
		});
	},
	shawRadius: function shawRadius(e) {
		var distance;
		var screenCords;
		var editor = e.editTools || this;
		editor.editLayer.eachLayer(function (layer) {
			var pointLayer;
			layer.eachLayer(function (pLayer) {
				pointLayer = pLayer;
			});
			distance = pointLayer.latlngs[0].distanceTo(pointLayer.latlngs[1]);
			screenCords = pointLayer._icon._leaflet_pos;
		});

		editor.createMouseMoveLabel(distance, screenCords);
	},

	createMouseMoveLabel: function createMouseMoveLabel(distance, screenCords) {
		this.removeLabel();
		if (distance === undefined) {
			return;
		}
		if (distance < 1000) {
			distance = 'Радиус: ' + distance.toFixed(0) + ' м';
		} else {
			distance = 'Радиус: ' + (distance / 1000).toFixed(1) + ' км';
		}

		var group = d3.select('.leaflet-overlay-pane').select('svg').append('g').attr("class", 'spatial-filter');
		var rectangle = group.append("rect");
		var text = group.append('text').attr("x", screenCords.x + 25).attr("y", screenCords.y - 15).attr("class", "spatial-filter-label-text").call(wrap, 180);

		function wrap(text, width) {
			text.each(function () {
				var text = d3.select(this),
				    words = distance.split("_"),
				    word = true,
				    line = [],
				    lineNumber = 0,
				    lineHeight = 1.1,
				    x = text.attr("x"),
				    y = text.attr("y"),
				    dy = 0,
				    tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
				while (word) {
					word = words.pop();
					line.push(word);
					tspan.text(line.join(" "));
					if (tspan.node().getComputedTextLength() > width) {
						line.pop();
						tspan.text(line.join("/"));
						line = [word];
						tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
					}
				}
			});
		}
		var bbox;

		if (text.node() !== null) {
			bbox = text.node().getBBox();
		} else {
			return;
		}

		var rectangleWidth = bbox.width + 6;
		var rectangleHeight = bbox.height + 2;
		rectangle.attr("class", "spatial-filter-label-rectangle").attr("width", rectangleWidth + 5).attr("height", rectangleHeight).attr("x", bbox.x - 5).attr("y", bbox.y - 1).style("fill", "white").style("fill-opacity", 0.5).style("stroke", "#3f51b5").style("stroke-width", "1px").style("stroke-opacity", 1);
	},

	removeLabel: function removeLabel() {
		var elem = $('.spatial-filter');
		if (elem) {
			elem.remove();
		}
	}
});