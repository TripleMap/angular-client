import { Component, AfterViewInit, ChangeDetectionStrategy, OnInit, ChangeDetectorRef, AfterContentInit, ViewChild, ElementRef } from '@angular/core';
import { HttpParams, HttpClient } from "@angular/common/http";
import { OverLaysService } from "../../services/OverLaysService";
import { MapService } from "../../services/MapService";
import { MatTabHeader } from "@angular/material/tabs"
import { Subject } from 'rxjs/subject'
import { Observable } from 'rxjs/observable'
import 'rxjs/add/operator/debounceTime.js';
import { Subscriber } from "rxjs/Subscriber";
import { FormBuilder, FormGroup, FormArray, FormControl } from '@angular/forms';

interface AvaliableLayer {
  id: string;
  labelName: string;
  visible: boolean;
  attributeColumns: any[];
  featureInfoUrl: string;
  featuresInfoUrl: string;
  schemaInfoUrl: string;
  featureFilterUrl: string;
}

@Component({
  selector: 'td-map-item-panel',
  templateUrl: './td-map-item-panel.component.html',
  styleUrls: ['./td-map-item-panel.component.css']
})
export class TdMapItemPanelComponent implements OnInit, AfterViewInit {
  public activeLayer: AvaliableLayer;
  public avaliableLayers: AvaliableLayer[];
  public subscriptions: object = {};
  public featuresFlow: any;
  public subscriberOnfeaturesFlow: any;
  public lastLayerId: any;
  public feature: any;
  public cadFeature: any;
  public cadSchema: any[] = [];
  public editMode: boolean = false;
  public orderForm: FormGroup;
  public compareFn = (f1: any, f2: any) => f1 && f2 && f1.code === f2.code;

  @ViewChild('tabs', { read: ElementRef }) tabs: ElementRef;
  constructor(
    public http: HttpClient,
    public OverLaysService: OverLaysService,
    public MapService: MapService,
    public formBuilder: FormBuilder
  ) {
    this.featuresFlow = new Subject();
    this.subscriberOnfeaturesFlow = this.featuresFlow.asObservable()
      .debounceTime(100)
      .subscribe(data => this.getFeatureInfo(data));
  }

  ngOnInit() {
    this.orderForm = this.formBuilder.group({});
    this.orderForm.valueChanges.subscribe(data => console.log(data))
  }

  ngAfterViewInit() {
    this.avaliableLayers = this.OverLaysService.getLayersIdsLabelNamesAndHttpOptions().map((item) => {
      //ячейка памяти
      this.subscribeMapLayersOnFeatureSelectionsChange(item);
      this.getColumnNamesForLayer(item);
      return item
    });

    this.getCadColumnNamesForLayer();
    let header = this.tabs.nativeElement.getElementsByTagName('mat-tab-header')[0];
    header.style.width = 'calc(100% - 48px)';
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
    this.activeLayer = this.avaliableLayers.filter(item => item.id === this.lastLayerId ? item : false)[0];
    if (!this.activeLayer) return;

    let params = new HttpParams().set('id', featureId);
    this.http.get(this.activeLayer.featureInfoUrl, { params }).subscribe((data) => {
      if (data) this.feature = data;
    });
    this.http.get('api/parcelscad/GetFeatureInfo', { params }).subscribe((data) => {
      if (data) this.cadFeature = data;
    });
  }

  getColumnNamesForLayer(layer) {
    this.http.get(layer.schemaInfoUrl).subscribe((data: { properties: object; }) => {
      layer.attributeColumns = [];
      let localStorageOrder = window.localStorage.getItem(`attributesOrderForLayer_${layer.id}`);
      if (localStorageOrder) {
        let localStorageOrderArray = localStorageOrder.split(',');
        for (let i = 0; i < localStorageOrderArray.length; i++) {
          for (let key in data.properties) {
            if (key !== 'id' && key !== 'geometry' && localStorageOrderArray[i] === key) {
              layer.attributeColumns.push({
                name: key,
                label: data.properties[key].label || key,
                columnType: data.properties[key].columnType || 'findSimple',
                columnValues: data.properties[key].values || null,
                avaliableProperties: data.properties[key].avaliableProperties || null,
                currentProperties: data.properties[key].currentProperties || null,
                tableType: data.properties[key].tableType,
                dataLength: data.properties[key].dataLength
              });
            }
          }
        }
        let notInOrderKeys = [];
        for (let notInOrderKey in data.properties) {
          if (notInOrderKey !== 'id' && notInOrderKey !== 'geometry' && localStorageOrderArray.indexOf(notInOrderKey) === -1) {
            notInOrderKeys.push(notInOrderKey);
          }
        }
        if (notInOrderKeys.length > 0) {
          for (let index = 0; index < notInOrderKeys.length; index++) {
            layer.attributeColumns.push({
              name: notInOrderKeys[index],
              label: data.properties[notInOrderKeys[index]].label || notInOrderKeys[index],
              columnType: data.properties[notInOrderKeys[index]].columnType || 'findSimple',
              columnValues: data.properties[notInOrderKeys[index]].values || null,
              avaliableProperties: data.properties[notInOrderKeys[index]].avaliableProperties || null,
              currentProperties: data.properties[notInOrderKeys[index]].currentProperties || null,
              tableType: data.properties[notInOrderKeys[index]].tableType,
              dataLength: data.properties[notInOrderKeys[index]].dataLength
            });
          }
        }

      } else {
        for (let key in data.properties) {
          if (key !== 'id' && key !== 'geometry') {
            layer.attributeColumns.push({
              name: key,
              label: data.properties[key].label || key,
              columnType: data.properties[key].columnType || 'findSimple',
              columnValues: data.properties[key].values || null,
              avaliableProperties: data.properties[key].avaliableProperties || null,
              currentProperties: data.properties[key].currentProperties || null,
              tableType: data.properties[key].tableType,
              dataLength: data.properties[key].dataLength
            });
          }
        }
      }
      for (let i = 0; i < layer.attributeColumns.length; i++) {
        let control = new FormControl();
        this.orderForm.addControl(`${layer.attributeColumns[i].name}`, control);
      }
    });
  }

  getCadColumnNamesForLayer() {
    this.http.get('api/parcelscad/GetSchema').subscribe((data: { properties: object; }) => {
      this.cadSchema = [];
      for (let key in data.properties) {
        if (key !== 'id' && key !== 'center' && key !== 'extent') {
          this.cadSchema.push({
            name: key,
            label: data.properties[key].label || key,
            columnType: data.properties[key].columnType || 'findSimple'
          });
        }
      }
    });
  }

  linkDetector = (text: string) => (text && typeof text === 'string' && text.indexOf('http') > -1) ? true : false;

  toggleEditMode() {
    for (let i = 0; i < this.activeLayer.attributeColumns.length; i++) {
      let control = new FormControl();
      this.orderForm.addControl(`${this.activeLayer.attributeColumns[i].name}`, control);
    }
    this.editMode = !this.editMode;
  }
  updateOrder() {
    let order = this.activeLayer.attributeColumns.map(item => item.name);
    window.localStorage.setItem(`attributesOrderForLayer_${this.activeLayer.id}`, order.toString());
  }

  some(feature) {
    console.log(feature)
  }

}
