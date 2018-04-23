import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { HttpClient, HttpParams } from "@angular/common/http";
import { TDMapManagerConstructor, TDMapConstructor } from '../tdmap/TDMap'

@Injectable()
export class MapService {
    public TDMap: any;
    public TDMapManager: any;
    public mapReady = new BehaviorSubject<any>(false);
    constructor(public http: HttpClient) {
        this.TDMap = new TDMapConstructor();
        this.TDMapManager = new TDMapManagerConstructor();
        window.TDMap = this.TDMap;
        window.TDMapManager = this.TDMapManager;
    }

    createLeafletMap(mapElementId) {
        const mapOptions = {
            center: [60, 30],
            zoom: 12,
            editable: true,
            zoomControl: false,
            renderer: L.canvas()
        };
        const managerOptions = {
            memorize: true
        }

        TDMapManager.createLeafletMap("map", mapOptions, managerOptions);
        // переопределяем getPromise
        TDMap.Utils.Promises.getPromise = (url: string, requestParams: any) => {
            let params = new HttpParams();
            if (requestParams) {
                for (let key in requestParams) {
                    params = params.set(key, requestParams[key]);
                }
            }
            return this.http.get(url, { params });
        };

        this.mapReady.next(true);


    }

    getMap = () => this.TDMapManager._map;
}
