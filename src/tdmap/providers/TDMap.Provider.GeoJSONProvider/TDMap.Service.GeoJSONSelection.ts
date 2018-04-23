import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { SelectionModel } from '@angular/cdk/collections';


export class GeoJSONSelection {
    public selectOptions: any = {
        activeStyle: {
            weight: 4,
            color: "#ff6d00"
        }
    };

    public options: any = {
        multiple: false,
    };

    public previousLayer: any[] = [];
    public selectedFeatures: SelectionModel<string> = new SelectionModel(true);
    public geoJSONLayer: any;
    public tempSelectedFeature: BehaviorSubject<any> = new BehaviorSubject(false);

    constructor(geoJSONLayer) {
        this.geoJSONLayer = geoJSONLayer;
        this.selectedFeatures.onChange.subscribe(featuresSelectionChange => {
            if (featuresSelectionChange.added && featuresSelectionChange.added.length) {
                let addedDictionary = {};
                featuresSelectionChange.added.map(item => { addedDictionary[`${item}`] = 1 })
                this.geoJSONLayer.eachLayer(layer => {
                    if (addedDictionary[layer.feature.properties.id]) this.setSelectionStyle(layer);
                })
            }
            if (featuresSelectionChange.removed && featuresSelectionChange.removed.length) {
                let removedDictionary = {};
                featuresSelectionChange.removed.map(item => { removedDictionary[`${item}`] = 1 })
                this.geoJSONLayer.eachLayer(layer => {
                    if (removedDictionary[layer.feature.properties.id]) this.removeSelectionLayer(layer);
                })
            }
        });
    }

    setSelectionStyle(layer) {
        if (!layer) return;
        layer.beforeSelectionStyle = {
            weight: layer.options.weight,
            color: layer.options.color
        };
        layer.setStyle(this.selectOptions.activeStyle);
    }

    removeSelectionLayer(layer) {
        if (layer.beforeSelectionStyle) layer.setStyle(layer.beforeSelectionStyle);
    }

    setTempFeature(feature) {
        if (!feature) return;

        let layer = feature.layer || feature
        let tempStyle = {
            weight: layer.options.weight,
            color: layer.options.color
        };

        layer.setStyle(this.options.activeStyle);
        this.tempSelectedFeature.next(layer);
        setTimeout(() => layer.setStyle(tempStyle), 3236);
    }
}
