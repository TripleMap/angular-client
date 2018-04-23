import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { MapService } from './MapService';
import { AuthService } from '../auth/auth-service';

export const LayersLinks = {
    getLayersByUserId: (userId) => `api/accounts/userLayers/${userId}`,
    dataApi: () => "api/layers",
    schemaInfoUrl: (layerId) => `api/layers/GetGeoJSONLayerSchemaWithData?LayerId=${layerId}`,
    featuresFilterUrl: (layerId) => `api/layers/GetFeaturesByFilters?LayerId=${layerId}`,
    featuresEdit: {
        getAllGeo: (layerId) => `api/layers/GetGeoJSONFeatures?LayerId=${layerId}`,
        getAllInfo: (layerId) => `api/layers/GetJSONFeatures?LayerId=${layerId}`,
        getInfo: (layerId, feautureId) => `api/layers/GetJSONFeature?LayerId=${layerId}&FeatureId=${feautureId}`,
        create: (layerId) => `api/layers/CreateJSONFeature?LayerId=${layerId}`,
        updateById: (layerId, feautureId) => `api/layers/UpdateJSONFeature?LayerId=${layerId}&id=${feautureId}`,
        deleteById: (layerId, feautureId) => `api/layers/DeleteJSONFeature?LayerId=${layerId}&id=${feautureId}`
    },
    additionalCharacters: {
        getAll: (layerId, feautureId) => `api/layers/GetAdditionalCharacters?LayerId=${layerId}&FeatureId=${feautureId}`,
        getById: (layerId, additionalCharacterId) => `api/layers/GetAdditionalCharacter?LayerId=${layerId}&id=${additionalCharacterId}`,
        create: (layerId, feautureId) => `api/layers/CreateAdditionalCharacter?LayerId=${layerId}&FeatureId=${feautureId}`,
        updateById: (layerId, additionalCharacterId) => `api/layers/UpdateAdditionalCharacter?LayerId=${layerId}&id=${additionalCharacterId}`,
        deleteById: (layerId, additionalCharacterId) => `api/layers/DeleteAdditionalCharacter?LayerId=${layerId}&id=${additionalCharacterId}`
    }
}

export interface LayerOptions {
    id: string;
    dataUrl: string;
    labelName: string;
    visible: boolean;
    maxZoom: number;
    minZoom: number;
    onceLoaded: boolean;
    styled: boolean;
    labeled: boolean;
    selectable: boolean;
    selectionOptions: {
        multiple: boolean;
    },
    style: any;
}

export interface LayerSchema {
    id: string;
    layer_name: string;
    layer_schema: {
        name: string;
        labelName: string;
        schema: string;
        table: string;
        options: LayerOptions;
        properties: { any };
    },
}

@Injectable()
export class OverLaysService {
    public visibleLayers: BehaviorSubject<any[]> = new BehaviorSubject<any>([]);
    public layersChange: BehaviorSubject<any> = new BehaviorSubject<any>(0);
    public layersSchemas: LayerSchema[] = [];
    public leafletLayers: any[] = [];
    constructor(
        public http: HttpClient,
        public MapService: MapService,
        public AuthService: AuthService
    ) {
        this.constructOverlayers();
    };

    constructOverlayers() {
        this.http.get(LayersLinks.getLayersByUserId(this.AuthService.getUserId()))
            .subscribe((layers: LayerSchema[]) => {
                this.leafletLayers = layers.map(layer => {
                    layer.layer_schema.options.id = layer.id;
                    layer.layer_schema.options.dataUrl = LayersLinks.featuresEdit.getAllGeo(layer.id);
                    return new TDMap.Service.GeoJSONService(layer.layer_schema.options);
                });
                this.layersSchemas = layers;
                this.layersChange.next(1);
            });
    };

    addLayerToMap(layerId) {
        const layer = this.getLeafletLayerById(layerId);
        const layerSchema = this.getLayerById(layerId);
        if (layer && !layer.options.visible) {
            layer.options.visible = true;
            layerSchema.layer_schema.options.visible = true;
            layer.addTo(this.MapService.getMap());
            this.visibleLayers.next(this.visibleLayers.getValue().concat([layerId]))
        }
    };

    removeLayerFromMap(layerId) {
        const layer = this.getLeafletLayerById(layerId);
        const layerSchema = this.getLayerById(layerId);
        if (layer) {
            layer.options.visible = false;
            layerSchema.layer_schema.options.visible = true;
            layer.remove();
            this.visibleLayers.next(this.visibleLayers.getValue().filter(item => item === layerId ? false : item))
        }
    };

    refreshFilteredIds(layerId, arrayOfId) {
        const layer = this.getLeafletLayerById(layerId);
        layer.setFilteredIds(arrayOfId);
        layer.updateLabels();
    };

    removeFilteredIds = (layerId) => {
        const layer = this.getLeafletLayerById(layerId);
        layer.removeFilteredIds();
        layer.updateLabels();
    };

    removeFilteredIdForAllLayers = () => {
        this.leafletLayers.map(layer => {
            layer.removeFilteredIds();
            layer.updateLabels();
        });
    }

    getFeatureById = (layerId, id) => {
        const layer = this.getLeafletLayerById(layerId);
        let result;
        layer.eachLayer(layer => {
            if (layer.feature.properties.id === id) result = layer;
        });
        return result || null;
    };

    getLeafletLayerById(id) {
        const filterLayers = this.leafletLayers.filter(item => item.options.id === id ? item : false);
        return filterLayers.length ? filterLayers[0] : null;
    };

    getLayerById(id) {
        const filterLayers = this.layersSchemas.filter(item => item.id === id ? item : false);
        return filterLayers.length ? filterLayers[0] : null;
    };

    getActiveOverlayLayersId = () => this.leafletLayers.filter(item => item.options.visible ? item : false).map(item => item.options.id);
    setTempSelectedFeature = (layerId, featureId) => {
        const layer = this.getLeafletLayerById(layerId);
        let feature;
        layer.eachLayer(layer => {
            if (layer.feature.properties.id === featureId) feature = layer;
        });
        if (layer.selections) layer.selections.setTempFeature(feature);
    }
}
