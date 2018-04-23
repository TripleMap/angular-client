import {
	config
} from "../config/urlConfig.js";
import {
	McadPoints
} from "./McadPoints.js";

var RouteProvider = L.Class.extend({

	options: {
		baseUrl: config.routingUrl
	},

	initialize: function (options) {
		L.setOptions(this, options);
		this.startPoint = null;
		this.endPoint = null;
		this.middlePoints = [];
	},

	request: function () {
		this.checkPoints();
		var that = this;
		var $http = TDMap.Utils.Promise.httpPromise();
		return $http({
			type: 'GET',
			url: that.getUrl(),
			params: {
				alternatives: false,
				overview: false,
				steps: true,
			}
		});
	},

	parceResult: function (res) {
		var routes = [];
		for (var i = 0; i < res.routes.length; i++) {
			var route: any = {
				distance: res.routes[i].distance,
				waypoints: res.waypoints
			};
			route.legs = [];
			for (var l = 0; l < res.routes[i].legs.length; l++) {
				var leg: any = {
					distance: res.routes[i].legs[l].distance,
					summary: res.routes[i].legs[l].summary
				};
				leg.steps = [];
				for (var s = 0; s < res.routes[i].legs[l].steps.length; s++) {
					var step = {
						distance: res.routes[i].legs[l].steps[s].distance,
						geometry: this._decode(res.routes[i].legs[l].steps[s].geometry),
						mode: res.routes[i].legs[l].steps[s].mode,
						name: res.routes[i].legs[l].steps[s].name,
					};
					leg.steps.push(step);
				}
				route.legs.push(leg);
			}
			routes.push(route);
		}
		return routes;
	},

	getUrl: function () {
		return this.options.url + this.getEndPointAsString() + ";" + this.getMiddlePointsAsString() + this.getStartPointAsString();
	},

	setStartPoint: function (cords) {
		if (cords instanceof L.LatLng) {
			this.startPoint = cords;
		} else {
			this.startPoint = new L.LatLng(cords[0], cords[1]);
		}
		return this;
	},

	setEndPoint: function (cords) {
		if (cords instanceof L.LatLng) {
			this.endPoint = cords;
		} else {
			this.endPoint = new L.LatLng(cords[0], cords[1]);
		}
		return this;
	},

	setMiddlePoints: function (cordsArray) {
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

	getStartPoint: function () {
		return this.startPoint;
	},

	getEndPoint: function () {
		return this.endPoint;
	},

	getMiddlePoints: function () {
		return this.middlePoints;
	},

	getStartPointAsString: () => {
		return "" + this.startPoint.lng + ',' + this.startPoint.lat;
	},

	getEndPointAsString: function () {
		return "" + this.endPoint.lng + ',' + this.endPoint.lat;
	},

	getMiddlePointsAsString: function () {
		var result = '';
		if (this.middlePoints.length > 0) {
			for (var i = 0; i < this.middlePoints.length; i++) {
				result = result + this.middlePoints[i].lng + ',' + this.middlePoints[i].lat + ';';
			}
		}
		return result;
	},
	checkPoints: function () {
		if (this.startPoint === null || this.startPoint === undefined) {
			alert('Не задана начальная точка');
			return;
		}
		if (this.endPoint === null || this.endPoint === undefined) {
			alert('Не задана конечная точка');
			return;
		}
	},

	_decode: function (str, precision) {
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

			latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
			shift = result = 0;
			do {
				byte = str.charCodeAt(index++) - 63;
				result |= (byte & 0x1f) << shift;
				shift += 5;
			} while (byte >= 0x20);
			longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
			lat += latitude_change;
			lng += longitude_change;
			coordinates.push([lat / factor, lng / factor]);
		}
		return coordinates;
	},
});

export var Routing = {
	Router: null,
	RouterPolyline: null,
	RouterSubhiddenVertex: null,
	RouterStartEndVertex: null,
	RouterWayMarker: null,
	RouterEditVertex: null

};

Routing.RouterPolyline = L.Polyline.extend({
	options: {
		className: 'leaflet-interactive router-polyline',
	}
});
Routing.RouterSubhiddenVertex = L.Editable.VertexMarker.extend({
	options: {
		className: 'leaflet-div-icon leaflet-editing-icon router-hidden-edge',
	}
});

Routing.RouterStartEndVertex = L.Marker.extend({
	options: {
		className: 'router-start-end',
	},
});

