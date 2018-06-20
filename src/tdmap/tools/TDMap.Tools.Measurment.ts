export var MeasurmentUtils = {
    MeasureLine: null,
    MeasurePolygon: null,
    MeasureVertex: null,
    MeasureMiddleVertex: null
};

MeasurmentUtils.MeasureLine = L.Polyline.extend({
    options: {
        className: 'leaflet-interactive measurment-line'
    }
});

MeasurmentUtils.MeasurePolygon = L.Polygon.extend({
    options: {
        className: 'leaflet-interactive measurment-polygon'
    }
});
MeasurmentUtils.MeasureVertex = L.Editable.VertexMarker.extend({
    options: {
        className: 'leaflet-div-icon leaflet-editing-icon measurment-edge'
    },
    onAdd: function (map) {
        L.Editable.VertexMarker.prototype.onAdd.call(this, map);
        this.on('mouseover', this.mouseover);
        this.on('mouseout', this.mouseout);
    },
    mouseover: function (e) {
        this.editor.fireAndForward('editable:vertex:mouseover', e);
    },
    mouseout: function (e) {
        this.editor.fireAndForward('editable:vertex:mouseout', e);
    }
});

MeasurmentUtils.MeasureMiddleVertex = L.Editable.MiddleMarker.extend({
    options: {
        className: 'leaflet-div-icon leaflet-editing-icon measurment-middleEdge'
    },
    onAdd: function (map) {
        L.Editable.MiddleMarker.prototype.onAdd.call(this, map);
        this.on('mouseover', this.mouseover);
        this.on('mouseout', this.mouseout);
    },
    mouseover: function (e) {
        e.left = this.left;
        e.right = this.right;
        this.editor.fireAndForward('editable:middlemarker:mouseover', e);
    },
    mouseout: function (e) {
        e.middleMarkerId = this._leaflet_id;
        this.editor.fireAndForward('editable:middlemarker:mouseout', e);
    }
});

