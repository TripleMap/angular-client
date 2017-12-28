import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { HttpClient } from "@angular/common/http";

import { TDMap } from "../../external/TDMap.min.js";
import { TDMapManager } from "../../external/TDMap.min.js";

@Injectable()
export class MapService {
    public TDMap: TDMap;
    public TDMapManager: TDMapManager;
    constructor() {}

    createLeafletMap(mapElementId) {
        this.TDMap = TDMap;
        this.TDMapManager = new TDMapManager({
            mapDivId: 'map',
            center: [60,30],
            zoom: 12,
            editable: true,
            zoomControl: false,
            memorize: true,
        });
    }

    getMap=()=> this.TDMapManager._map
}
