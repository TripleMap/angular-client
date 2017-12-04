import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { HttpClient } from "@angular/common/http";
import { SelectedFeatureService } from "./SelectedFeatureService";

@Injectable()
export class OverLaysService {
    public activeOverLayer = new BehaviorSubject<any>(false);
    public map: any;
    public mainLayer: any;
    public styles: any;
    public labels: any;
    public baseMainLayerOptions: any;

    constructor(
        public _selectedFeatureService: SelectedFeatureService,
        public _http: HttpClient
    ) {
        this.baseMainLayerOptions = {
            maxZoom: 24,
            minZoom: 12,
            dataUrl: "http://188.134.5.249:3000/api/zusklads/geoJSON",
            styled: false,
            labeled: false,
            style: {
                weight: 1.04,
                color: "#1B5E20",
                fillColor: "#4CAF50",
                dashArray: "",
                opacity: 1.0,
                fillOpacity: 0.6,
                zIndex: 600
            }
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
        this.mainLayer = new TDMap.Service.GeoJSONServiceLayer(this.baseMainLayerOptions);
        this.mainLayer.addTo(this.map);
        this.baseMainLayerOptions.styled ? this.mainLayer.setStyles(this.styles) : this.mainLayer.removeStyles();
        this.baseMainLayerOptions.labeled ? this.mainLayer.setLabels(this.labels) : this.mainLayer.removeLabels();
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
}
