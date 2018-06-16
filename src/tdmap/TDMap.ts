// utils
import { GeoUtil } from "./utils/TDMap.Utils.GeoUtil.js";
import { Promises } from "./utils/TDMap.Utils.Promises.js";

// tools
import { MeasurmentUtils, Measurment } from "./tools/TDMap.Tools.Measurment.js";
import { SpatialFilterUtils, SpatialFilter } from "./tools/TDMap.Tools.SpatialFilter.js";
import { PulseMarker, IconPulse } from "./tools/TDMap.Tools.PulseMarker.js";

// routing
import { Routing } from "./routing/TDMap.Routing.Router.js";

// services
import { GeoJSONService } from "./providers/TDMap.Provider.GeoJSONProvider/TDMap.Service.GeoJSONService.js";

// layers
import { GoogleProvider } from "./providers/TDMap.Provider.GoogleProvider.js";
import { YandexProvider } from "./providers/TDMap.Provider.YandexProvider.js";
import { RosreestrProvider } from "./providers/TDMap.Provider.RosreestrProvider.js";

// cadastralUtils
import { CadastralSearchDataService } from './cadastralTools/TDMap.CadastralTools.DataService.js';

// complete
export class TDMapConstructor {
    public Service: any;
    public Layers: any;
    public Tools: any;
    public Utils: any;
    public CadastralUtils: any;
    public Routing: any;
    constructor() {
        this.Service = {
            GeoJSONService
        };
        this.Layers = {
            GoogleProvider,
            YandexProvider,
            RosreestrProvider
        };
        this.Tools = {
            MeasurmentUtils,
            Measurment,
            SpatialFilterUtils,
            SpatialFilter,
            IconPulse,
            PulseMarker
        };
        this.Utils = {
            GeoUtil,
            Promises
        };
        this.CadastralUtils = {
            CadastralSearchDataService
        }
        this.Routing = Routing;
    }
}

// manager 
// import { BaseManager } from "./mapping/TDMap.Mapping.Manager.js";

/*
 	params {
		mapDivId: divid,
	{	center: [number, number]
		zoom: number,
		editable: boolean,
		zoomControl: boolea,}

		{memorize: boolean}
	}
*/
export class TDMapManagerConstructor {
    public _map: any;
    public options: any;
    constructor() { }

    createLeafletMap(mapDivId, mapOptions, managerOptions) {
        this.options = managerOptions;
        this._map = L.map(mapDivId, mapOptions);
        if (managerOptions && managerOptions.memorize) {
            this.restoreMapPosition();
            this._map.on('moveend', this.updateHashOnPositionChange.bind(this));
            window.addEventListener('hashchange', this.updatePositionOnHashChange.bind(this));
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

        let hash = window.location.hash;
        let hashParams = this.parseHash(hash);

        if (hashParams) {
            lat = hashParams.center[0];
            lng = hashParams.center[1];
            zoom = hashParams.zoom;
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


    parseHash(hash) {
        if (hash.indexOf('#') === 0) hash = hash.substr(1);

        const hashParams = hash.split("/");
        if (hashParams.length === 3) {
            let zoom = parseInt(hashParams[2], 10),
                lat = parseFloat(hashParams[0]),
                lng = parseFloat(hashParams[1]);

            return (isNaN(zoom) || isNaN(lat) || isNaN(lng)) ? false : { center: [lat, lng], zoom };
        } else {
            return false;
        }
    }

    updatePositionOnHashChange(e) {
        let hash = window.location.hash;
        let hashParams = this.parseHash(hash);

        let center, zoom;
        if (hashParams) {
            center = hashParams.center;
            zoom = hashParams.zoom;
            this._map.setView(center, zoom);
        }
    }

    updateHashOnPositionChange() {
        let newHash;
        let zoom = this._map.getZoom();
        let center = this._map.getCenter();

        if (zoom && center.lat && center.lng) newHash = `#${center.lat}/${center.lng}/${zoom}`;
        if (newHash) window.location.hash = newHash;

    }

    updateMapPosition(latLng, zoom) {
        this._map.setView(latLng, zoom);
        return this;
    }
}