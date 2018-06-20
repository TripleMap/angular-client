import { GeoJSONSelection } from "./TDMap.Service.GeoJSONSelection";
import { GeoJSONProvider } from "./TDMap.Service.GeoJSONProvider";
import { GeoJSONLabelLayer } from "./TDMap.Service.GeoJSONLabel";
import { Subject } from "rxjs";
import 'rxjs/add/operator/map';

// export interface LayerSchema {
//     id: string;
//     layer_name: string;
//     layer_schema: {
//         name: string;
//         schema: string;
//         table: string;
//         options: Layer;
//     },
//     properties: any
// }

export var GeoJSONService = L.GeoJSON.extend({

    initialize: function (options, schemaProperties) {
        this.schemaProperties = schemaProperties;
        L.setOptions(this, options);
        L.GeoJSON.prototype.initialize.call(this, null, options);
        this._provider = new GeoJSONProvider(options.dataUrl);
        this._lablelLayer = new GeoJSONLabelLayer(this, options.labelUrl);
        this.filteredIds = null;
        this.featuresFlow = new Subject();
        this._processFeatures();
        this.selections = new GeoJSONSelection(this);
    },

    setStyled: function () {
        this.styled = true
    },

    removeStyles: function () {
        this.styled = false
    },

    setLabeled: function (labelProperties) {
        this._lablelLayer.canLabel = true;
        this.labelProperties = labelProperties;
        if (this.options.visible) {
            this._lablelLayer.addLabels(labelProperties);
        }
    },

    removeLabels: function () {
        this._lablelLayer.canLabel = false;
        this._lablelLayer.removeLabels();
    },

    onAdd: function (map) {
        this._map = map;

        L.GeoJSON.prototype.onAdd.call(this, map);
        this._updateData();
        if (!this.options.onceLoaded) {
            this._map.on("moveend", this._updateData, this);
        }
        this._lablelLayer.canLabel = true;
    },

    onRemove: function (map) {
        this.clearLayers();
        this.removeLabels();
        this._lablelLayer.canLabel = false;
        L.GeoJSON.prototype.onRemove.call(this, map);
        if (!this.options.onceLoaded) {
            map.off("moveend", this._updateData, this);
        }
    },

    _updateData: function (e) {
        if (!this.options.onceLoaded) {
            let bbox;
            this.options.bounds || this.options.circle ?
                (bbox = this.options.bounds || this.options.circle) :
                (bbox = this._map.getBounds());

            let zoom = this._map.getZoom();

            if (zoom > this.options.maxZoom || zoom < this.options.minZoom) {
                this.clearLayers();
                return;
            }

            this._updateDataByBounds(bbox);
        } else {
            this._updateDataWithoutBounds();
        }
    },

    _updateDataByBounds: function (bbox) {
        this._provider
            .getDataByBounds(bbox)
            .map(res => this.filterData(res))
            .subscribe(
                filtered => {
                    this.featuresFlow.next(filtered);
                    if (this._lablelLayer.canLabel && this.labelProperties) this._lablelLayer.addLabels(this.labelProperties);
                },
                error => this.clearLayers()
            );
    },

    _updateDataWithoutBounds: function () {
        this._provider
            .getData()
            .map(res => this.filterData(res))
            .subscribe(
                filtered => {
                    this.featuresFlow.next(filtered);
                    if (this._lablelLayer.canLabel && this.labelProperties) this._lablelLayer.addLabels(this.labelProperties);
                },
                error => this.clearLayers()
            );
    },
    _processFeatures: function () {
        this.featuresFlow
            .map(features => this._replaceData(features))
            .subscribe();
    },

    filterData: function (data) {
        if (!this.filteredIds) return data.features;
        if (this.filteredIds.length === 0) return [];

        return data.features.filter(item => {
            return this.filteredIds.indexOf(item.properties.id) === -1 ? false : item
        });
    },

    _replaceData: function (features) {
        this.clearLayers();
        if (!features) return;

        for (let i = features.length - 1; i >= 0; i--) {
            this.addData(features[i]);
        }

        if (this._map) this._map.fire("layer:load");
        this.subscribeOnSelection();
    },

    subscribeOnSelection: function () {
        if (this.options.selectable) {
            this.selections.selectedFeatures
            this.eachLayer(layer => {
                if (this.selections.selectedFeatures.isSelected(layer.feature.properties.id)) this.selections.setSelectionStyle(layer);
            });

            this.on('click', this.addSelections, this);
            this._map.doubleClickZoom.disable();
            this.on('dblclick', this.clearSelections, this);
        }
    },

    addSelections: function (event) {
        let featureId;
        if (event.layer.feature && event.layer.feature.properties && event.layer.feature.properties.id) featureId = event.layer.feature.properties.id;
        if (!featureId) return;
        let isSelected = this.selections.selectedFeatures.isSelected(featureId);
        if (!(event.originalEvent && event.originalEvent.ctrlKey)) {
            this.selections.selectedFeatures.clear();
        } else {
            if (isSelected) this.selections.selectedFeatures.deselect(featureId);
        }
        if (isSelected) return;
        this.selections.selectedFeatures.select(featureId);
    },

    clearSelections: function (event) {
        this.selections.selectedFeatures.clear();
    },

    setFilteredIds: function (arrayOfIdOrNull) {
        this.filteredIds = arrayOfIdOrNull;
        this._updateData();
    },

    stayOrRemoveViaFilteredIds: function () {
        this.eachLayer(layer => {
            if (this.filteredIds.indexOf(layer.feature.properties.id) === -1) {
                layer._path.style.visibility = "hidden";
            } else {
                if (layer._path.style.visibility === "hidden") {
                    layer._path.style.visibility = "visible";
                }
            }
        });
        return this;
    },

    removeFilteredIds: function () {
        this.filteredIds = null;
        this._updateData();
        return this;
    }
});

export var geoJSONService = function (options) {
    return new GeoJSONService(options);
};