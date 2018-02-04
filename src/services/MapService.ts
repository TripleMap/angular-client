import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { HttpClient } from "@angular/common/http";


@Injectable()
export class MapService {
    public TDMap: any;
    public TDMapManager: any;
    public mapReady = new BehaviorSubject<any>(false);
    constructor() { }

    createLeafletMap(mapElementId) {
        this.TDMap = TDMap;
        const mapOptions = {
            center: [60, 30],
            zoom: 12,
            editable: true,
            zoomControl: false
        };
        const managerOptions = {
            memorize: true
        }
        this.TDMapManager = new TDMapManager("map", mapOptions, managerOptions);
        window.TDMapManager = this.TDMapManager;
        this.mapReady.next(true);
    }

    getMap = () => this.TDMapManager._map;
}
