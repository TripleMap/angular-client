export var SpatialFilterUtils = {
	SpatialFilterPolygon: null,
	SpatialFilterCircle: null,
	SpatialFilterVertex: null,
	SpatialFilterMiddleVertex: null,

};

SpatialFilterUtils.SpatialFilterPolygon = L.Polygon.extend({
	options: {
		className: "leaflet-interactive spatial-filter-polygon"
	}
});
SpatialFilterUtils.SpatialFilterCircle = L.Circle.extend({
	options: {
		className: "leaflet-interactive spatial-filter-cirlce"
	}
});

L.Editable.PathEditor.prototype.onVertexMarkerAddEvent = function (e) {
	this.fireAndForward("editable:vertex:add", e);
};

SpatialFilterUtils.SpatialFilterVertex = L.Editable.VertexMarker.extend({
	options: {
		className: "leaflet-div-icon leaflet-editing-icon spatial-filter-edge"
	},

	onAdd: function (map) {
		L.Editable.VertexMarker.prototype.onAdd.call(this, map);
		this.onAddEvent();
	},

	onAddEvent: function () {
		this.editor.onVertexMarkerAddEvent(this);
	}
});

SpatialFilterUtils.SpatialFilterMiddleVertex = L.Editable.MiddleMarker.extend({
	options: {
		className:
			"leaflet-div-icon leaflet-editing-icon spatial-filter-middleEdge"
	}
});

export var SpatialFilter = L.Editable.extend({
	options: {
		vertexMarkerClass: SpatialFilterUtils.SpatialFilterVertex,
		polygonClass: SpatialFilterUtils.SpatialFilterPolygon,
		middleMarkerClass: SpatialFilterUtils.SpatialFilterMiddleVertex,
		circleClass: SpatialFilterUtils.SpatialFilterCircle,
		lineGuideOptions: {
			className: "measurment-lineguide"
		}
	},

	initialize: function (map, options) {
		L.Editable.prototype.initialize.call(this, map);
		L.setOptions(this, options);
		this.map = map;
		this.map.spatialFilter = this;
		map.on(
			"spatialfilter:stop",
			function () {
				this.abortDrawing();
				this.featuresLayer.remove();
			},
			this
		);
	},

	disableMapZoom: function () {
		this.map.doubleClickZoom.disable();
		this.map.touchZoom.disable();
	},

	enableMapZoom: function () {
		this.map.doubleClickZoom.enable();
		this.map.touchZoom.enable();
	},
	enableMapZoomWhile: function () {
		var self = this;
		setTimeout(function () {
			self.map.doubleClickZoom.enable();
			self.map.touchZoom.enable();
		}, 10);
	},
	abortDrawing: function () {
		this.off("editable:drawing:end", this.enableMapZoomWhile);
		this.off("editable:drawing:end", this.drawingPolygonEnd);
		this.off("editable:vertex:dragend", this.drawingPolygonEnd);
		this.off("editable:drawing:end", this.drawingCircleEnd);
		this.off("editable:vertex:dragend", this.drawingCircleEnd);
		this.enableMapZoom();
		this.stopDrawing();
		this.featuresLayer.remove();
		this.removeLabel();
	},

	startPolygonSpatialFilter: function () {
		this.on("editable:drawing:end", this.drawingPolygonEnd);
		this.on("editable:vertex:dragend", this.drawingPolygonEnd);
		this.on("editable:vertex:deleted", this.drawingPolygonEnd);
		this.on("editable:vertex:add", this.drawingPolygonEnd);
		this.on("editable:drawing:start", this.disableMapZoom, this);
		this.on("editable:drawing:end", this.enableMapZoomWhile, this);
		L.Editable.prototype.startPolygon.call(this);
	},

	startCircleSpatialFilter: function () {
		this.on("editable:drawing:start", this.disableMapZoom, this);
		this.on("editable:drawing:end", this.drawingCircleEnd);
		this.on("editable:vertex:dragend", this.drawingCircleEnd);
		this.on("editable:vertex:drag", this.shawRadius);
		this.on("editable:drawing:end", this.enableMapZoomWhile, this);
		this.map.on("zoomend", this.shawRadius, this);
		L.Editable.prototype.startCircle.call(this);
	},

	drawingPolygonEnd: function (e) {
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
		var layer = this.featuresLayer._layers[
			this.featuresLayer._leaflet_id + 1
		];
		layer._map.fireEvent(
			"spatialfilter:bounds",
			layer.toGeoJSON().geometry.coordinates
		);
	},

	drawingCircleEnd: function (e) {
		e.editTools.featuresLayer.eachLayer(function (layer) {
			layer.bringToBack();
		});
		var layer =
			e.editTools.featuresLayer._layers[
			e.editTools.featuresLayer._leaflet_id + 1
			];
		layer._map.fireEvent("spatialfilter:circle", {
			centerPoint: layer._latlng,
			radius: layer.getRadius()
		});
	},
	shawRadius: function (e) {
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

	createMouseMoveLabel: function (distance, screenCords) {
		this.removeLabel();
		if (!distance) {
			return;
		}
		distance < 1000
			? (distance = "Радиус: " + distance.toFixed(0) + " м")
			: (distance = "Радиус: " + (distance / 1000).toFixed(1) + " км");

		var group = d3
			.select(".leaflet-overlay-pane")
			.select("svg")
			.append("g")
			.attr("class", "spatial-filter");
		var rectangle = group.append("rect");
		var text = group
			.append("text")
			.attr("x", screenCords.x + 25)
			.attr("y", screenCords.y - 15)
			.attr("class", "spatial-filter-label-text")
			.call(wrap, 180);

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
					tspan = text
						.text(null)
						.append("tspan")
						.attr("x", x)
						.attr("y", y)
						.attr("dy", dy + "em");
				while (word) {
					word = words.pop();
					line.push(word);
					tspan.text(line.join(" "));
					if (tspan.node().getComputedTextLength() > width) {
						line.pop();
						tspan.text(line.join("/"));
						line = [word];
						tspan = text
							.append("tspan")
							.attr("x", x)
							.attr("y", y)
							.attr("dy", ++lineNumber * lineHeight + dy + "em")
							.text(word);
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
		rectangle
			.attr("class", "spatial-filter-label-rectangle")
			.attr("width", rectangleWidth + 5)
			.attr("height", rectangleHeight)
			.attr("x", bbox.x - 5)
			.attr("y", bbox.y - 1)
			.style("fill", "white")
			.style("fill-opacity", 0.5)
			.style("stroke", "#3f51b5")
			.style("stroke-width", "1px")
			.style("stroke-opacity", 1);
	},

	removeLabel: function () {
		var elem = $(".spatial-filter");
		if (elem) {
			elem.remove();
		}
	}
});
