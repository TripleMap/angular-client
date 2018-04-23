export var GeoJSONProvider = L.Class.extend({
    initialize: function (dataUrl) {
        if (!dataUrl) {
            throw new Error("Не задан url для GeoJSONProvider");
        }
        this.dataUrl = dataUrl;
    },

    getDataByBounds: function (bounds, labelLayer, styleLayer) {
        let params: any = {};
        bounds instanceof L.LatLngBounds ? (params.bbox = this._getMinMaxBounds(bounds)) : (params.bbox = bounds);
        params.labeled = labelLayer || false;
        params.styled = styleLayer || false;
        return TDMap.Utils.Promises.getPromise(this.dataUrl, params);
    },

    getData: function (labelLayer, styleLayer) {
        let params: any = {};
        params.labeled = labelLayer || false;
        params.styled = styleLayer || false;
        return TDMap.Utils.Promises.getPromise(this.dataUrl, params);
    },

    _getMinMaxBounds: function (bounds) {
        let nw = bounds.getNorthWest();
        let se = bounds.getSouthEast();
        return [nw.lng, se.lat, se.lng, nw.lat].toString();
    }
});