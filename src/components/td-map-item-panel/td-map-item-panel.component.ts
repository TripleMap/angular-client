import { Component, AfterViewInit, ChangeDetectionStrategy, OnInit, ChangeDetectorRef, AfterContentInit, ViewChild, ElementRef } from '@angular/core';
import { HttpParams, HttpClient } from "@angular/common/http";
import { OverLaysService } from "../../services/OverLaysService";
import { MapService } from "../../services/MapService";
import { MatTabHeader } from "@angular/material/tabs"
import { Subject } from 'rxjs/subject'
import { Observable } from 'rxjs/observable'
import 'rxjs/add/operator/debounceTime.js';
import { Subscriber } from "rxjs/Subscriber";
import { FormBuilder, FormGroup, FormArray, FormControl, Validators } from '@angular/forms';

interface AvaliableLayer {
  id: string;
  labelName: string;
  visible: boolean;
  attributeColumns: any[];
  featureInfoUrl: string;
  featuresInfoUrl: string;
  schemaInfoUrl: string;
  featureFilterUrl: string;
  dataApi: string;
}

//// TO DO pipe to null if empty
//// TO DO validetions 


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
  public saveEnable: boolean = true;
  public differentBetweenInputDataAndInspectFeature: boolean = false;
  public orderForm: FormGroup;
  public subscriberOnOrderForm: any;
  public compareFn = (f1: any, f2: any) => f1.code === f2.code;

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
    this.subscriberOnOrderForm = this.orderForm.valueChanges
      .debounceTime(300)
      .filter(this.isValidForm)
      .map(this.pipeFiltersToNumber)
      .map(this.detectOnEditFeatureDifferents.bind(this))
      .subscribe(data => { console.log(data) })
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


  toggleEditMode() {
    this.editMode = !this.editMode;
    if (!this.editMode) return;
    this.resetFormControl();
  }

  clearFormControls() {
    for (let control in this.orderForm.controls) {
      this.orderForm.removeControl(control)
    }
  }

  resetFormControl() {
    this.clearFormControls();
    this.addControls(this.activeLayer);
  }

  addControls(layer) {
    for (let i = 0; i < layer.attributeColumns.length; i++) {
      let fatureValue = this.feature[`${layer.attributeColumns[i].name}`];
      let validators = this.addvalidators(layer.attributeColumns[i])
      let control = new FormControl(fatureValue, validators);
      this.orderForm.addControl(`${layer.attributeColumns[i].name}`, control);
    }
  }


  addvalidators(column) {
    let validators = [];

    if (column.userFilling) validators.push(Validators.required);

    if (column.columnType === 'findNumber') {
      if (column.length) validators.push(Validators.max(column.length));
      if (column.tableType === 'double') validators.push(Validators.pattern("^[0-9]{1,20}([,.][0-9]{0,20})?$"));
      if (column.tableType === 'integer') validators.push(Validators.pattern("^[0-9]{1,20}?$"));
    }
    if (column.columnType === 'findSimple') {
      if (column.length && column.tableType === 'varchar') validators.push(Validators.max(column.length));

    }

    return validators;
  }


  getFormControl(formControlName) {
    return this.orderForm.get(formControlName);
  }

  isValidForm = () => {
    this.orderForm.status === "VALID" ? this.saveEnable = true : this.saveEnable = false;
    return this.orderForm.status === "VALID"
  }

  saveData() {
    if (this.saveEnable && this.differentBetweenInputDataAndInspectFeature) {
      let editResult = this.detectOnEditFeatureDifferents(this.orderForm.value);
      if (!editResult.differentColumns.length) return;

      let puthObj = {};
      for (let index = 0; index < editResult.differentColumns.length; index++) {
        const column = editResult.differentColumns[index];
        puthObj[column] = editResult.data[column];
      }
      this.findManyAndFindOneCodesBeforeSave(puthObj)
      this.http.patch(`${this.activeLayer.dataApi}?id=${this.feature.id}`, puthObj).subscribe(data => console.log(data));
    }
  }

  findManyAndFindOneCodesBeforeSave(savedItem) {
    for (let columnName in savedItem) {
      for (let i = 0; i < this.activeLayer.attributeColumns.length; i++) {
        let attributeColumn = this.activeLayer.attributeColumns[i];
        if (attributeColumn.name === columnName && (attributeColumn.columnType === 'findOne' || attributeColumn.columnType === 'findMany') && savedItem[columnName].length > 0) {
          savedItem[columnName] = savedItem[columnName].map(item => item.code);
        }
      }
    }
  }

  pipeFiltersToNumber = data => {
    for (let i = 0; i < this.activeLayer.attributeColumns.length; i++) {
      const column = this.activeLayer.attributeColumns[i];

      if (column.columnType === 'findSimple' || column.columnType === 'findDate') {
        if (data[column.name] === "") data[column.name] = null;
      }
      if (column.columnType === 'findNumber') {
        data[column.name] = data[column.name] ? Number(data[column.name].replace(",", ".")) : null;
      }
    }

    return data;
  };

  detectOnEditFeatureDifferents(data) {
    if (!this.editMode) return;
    let differents = false;
    let differentColumns = [];
    for (let index = 0; index < this.activeLayer.attributeColumns.length; index++) {
      let column = this.activeLayer.attributeColumns[index];
      let columnName = column.name;

      if (this.feature.hasOwnProperty(columnName) && data.hasOwnProperty(columnName)) {
        if (column.columnType === 'findSimple' || column.columnType === 'findBoolean' || column.columnType === 'findDate' || column.columnType === 'findNumber') {
          if (this.feature[columnName] !== data[columnName]) {
            differentColumns.push(columnName);
            differents = true;
          }
        }
        if (column.columnType === 'findOne' || column.columnType === 'findMany') {
          if (!data[columnName] && !this.feature[columnName]) {
          } else if (!data[columnName] && this.feature[columnName] || data[columnName] && !this.feature[columnName]) {
            differents = true;
            differentColumns.push(columnName);
          } else {
            if (data[columnName].length !== this.feature[columnName].length) {
              differents = true;
              differentColumns.push(columnName);
            } else {
              let codesInData = {};
              for (let i = 0; i < data[columnName].length; i++) {
                codesInData[data[columnName][i]] = 1;
              }
              for (let i = 0; i < this.feature[columnName].length; i++) {
                if (!codesInData[this.feature[columnName][i]]) {
                  differentColumns.push(columnName);
                  differents = true;
                }
              }
            }
          }
        }
      }
    }

    this.differentBetweenInputDataAndInspectFeature = differents;
    if (differents) this.saveEnable = true;
    return { data, differentColumns };
  }

  getCadColumnNamesForLayer() {
    this.http.get('api/parcelcads/GetSchema').subscribe((data: { properties: object; }) => {
      this.cadSchema = [];
      for (let key in data.properties) {
        if (key !== 'id' && key !== 'center' && key !== 'extent') {
          this.cadSchema.push({
            name: key,
            label: data.properties[key].description || key,
            columnType: data.properties[key].columnType || 'findSimple'
          });
        }
      }
    });
  }
  subscribeMapLayersOnFeatureSelectionsChange(layer) {
    let maplayer = this.OverLaysService.getLayerById(layer.id);
    if (!maplayer && !maplayer.options.selectable) return;
    this.subscriptions[`${layer.id}_subscribeMapLayersOnFeatureSelectionsChange`] = maplayer.changeSelection.subscribe(featureSelectionsEvent => {
      featureSelectionsEvent.added.map(featureId => { this.lastLayerId = featureSelectionsEvent.layerId; this.featuresFlow.next(featureId) });
    });
  }

  getFeatureInfo(featureId) {
    this.editMode = false;
    this.clearFormControls();

    if (!featureId) return;
    this.activeLayer = this.avaliableLayers.filter(item => item.id === this.lastLayerId ? item : false)[0];
    if (!this.activeLayer) return;
    let params = new HttpParams().set('id', featureId);
    this.http.get(this.activeLayer.featuresInfoUrl, { params }).subscribe((data) => {
      if (data) this.feature = data[0];
    });
    this.http.get('api/parcelcads/GetFeaturesInfo', { params }).subscribe((data) => {
      if (data) this.cadFeature = data[0];
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
              layer.attributeColumns.push(this.accumulateAttributeColumn(data, key));
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
            layer.attributeColumns.push(this.accumulateAttributeColumn(data, notInOrderKeys[index]));
          }
        }

      } else {
        for (let key in data.properties) {
          if (key !== 'id' && key !== 'geometry') {
            layer.attributeColumns.push(this.accumulateAttributeColumn(data, key));
          }
        }
      }
    });
  }

  accumulateAttributeColumn(data, key) {
    return {
      name: key,
      label: data.properties[key].description || key,
      columnType: data.properties[key].columnType || 'findSimple',
      columnValues: data.properties[key].values || null,
      avaliableProperties: data.properties[key].avaliableProperties || null,
      currentProperties: data.properties[key].currentProperties || null,
      tableType: data.properties[key].tableType,
      dataLength: data.properties[key].length,
      userFilling: data.properties[key].userFilling
    }
  }

  updateOrder() {
    let order = this.activeLayer.attributeColumns.map(item => item.name);
    window.localStorage.setItem(`attributesOrderForLayer_${this.activeLayer.id}`, order.toString());
  }

  linkDetector = (text: string) => (text && typeof text === 'string' && text.indexOf('http') > -1) ? true : false;

  ngOnDestroy() {
    for (let key in this.subscriptions) {
      this.subscriptions[key].unsubscribe();
    }
    this.subscriberOnOrderForm.unsubscribe();
    this.subscriberOnfeaturesFlow.unsubscribe();
  }
}
