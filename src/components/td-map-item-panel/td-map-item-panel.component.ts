import { Component, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { HttpParams, HttpClient } from "@angular/common/http";
import { OverLaysService } from "../../services/OverLaysService";
import { MapService } from "../../services/MapService";

import { Subject } from 'rxjs/subject'
import { Observable } from 'rxjs/observable'
import 'rxjs/add/operator/debounceTime.js';
import { Subscriber } from "rxjs/Subscriber";
interface AvaliableLayer {
  id: string;
  labelName: string;
  visible: boolean;
  displayedColumns: string[];
  columns: any[];
  selectedFeatures: any;
  total: number;
  visibleFeaturesPerPage: any;
  featureInfoUrl: string;
  featuresInfoUrl: string;
  schemaInfoUrl: string;
  featureFilterUrl: string;
  data: any;
  filteredList: any[];
  visibleFeatures: any[];
  tableFilterColumnsData: { column: string; values: any; }[];
  showOnlyFiltered: boolean;
  showOnlySelected: boolean;
}

@Component({
  selector: 'td-map-item-panel',
  templateUrl: './td-map-item-panel.component.html',
  styleUrls: ['./td-map-item-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TdMapItemPanelComponent implements AfterViewInit {
  public activeLayer: AvaliableLayer;
  public avaliableLayers: AvaliableLayer[];
  public subscriptions: object = {};
  public featuresFlow: any;
  public subscriberOnfeaturesFlow: any;
  public lastLayerId: any;
  public feature: any;
  constructor(
    public http: HttpClient,
    public OverLaysService: OverLaysService,
    public MapService: MapService,
    public changeDetectorRef: ChangeDetectorRef
  ) {
    this.featuresFlow = new Subject()
    this.subscriberOnfeaturesFlow = this.featuresFlow.asObservable()
      .debounceTime(100)
      .subscribe(data => this.getFeatureInfo(data));
  }

  ngAfterViewInit() {
    this.avaliableLayers = this.OverLaysService.getLayersIdsLabelNamesAndHttpOptions().map((item: AvaliableLayer) => {
      this.subscribeMapLayersOnFeatureSelectionsChange(item);
      this.getColumnNamesForLayer(item);
      return item;
    });
  }

  ngOnDestroy() {
    for (let key in this.subscriptions) {
      this.subscriptions[key].unsubscribe();
    }
  }

  subscribeMapLayersOnFeatureSelectionsChange(layer) {
    let maplayer = this.OverLaysService.getLayerById(layer.id);
    if (!maplayer && !maplayer.options.selectable) return;
    let subscriber = maplayer.changeSelection.subscribe(featureSelectionsEvent => {
      featureSelectionsEvent.added.map(featureId => { this.lastLayerId = featureSelectionsEvent.layerId; this.featuresFlow.next(featureId) });
    });
    this.subscriptions[`${layer.id}_subscribeMapLayersOnFeatureSelectionsChange`] = subscriber;
  }


  getFeatureInfo(featureId) {
    if (!featureId) return;
    this.activeLayer = this.avaliableLayers.filter(item => item.id === this.lastLayerId ? item : false)[0]
    if (!this.activeLayer) return;

    let params = new HttpParams().set('id', featureId);
    this.http.get(this.activeLayer.featureInfoUrl, { params }).subscribe((data) => {
      if (data) this.feature = data;
      this.changeDetectorRef.detectChanges();
    });
  }

  getColumnNamesForLayer(layer) {
    this.http.get(layer.schemaInfoUrl).subscribe((data: { properties: object; }) => {
      layer.columns = [];
      for (let key in data.properties) {
        if (key !== 'id' && key !== 'geometry') {
          layer.columns.push({
            name: key,
            label: data.properties[key].label || key,
            columnType: data.properties[key].columnType || 'findSimple',
            columnValues: data.properties[key].values || null,
            avaliableProperties: data.properties[key].avaliableProperties || null,
            currentProperties: data.properties[key].currentProperties || null,
            columnFilters: [],
            rowWidth: data.properties[key].columnType === 'findBoolean' ? 140 : 200
          });
        }
      }
      this.changeDetectorRef.markForCheck();
    });
  }
  linkDetector = (text: string) => (text && typeof text === 'string' && text.indexOf('http') > -1) ? true : false;

}
