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
        this.TDMapManager = new TDMapManager({
            mapDivId: "map",
            center: [60, 30],
            zoom: 12,
            editable: true,
            zoomControl: false,
            memorize: true
        });
        window.TDMapManager = this.TDMapManager;
        this.mapReady.next(true);
    }

    getMap = () => this.TDMapManager._map;
}