export var Measurment = L.Editable.extend({
    options: {
        vertexMarkerClass: MeasurmentUtils.MeasureVertex,
        polylineClass: MeasurmentUtils.MeasureLine,
        polygonClass: MeasurmentUtils.MeasurePolygon,
        middleMarkerClass: MeasurmentUtils.MeasureMiddleVertex,
        lineGuideOptions: {
            className: 'measurment-lineguide',
        }
    },

    initialize: function (map, options) {
        L.Editable.prototype.initialize.call(this, map);
        L.setOptions(this, options);
        map.measureTools = this;
        this.map = map;

        this.labelsLayerSVGHack = L.geoJSON({
            "type": "Feature", "properties": {},
            "geometry": { "type": "LineString", "coordinates": [[0, 0], [0, 0]] }
        }, { renderer: L.svg(), className: `measurment` })
            .addTo(map);

        let svgPath = document.getElementsByClassName(`measurment`);
        let svgGroup = svgPath[0].parentElement;
        svgGroup.setAttribute('id', `label_group_measurment`);

        map.on('stopmeasure', () => {
            var id;
            this.abortDrawing();
            for (var o in this.featuresLayer._layers) {
                id = this.featuresLayer._layers[o]._leaflet_id;
            }
            this.removeLabel(id);
            this.featuresLayer.remove();
            this.map.off('zoomend', this.dravingZoomEnd);
        }, this);
    },

    disableMapZoom: function () {
        if (this.map.doubleClickZoom) this.map.doubleClickZoom.disable();
        if (this.map.touchZoom) this.map.touchZoom.disable();
    },

    enableMapZoom: function () {
        if (!this.map.doubleClickZoom) this.map.doubleClickZoom.enable();
        if (!this.map.touchZoom) this.map.touchZoom.enable();
    },

    abortDrawing: function () {
        this.off('editable:vertex:mouseover editable:vertex:mouseout editable:middlemarker:mouseover editable:middlemarker:mouseout editable:vertex:drag editable:vertex:dragend editable:drawing:move editable:vertex:deleted', this.preMeasureCookLayer);
        this.off('editable:vertex:drag editable:vertex:dragend editable:drawing:move editable:vertex:mouseover editable:vertex:mouseout editable:middlemarker:mouseout editable:vertex:deleted', this.preMeasureCookLayer);
        this.off('editable:drawing:end', this.dravingLineEnd);
        this.off('editable:drawing:end', this.dravingPolygonEnd);
        this.enableMapZoom();
        this.stopDrawing();
    },

    startPolylineMeasure: function () {
        this.disableMapZoom();
        this.on('editable:vertex:mouseover editable:vertex:mouseout editable:middlemarker:mouseover editable:middlemarker:mouseout editable:vertex:drag editable:vertex:dragend editable:drawing:move editable:vertex:deleted', this.preMeasureCookLayer);
        this.on('editable:drawing:end', this.dravingLineEnd);
        L.Editable.prototype.startPolyline.call(this);
    },

    dravingLineEnd: function (e) {
        this.off('editable:drawing:move', this.preMeasureCookLayer);
        this.preMeasureCookLayer(e);
        this.enableMapZoom();
        this.map.on('zoomend', this.dravingZoomEnd);
    },

    startPolygonMeasure: function () {
        this.disableMapZoom();
        this.on('editable:vertex:drag editable:vertex:dragend editable:drawing:move editable:vertex:mouseover editable:vertex:mouseout editable:middlemarker:mouseout editable:vertex:deleted', this.preMeasureCookLayer);
        this.on('editable:drawing:end', this.dravingPolygonEnd);
        L.Editable.prototype.startPolygon.call(this);
    },

    dravingPolygonEnd: function (e) {
        this.off('editable:drawing:move', this.preMeasureCookLayer);
        this.preMeasureCookLayer(e);
        this.enableMapZoom();
        this.map.on('zoomend', this.dravingZoomEnd);
        this.on('editable:middlemarker:mouseover', this.preMeasureCookLineLayer);
    },

    dravingZoomEnd: function (e) {
        for (var o in e.target.measureTools.featuresLayer._layers) {
            e.layer = e.target.measureTools.featuresLayer._layers[o];
            if (e.layer.toGeoJSON().geometry.type === 'Polygon') {
                e.target.measureTools.preMeasureCookLayer(e);
            } else {
                e.target.measureTools.preMeasureCookLayer(e);
            }
        }
    },

    preMeasureCookLayer: function (e) {
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

    preMeasureCookLineLayer: function (e) {
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
            if (!layer._latlngs.length) return;
            var endingPoint = e.latlng;
            screenCords = e.layerPoint;
            newlatLngsArray.push(endingPoint);
        } else if (e.type === "editable:drawing:end" || e.type === "editable:vertex:deleted" || e.type === 'editable:vertex:dragend' || e.type === "editable:vertex:mouseout" || e.type === "editable:middlemarker:mouseout") {
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
        if (e.type === "zoomend" || e.type === "editable:vertex:deleted") {
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

    preMeasureCookPolygonLayer: function (e) {
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
        } else if (e.type === "editable:drawing:end" || e.type === "editable:vertex:deleted") {
            screenCords = this.map.latLngToContainerPoint(layer.getCenter());
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

        if (e.type === "zoomend" || e.type === "editable:vertex:mouseout" || e.type === "editable:vertex:deleted" || e.type === "editable:middlemarker:mouseout" || e.type === 'editable:vertex:dragend') {
            this.removeLabel(layer._leaflet_id);
            // даем про!"№;  дом
            setTimeout(() => {
                var array = $('.leaflet-map-pane').css('transform').replace('(', ',').replace(')', '').split(',');
                screenCords = this.map.latLngToContainerPoint(layer.getCenter());
                screenCords.x = screenCords.x - array[array.length - 2];
                screenCords.y = screenCords.y - array[array.length - 1];
                newlatLngsArray.push(latlngs[0][latlngs.length - 1]);
                this.removeLabel(layer._leaflet_id);
                screenCordsShift = true;
                this.createMouseMoveLabel({
                    pathLength: this._getPerimeter(newlatLngsArray),
                    pathSquare: this.getArea(newlatLngsArray),
                    screenCordsShift: screenCordsShift
                }, screenCords, layer._leaflet_id);
            }, 50);
        } else {
            this.removeLabel(layer._leaflet_id);
            this.createMouseMoveLabel({
                pathLength: this._getPerimeter(newlatLngsArray),
                pathSquare: this.getArea(newlatLngsArray),
                screenCordsShift: screenCordsShift
            }, screenCords, layer._leaflet_id);
        }

    },

    _getLineLatLngs: function (layer) {
        return layer.editor.getLatLngs();
    },

    getDistance: function (e) {
        return e.latlng1.distanceTo(e.latlng2);
    },

    _getPerimeter: function (latlngs) {
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

    getArea: function (latlngs) {
        var area = parseFloat((this.geodesicArea(latlngs)));
        return this.readableArea(area);
    },

    geodesicArea: function (latLngs) {
        var DEG_TO_RAD = 0.017453292519943295;
        var pointsCount = latLngs.length,
            area = 0.0,
            d2r = DEG_TO_RAD,
            p1, p2;

        if (pointsCount > 2) {
            for (var i = 0; i < pointsCount; i++) {
                p1 = latLngs[i];
                p2 = latLngs[(i + 1) % pointsCount];
                area += ((p2.lng - p1.lng) * d2r) *
                    (2 + Math.sin(p1.lat * d2r) + Math.sin(p2.lat * d2r));
            }
            area = area * 6378137.0 * 6378137.0 / 2.0;
        }

        return Math.abs(area);
    },

    readableDistance: function (distance) {
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

    readableArea: function (area) {
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

    createMouseMoveLabel: function (obj, screenCords, id) {
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
        const group = d3.select(`#label_group_measurment`).append('g').attr("class", 'measurment' + id);

        var rectangle = group.append("rect");
        var text = group.append('text')
            .attr("x", screenCords.x + 25 + dxShift)
            .attr("y", screenCords.y - 15 + dyShift)
            .attr("class", "measurment-label-text")
            .call(wrap, 180);

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
                    tspan = text.text(null)
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
                        tspan = text.append("tspan")
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
            .attr("class", "leaflet-measure-label-rectangle")
            .attr("width", rectangleWidth + 5)
            .attr("height", rectangleHeight)
            .attr("x", bbox.x - 5)
            .attr("y", bbox.y - 1)
            .style("fill", "white")
            .style("fill-opacity", 0.5)
            .style("stroke", "#1976d2")
            .style("stroke-width", "1px")
            .style("stroke-opacity", 1);
    },

    removeLabel: function (type) {
        var elem = $('.measurment' + type).remove();
    },

    checkAndClearAllLabels: function () {
        $("[class^='measurment']").remove();
    }
});