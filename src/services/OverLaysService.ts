import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { SelectedFeatureService } from "./SelectedFeatureService";

@Injectable()
export class OverLaysService {
    public map: any;
    public mainLayer: any;
    public baseMainLayerOptions: any;

    constructor(
        public _selectedFeatureService: SelectedFeatureService,
        public _http: HttpClient
    ) {
        this.baseMainLayerOptions = {
            maxZoom: 24,
            minZoom: 10,
            dataUrl: "api/parcels/GetFeatures",
            styled: false,
            labeled: false,
            style: {
                weight: 1.04,
                color: "#1B5E20",
                fillColor: "#388E3C",
                dashArray: "",
                opacity: 1.0,
                fillOpacity: 0.4,
                zIndex: 600
            }
        };
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

    setMap = (map: any) => (this.map = map);
    subscribeLayerClick = feature =>
        this._selectedFeatureService.updateFeatureForInfo(feature);

    addLayerToMap() {
        if (this.mainLayer) {
            this.mainLayer.off("tdmap:layer:click", this.subscribeLayerClick);
            this.mainLayer.remove();
            this.mainLayer = null;
        }


        this.mainLayer = new TDMap.Service.GeoJSONServiceLayer(
            this.baseMainLayerOptions
        );
        console.log(this.mainLayer);
        this.mainLayer.addTo(this.map);
        this.mainLayer.on("tdmap:layer:click", this.subscribeLayerClick);

        //this.mainLayer.on('ERROR', function (e) {
        //    that.showToast(e.message);
        //});
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
