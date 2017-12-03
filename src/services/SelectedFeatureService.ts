import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

@Injectable() export class SelectedFeatureService {
    public feature = new BehaviorSubject<any>(false);
    public selectedFeature = new BehaviorSubject<any>(false);
    public selectedFeatureTempStyle: any;
    public activeStyle = {
        weight: 3,
        color: '#F44336'
    };

    constructor() {}

    updateFeatureForInfo(feature) {
        this.selectedFeature.next(feature);
    }

    changeFeatureForInfoStyle() {
        this.selectedFeatureTempStyle = {
            weight: this.selectedFeature.getValue().feature.options.weight,
            color: this.selectedFeature.getValue().feature.options.color
        };
        this.selectedFeature.getValue().setStyle(this.activeStyle);
    }

    resetFeatureForInfoStyle = () => this.selectedFeature.getValue().feature.setStyle(this.selectedFeatureTempStyle);
    getFeatureInfoId = () => this.selectedFeature.getValue().feature.feature.properties.zu_id;

    setTempFeatureAndStyleId(feature) {
        let tempStyle = {
            weight: feature.options.weight,
            color: feature.options.color
        };
        feature.setStyle(this.activeStyle);
        this.feature.next(feature);
        setTimeout(() => this.selectedFeature.getValue().setStyle(tempStyle), 5000);
    }
}