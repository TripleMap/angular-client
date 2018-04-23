export class BaseManager {
    public _map: any;
    public options: any;
    constructor() { }

    createLeafletMap(mapDivId, mapOptions, managerOptions) {
        this.options = managerOptions;
        this._map = L.map(mapDivId, mapOptions);
        if (managerOptions && managerOptions.memorize) {
            this.restoreMapPosition();
        }
    }

    restoreMapPosition() {
        let zoom, lat, lng;

        const zoomState = window.localStorage.getItem("MAP_STATE_ZOOM");
        const latState = window.localStorage.getItem("MAP_STATE_COORDINATES_LAT");
        const lngState = window.localStorage.getItem("MAP_STATE_COORDINATES_LNG");

        if (zoomState) {
            zoom = Number(zoomState);
        }

        if (latState && lngState) {
            lat = Number(latState);
            lng = Number(lngState);
        }

        if (zoom && lat && lng) {
            this._map.setView([lat, lng], zoom);
        }

        let saveMapState = () => {
            window.localStorage.setItem("MAP_STATE_ZOOM", this._map.getZoom());
            window.localStorage.setItem("MAP_STATE_COORDINATES_LAT", this._map.getCenter().lat);
            window.localStorage.setItem("MAP_STATE_COORDINATES_LNG", this._map.getCenter().lng);
        };

        window.addEventListener("beforeunload", saveMapState);
    }

    updateMapPosition(latLng, zoom) {
        this._map.setView(latLng, zoom);
        return this;
    }
}