Routing.RouterWayMarker = L.Marker.extend({

	initialize: function (latlng, editor) {
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

	onDragEnd: function (e) {
		this.editTools.redrawRouteViaAndEnd(this);
	},

	removeOnClick: function (e) {
		this.remove();
		delete this.editTools.wayPoints._layers[this._leaflet_id];
		this.editTools.redrawRouteViaAndEnd();
		L.Draggable._dragging = false;
	}
});

Routing.RouterEditVertex = L.Editable.VertexMarker.extend({
	options: {
		className: 'leaflet-div-icon leaflet-editing-icon router-edge',
	},

	onAdd: function (map) {
		L.Editable.VertexMarker.prototype.onAdd.call(this, map);
		this.map = map;
		this.on('mouseout', this.onMouseOut, this);
	},

	onMouseOut: function (e) {
		this.remove();
	},

	onMouseDown: function (e) {
		L.Editable.VertexMarker.prototype.onDragEnd.call(this, e);
		this.replaceEditOnViaMarker(e);
	},

	replaceEditOnViaMarker: function (e) {
		var marker = new TDMap.Routing.RouterWayMarker(e.target._latlng, e.layer.editor.tools);
		e.layer.editor.refresh();
		L.Draggable._dragging = false;
		this.remove();
	}
});


Routing.Router = L.Editable.extend({
	options: {
		vertexMarkerClass: Routing.RouterSubhiddenVertex,
		markerClass: Routing.RouterStartEndVertex,
		polylineClass: Routing.RouterPolyline,
		skipMiddleMarkers: true
	},

	initialize: function (map, options) {
		L.Editable.prototype.initialize.call(this, map, options);
		this.tools = this;
		this.map = map;
		this.routeProvider = new RouteProvider();
		this.startPoint = null;
		this.endPoint = null;
		this.wayPoints = new L.layerGroup().addTo(this.map);

		map.on('router:stop', function () {
			this.abortDrawing();
		}, this);
	},

	abortDrawing: function () {
		for (var key in this.editLayer._layers) {
			this.editLayer._layers[key].remove();
			delete this.editLayer._layers[key];
		}
		this.stopDrawing();
		this.wayPoints.remove();
		this.featuresLayer.remove();
	},

	startRouter: function () {
		this.on('editable:drawing:commit', this.endRouter);
		this.on('editable:dragstart', this.showMCADPoints);
		this.on('editable:dragend', this.redrawRouteViaAndEnd);
		this.on('editable:dragend', this.hideMCADPoints);
		L.Editable.prototype.startMarker.call(this);
	},

	endRouter: function (e) {
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

	bringEndPointToMcad: function (endPoint) {
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

	redrawRouteViaAndEnd: function (e) {
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
		editor.routeProvider.setStartPoint(editor.startPoint._latlng)
			.setEndPoint(editor.endPoint._latlng)
			.setMiddlePoints(wayPoints)
			.request().then(function (res) {
				editor.clearRoutes().drawRoute(editor.routeProvider.parceResult(res.data)[0]);
			});
	},
	clearRoutes: function () {
		this.route.remove();
		delete this.route;
		return this;
	},
	drawRoute: function (route) {
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
	clickWayMarker: function (e) {
		var marker = new TDMap.Routing.RouterWayMarker(e.latlng, e.target.editor.tools);
		e.target.editor.refresh();
	},
	routeMouseOver: function (e) {
		e.target.editor.tools.clearAllViaMarkers()
			.createViaMarker(e);
	},

	clearAllViaMarkers: function () {
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

	createViaMarker: function (e) {
		var that = this;
		var layer = e.target;
		var math = this._closestPolylineData(e.layerPoint, layer);
		this.editMarker = new TDMap.Routing.RouterEditVertex(this.map.layerPointToLatLng(math.point), layer.getLatLngs(), layer.editor);
		this.editLayer.addLayer(this.editMarker);
	},

	_closestPolylineData: function (currentPoint, layer, what) {
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

	getElevenRoutesThenOne: function () {
		var that = this;
		var elevenPoints = this.getElevenPoints();
		var elevenRoutes = [];
		var elevenPromise = [];
		for (var i = 0; i < elevenPoints.length; i++) {
			var provider = new RouteProvider();

			provider.setStartPoint(this.startPoint._latlng)
				.setEndPoint(elevenPoints[i].layerLatLng)
				.setMiddlePoints(this.wayPoints);
			elevenPromise.push(provider.request());
		}
		// var $q = angular.injector(["ng"]).get("$q");
		// $q.all(elevenPromise).then(function (results) {
		// 	for (var r = 0; r < results.length; r++) {
		// 		elevenRoutes.push(that.routeProvider.parceResult(results[r].data));
		// 	}
		// 	var commArray = elevenRoutes.sort(that.comFunction2);
		// 	that.drawRoute(commArray[0][0]);
		// });
	},

	getElevenPoints: function () {
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
	comFunction: function (a, b) {
		if (a.distance < b.distance) return -1;
		if (a.distance > b.distance) return 1;
		return 0;
	},
	comFunction2: function (a, b) {
		if (a[0].distance < b[0].distance) return -1;
		if (a[0].distance > b[0].distance) return 1;
		return 0;
	},

	showMCADPoints: function (e) {
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

	hideMCADPoints: function () {
		if (this.mcadPoints) {
			this.mcadPoints.remove();
			delete this.mcadPoints;
		}
	},

	arrayOfMCAD: function () {
		var latlngs = [];
		for (var i = 0; i < McadPoints.length; i++) {
			latlngs.push(new L.latLng(McadPoints[i][1], McadPoints[i][0]));
		}

		return latlngs;
	}
});