import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { BehaviorSubject } from "rxjs/BehaviorSubject";

import { MapService } from './MapService';

@Injectable()
export class OverLaysService {
    public visibleLayers = new BehaviorSubject<any>([]);
    public layers: any[];
    public layersIdsLabelNamesAndHttpOptions: any[];
    constructor(
        public _http: HttpClient,
        public MapService: MapService
    ) {
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
        this.layers = this.constructOverlayers();

        this.layersIdsLabelNamesAndHttpOptions = this.layers.map(item => ({
            id: item.options.id,
            labelName: item.options.labelName,
            visible: item.options.visible,
            featureInfoUrl: item.options.featureInfoUrl,
            featuresInfoUrl: item.options.featuresInfoUrl,
            schemaInfoUrl: item.options.schemaInfoUrl,
            featuresFilterUrl: item.options.featuresFilterUrl,
            dataApi: item.options.dataApi
        }))


    };

    addLayerToMap(layerId) {
        const layer = this.getLayerById(layerId);
        if (layer && !layer.options.visible) {
            layer.options.visible = true;
            layer.addTo(this.MapService.getMap());
            this.visibleLayers.next(this.visibleLayers.getValue().concat([layerId]))
        }
    };

    removeLayerFromMap(layerId) {
        const layer = this.getLayerById(layerId);
        if (layer) {
            layer.options.visible = false;
            layer.remove();
            this.visibleLayers.next(this.visibleLayers.getValue().filter(item => item === layerId ? false : item))
        }
    };

    refreshFilteredIds(layerId, arrayOfId) {
        const layer = this.getLayerById(layerId);
        layer.setFilteredIds(arrayOfId);
        layer.updateLabels();
    };

    removeFilteredIds = (layerId) => {
        const layer = this.getLayerById(layerId);
        layer.removeFilteredIds();
        layer.updateLabels();
    };

    removeFilteredIdForAllLayers = () => {
        this.layers.map(layer => {
            layer.removeFilteredIds();
            layer.updateLabels();
        });
    }

    getFeatureById = (layerId, id) => {
        const layer = this.getLayerById(layerId);
        let result;
        layer.eachLayer(layer => {
            if (layer.feature.properties.id === id) {
                result = layer;
            }
        });
        return result || null;
    };

    constructOverlayers() {
        return [new TDMap.Service.GeoJSONService({
            id: 'parcels',
            labelName: 'Земельные участки',
            visible: false,
            maxZoom: 24,
            minZoom: 10,
            dataApi: "api/parcels",
            dataUrl: "api/parcels/GetFeatures",
            featureInfoUrl: "api/parcels/GetFeatureInfo",
            featuresInfoUrl: "api/parcels/GetFeaturesInfo",
            schemaInfoUrl: "api/parcels/GetSchema",
            featuresFilterUrl: 'api/parcels/GetFeaturesByFilters',
            styled: false,
            labeled: false,
            selectable: true,
            selectionOptions: {
                multiple: false
            },
            style: {
                weight: 1.04,
                color: "#1B5E20",
                fillColor: "#388E3C",
                dashArray: "",
                opacity: 1.0,
                fillOpacity: 0.4,
                zIndex: 600
            }
        })]
    };

    getLayerById(id) {
        const filterLayers = this.layers.filter(item => item.options.id === id ? item : false)
        return filterLayers.length ? filterLayers[0] : null;
    };

    getLayerIdsAndLabelNames = () => this.layers.map(item => ({
        id: item.options.id,
        labelName: item.options.labelName,
        visible: item.options.visible
    }));

    getLayersIdsLabelNamesAndHttpOptions = () => this.layersIdsLabelNamesAndHttpOptions;

    getActiveOverlayLayersId = () => this.layers.filter(item => item.options.visible ? item : false)
        .map(item => item.options.id);

    getActiveOverlayLayersIdsAndLabelNames = () => this.layers.filter(item => item.options.visible ? item : false)
        .map(item => ({ id: item.options.id, labelName: item.options.labelName, visible: item.options.visible }));

    setTempSelectedFeature = (layerId, featureId) => {
        const layer = this.getLayerById(layerId);
        let feature;
        layer.eachLayer(layer => {
            if (layer.feature.properties.id === featureId) feature = layer;
        });
        if (layer.selections) layer.selections.setTempFeature(feature);

    }
}
