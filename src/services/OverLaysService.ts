import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { SelectedFeatureService } from "./SelectedFeatureService";
import { BehaviorSubject } from "rxjs/BehaviorSubject";

@Injectable()
export class OverLaysService {
    public mainLayer: any;
    public baseMainLayerOptions: any;

    constructor(
        public _selectedFeatureService: SelectedFeatureService,
        public _http: HttpClient
    ) {
        this.changeProtoTDMapGetPromise();
    }

    changeProtoTDMapGetPromise() {
        // переопределяем getPromise
        TDMap.Utils.Promises.getPromise = (url: string, requestParams: any) => {
            let params = new HttpParams();
            if (requestParams) {
                for (let key in requestParams) {
                    params = params.set(key, requestParams[key]);
                }
            }

            return this._http.get(url, { params });
        };
    }

    addLayerToMap(map) {
        if (this.mainLayer) {
            this.mainLayer.remove();
            this.mainLayer = null;
        }

        this.mainLayer = new TDMap.Service.GeoJSONService({
            maxZoom: 24,
            minZoom: 10,
            dataUrl: "api/parcels/GetFeatures",
            styled: false,
            labeled: false,
            selectable: true,
            style: {
                weight: 1.04,
                color: "#1B5E20",
                fillColor: "#388E3C",
                dashArray: "",
                opacity: 1.0,
                fillOpacity: 0.4,
                zIndex: 600
            }
        });
        this.mainLayer.addTo(map);
    }

    refreshFilteredIds(arrayOfId) {
        this.mainLayer.setFilteredIds(arrayOfId);
        this.mainLayer.updateLabels();
    }
    removeFilteredIds = arrayOfId => this.mainLayer.removeFilteredIds();

    getFeatureById = id => {
        let result;
        this.mainLayer.eachLayer(layer => {
            if (layer.feature.properties.zu_id === id) {
                result = layer;
            }
        });
        return result || null;
    };
}
