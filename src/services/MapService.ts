import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { HttpClient } from "@angular/common/http";
import { OverLaysService } from "./OverLaysService";

@Injectable()
export class MapService {
    public TDMap: any;
    public TDMapManager: any;
    constructor(public OverLaysService: OverLaysService) {}

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
        this.OverLaysService.addLayerToMap(this.TDMapManager._map);
    }

    getMap = () => this.TDMapManager._map;
}
