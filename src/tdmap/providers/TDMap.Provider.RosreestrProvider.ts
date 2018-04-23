var Rosreestr = L.TileLayer.extend({
    options: {
        tileSize: 256,
        dpi: 96,
        f: 'image',
        transparent: true,
        format: 'png32',
        bboxSR: '3857',
        imageSR: '3857'
    },

    _needInitInteraction: true,

    getTileUrl: function(tilePoint) {
        var map = this._map,
            crs = map.options.crs,
            tileSize = this.options.tileSize,
            nwPoint = tilePoint.multiplyBy(tileSize),
            sePoint = nwPoint.add([tileSize, tileSize]);

        var nw = crs.project(map.unproject(nwPoint, tilePoint.z)),
            se = crs.project(map.unproject(sePoint, tilePoint.z)),
            bbox = [nw.x, se.y, se.x, nw.y].join(',');

        var paramsString =  L.Util.getParamString({
            bbox: bbox,
            dpi: this.options.dpi,
            f : this.options.f,
            transparent: this.options.transparent, 
            format: this.options.format,
            bboxSR: this.options.bboxSR, 
            imageSR:this.options.imageSR, 
            size: `${this.options.tileSize},${this.options.tileSize}`,
            layers: this.options.layers
        }, this._url);

        return this._url + paramsString;
    },

    onAdd: function(map) {
        L.TileLayer.prototype.onAdd.call(this, map);
        if (this.options.clickable) {
            L.DomUtil.addClass(this._container, 'leaflet-clickable-raster-layer');
            if (this._needInitInteraction) {
                this._initInteraction();
                this._needInitInteraction = false;
            }
        }
    },

    _initInteraction: function() {
        var div = this._container,
            events = ['dblclick', 'click', 'mousedown', 'mouseover', 'mouseout', 'contextmenu'];

        for (var i = 0; i < events.length; i++) {
            L.DomEvent.on(div, events[i], this._fireMouseEvent, this);
        }
    },
    _fireMouseEvent: function(e) {
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


L.tileLayer.rosreestr = function(url, options) {
    return new Rosreestr(url, options);
};

export var RosreestrProvider = Rosreestr;