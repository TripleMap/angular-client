import { Injectable } from '@angular/core';
import { OverLaysService } from './OverLaysService'
import { SelectionModel } from '@angular/cdk/collections';

interface AvaliableSelectionLayer {
    id: string;
    labelName: string;
    visible: boolean;
    selectedFeatures: any;
    featureInfo: string;
    schemaInfo: string;
}

@Injectable() export class SelectionLayersService {
    public avaliableSelectionLayers: AvaliableSelectionLayer[];

    constructor(public OverLaysService: OverLaysService) {

        this.avaliableSelectionLayers = this.OverLaysService.getLayersIdsLabelNamesAndHttpOptions().map((item: AvaliableSelectionLayer) => {
            item.selectedFeatures = new SelectionModel(true);
            item.selectedFeatures.onChange.subscribe(data => {
                this.updateMapLayerOnFeatureSelectionChange(data, item);
            });
            this.subscribeMapLayersOnFeatureSelectionsChange(item);
            return item;
        });

        this.OverLaysService.visibleLayers.subscribe(layerIdsUpdate => {
            this.avaliableSelectionLayers.map(item => layerIdsUpdate.indexOf(item.id) !== -1 ? item.visible = true : item.visible = false);
        });
    }


    getLayersSubscribers() {
        return this.avaliableSelectionLayers;
    }


    subscribeMapLayersOnFeatureSelectionsChange(layer) {
        const maplayer = this.OverLaysService.getLayerById(layer.id);
        if (!maplayer && !maplayer.selections) return;

        maplayer.selections.changeSelection.subscribe(featureSelectionsEvent => {
            if (featureSelectionsEvent.added && featureSelectionsEvent.added.length) {
                featureSelectionsEvent.added.map(feature => {
                    if (!layer.selectedFeatures.isSelected(feature.feature.properties.id)) {
                        layer.selectedFeatures.select(feature.feature.properties.id)
                    }
                });
            }

            if (featureSelectionsEvent.removed && featureSelectionsEvent.removed.length) {
                featureSelectionsEvent.removed.map(feature => {
                    if (layer.selectedFeatures.isSelected(feature.feature.properties.id)) {
                        layer.selectedFeatures.deselect(feature.feature.properties.id)
                    }
                });
            }
        });

    }

    updateMapLayerOnFeatureSelectionChange(selectionChangeDataEvent, layer) {
        const mapLayer = this.OverLaysService.getLayerById(layer.id);
        if (!mapLayer && !mapLayer.selections) return;

        selectionChangeDataEvent.added.map(item => {
            mapLayer.eachLayer(feature => {
                if (!mapLayer.selections.isInSelections(feature) && feature.feature && feature.feature.properties && feature.feature.properties.id === item) {
                    mapLayer.selections.addSelections(feature, false, true);
                }
            });
        });

        selectionChangeDataEvent.removed.map(item => {
            mapLayer.eachLayer(feature => {
                if (feature.feature && feature.feature.properties && feature.feature.properties.id === item) {
                    mapLayer.selections.removeSelectionLayer(feature);
                }
            })

        });
    }



}