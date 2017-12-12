import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { HttpClient } from "@angular/common/http";
import { BaseLayersService } from "./BaseLayersService";
import { OverLaysService } from "./OverLaysService";

@Injectable()
export class MapService {
    map: any;
    constructor(
        public _baseLayersService: BaseLayersService,
        public _overLayService: OverLaysService
    ) {}

    createLeafletMap(mapElementId) {
        this.map = L.map(mapElementId, {
            editable: true,
            center: [59.95, 30.21],
            zoom: 11,
            zoomControl: false
        });
        this._baseLayersService.setMap(this.map);
        this._overLayService.setMap(this.map);
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
            this.map.setView([lat, lng], zoom);
        }

        let saveMapState = () => {
            window.localStorage.setItem("MAP_STATE_ZOOM", this.map.getZoom());
            window.localStorage.setItem("MAP_STATE_COORDINATES_LAT",this.map.getCenter().lat);
            window.localStorage.setItem("MAP_STATE_COORDINATES_LNG",this.map.getCenter().lng);
        };

        window.addEventListener("beforeunload", saveMapState);

        this._overLayService.addLayerToMap();
    }

    getMap = () => this.map;
    updateMapPosition = (latLng: any, zoom: number) => {
        this.map.setView(latLng, zoom);
    };
}
