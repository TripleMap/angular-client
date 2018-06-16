import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject } from "rxjs";
import { MapService } from './MapService';
import { AuthService } from '../auth/auth-service';

export const LayersLinks = {
    getLayersByUserId: (userId) => `api/Accounts/userlayers?id=${userId}`,
    dataApi: () => "api/Layers",
    schemaInfoUrl: (layerId) => `api/Layers/GetGeoJSONLayerSchemaWithData?LayerId=${layerId}`,
    featuresFilterUrl: (layerId) => `api/Layers/GetFeaturesByFilters?LayerId=${layerId}`,
    featuresEdit: {
        getAllGeo: (layerId) => `api/Layers/GetGeoJSONFeatures?LayerId=${layerId}`,
        getFeatureGeoJSONById: (layerId, feautureId) => `api/Layers/GetGeoJSONFeature?LayerId=${layerId}&FeatureId=${feautureId}`,
        getAllInfo: (layerId) => `api/Layers/GetJSONFeatures?LayerId=${layerId}`,
        getInfo: (layerId, feautureId) => `api/Layers/GetJSONFeature?LayerId=${layerId}&FeatureId=${feautureId}`,
        create: (layerId, withCadastralData) => `api/Layers/CreateJSONFeature?LayerId=${layerId}&withCadastralData=${withCadastralData}`,
        updateById: (layerId, feautureId) => `api/Layers/UpdateJSONFeature?LayerId=${layerId}&id=${feautureId}`,
        updateByIds: (layerId) => `api/Layers/UpdateJSONFeatures?LayerId=${layerId}`,
        removeByIds: (layerId, feauturesId) => `api/Layers/RemoveGeoJSONFeature?LayerId=${layerId}&FeaturesId=${feauturesId}`,
        updateFeatureGeometryById: (layerId, feautureId) => `api/Layers/UpdateFeatureGeometry?LayerId=${layerId}&id=${feautureId}`,
    },
    featuresLabel: {
        getAllData: (layerId) => `api/Layers/GetLayerFeaturesLables?LayerId=${layerId}`,
        getUserLabels: () => `api/Layers/GetLables?`,
        createUserLabel: () => `api/Layers/CreateLables?`,
        deleteUserLabel: (labelId) => `api/Layers/DeleteLables?LabelId=${labelId}`,
        updateUserLabel: (labelId) => `api/Layers/UpdateLables?LabelId=${labelId}`,
    },
    cadastralDataEdit: {
        create: (layerId, featureId) => `api/Layers/CreateFeatureCadastralInfo?LayerId=${layerId}&FeatureId=${featureId}`,
        updateByCn: (layerId, cadastralNumber) => `api/Layers/UpdateFeatureCadastralInfo?LayerId=${layerId}&cn=${cadastralNumber}`,
        deleteById: (layerId, feautureId) => `api/Layers/DeleteJSONFeature?LayerId=${layerId}&id=${feautureId}`,
    },
    additionalCharacters: {
        getAll: (layerId, feautureId) => `api/Layers/GetAdditionalCharacters?LayerId=${layerId}&FeatureId=${feautureId}`,
        getById: (layerId, additionalCharacterId) => `api/Layers/GetAdditionalCharacter?LayerId=${layerId}&id=${additionalCharacterId}`,
        create: (layerId, feautureId) => `api/Layers/CreateAdditionalCharacter?LayerId=${layerId}&FeatureId=${feautureId}`,
        updateById: (layerId, additionalCharacterId) => `api/Layers/UpdateAdditionalCharacter?LayerId=${layerId}&id=${additionalCharacterId}`,
        deleteById: (layerId, additionalCharacterId) => `api/Layers/DeleteAdditionalCharacter?LayerId=${layerId}&id=${additionalCharacterId}`
    },
    events: {
        getAll: (layerId, feautureId) => `api/Layers/GetEvents?LayerId=${layerId}&FeatureId=${feautureId}`,
        getById: (layerId, eventId) => `api/Layers/GetEvent?LayerId=${layerId}&EventId=${eventId}`,
        create: (layerId, feautureId) => `api/Layers/CreateEvent?LayerId=${layerId}&FeatureId=${feautureId}`,
        updateById: (layerId, eventId) => `api/Layers/UpdateEvent?LayerId=${layerId}&EventId=${eventId}`,
        deleteById: (layerId, eventId) => `api/Layers/DeleteEvent?LayerId=${layerId}&EventId=${eventId}`
    }
}

export interface LayerOptions {
    id: string;
    dataUrl: string;
    labelUrl: string;
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
                    layer.layer_schema.options.labelUrl = LayersLinks.featuresLabel.getAllData(layer.id);
                    this.MapService.getMap().createPane(layer.id);
                    return new TDMap.Service.GeoJSONService(layer.layer_schema.options, layer.layer_schema.properties);
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

            const setContrast = (e) => e.layer.setStyle({ fillOpacity: 0.9 });
            const setPlain = (e) => e.layer.setStyle({ fillOpacity: 0.4 });
            layer.on('mouseover', setContrast)
            layer.on('mouseout', setPlain)

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


