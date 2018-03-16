import { Component, Inject, AfterViewInit, ChangeDetectionStrategy, OnInit, ChangeDetectorRef, AfterContentInit, ViewChild, ElementRef } from '@angular/core';
import { HttpParams, HttpClient } from "@angular/common/http";
import { OverLaysService } from "../../services/OverLaysService";
import { MapService } from "../../services/MapService";
import { MatTabHeader } from "@angular/material/tabs"
import { Subject } from 'rxjs/subject'
import { Observable } from 'rxjs/observable'
import 'rxjs/add/operator/debounceTime.js';
import { Subscription } from 'rxjs/Subscription';
import { FormBuilder, FormGroup, FormArray, FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'confirm-dialog',
  template: `
      <div mat-dialog-content>
        <p>Удалить дополнительный атрибут?</p>
      </div>
      <div mat-dialog-actions>
        <button mat-button color="accent" (click)="no()" cdkFocusInitial>Отмена</button>
        <button mat-button color="accent" (click)="yes()">Да</button>
      </div>`
}) export class ConfirmRemoveDialodDialog {
  constructor(public dialogRef: MatDialogRef<ConfirmRemoveDialodDialog>) { }
  no = () => this.dialogRef.close(false);
  yes = () => this.dialogRef.close(true);
}



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
//// TO DO validations 

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
  public differentBetweenInputDataAndAdditionalFeature: boolean = false;
  public orderForm: FormGroup;
  public subscriberOnOrderForm: any;
  public additionalForm: FormGroup;
  public subscriberOnAdditionalForm: any;
  public featureAdditionalCharacters: any[];
  public compareFn = (f1: any, f2: any) => f1.code === f2.code;
  public onSaveMessageSubject: Subject<any>;
  public onSaveSubscriber: Subscription;

  @ViewChild('tabs', { read: ElementRef }) tabs: ElementRef;
  constructor(
    public http: HttpClient,
    public OverLaysService: OverLaysService,
    public MapService: MapService,
    public formBuilder: FormBuilder,
    public snackBar: MatSnackBar,
    public MatDialog: MatDialog
  ) {
    this.featuresFlow = new Subject();
    this.subscriberOnfeaturesFlow = this.featuresFlow.asObservable()
      .debounceTime(100)
      .subscribe(data => this.getFeatureInfo(data));
  }

  ngOnInit() {
    this.orderForm = this.formBuilder.group({});
    this.additionalForm = this.formBuilder.group({});
    this.subscriberOnOrderForm = this.orderForm.valueChanges
      .debounceTime(300)
      .filter(this.isValidForm)
      .map(this.pipeFiltersToNumber)
      .map(this.detectOnEditFeatureDifferents.bind(this))
      .subscribe();

    this.subscriberOnAdditionalForm = this.additionalForm.valueChanges
      .debounceTime(300)
      .map(this.detectOnEditAdditionalFeatureDifferents.bind(this))
      .subscribe();

    this.onSaveMessageSubject = new Subject();
    this.onSaveSubscriber = this.onSaveMessageSubject.debounceTime(300).subscribe(success => {
      this.succesOnSave('Атрибуты обновлены');
    }, error => {
      this.errorOnSave('Ошибка при обновлении атрибутов');
    });
  }


  ngAfterViewInit() {
    this.avaliableLayers = this.OverLaysService.getLayersIdsLabelNamesAndHttpOptions().map((item) => {
      this.subscribeMapLayersOnFeatureSelectionsChange(item);
      this.getColumnNamesForLayer(item);
      return item
    });
    this.getCadColumnNamesForLayer();
    let header = this.tabs.nativeElement.getElementsByTagName('mat-tab-header')[0];
    header.style.width = 'calc(100% - 48px)';
  }

  succesOnSave(message) {
    this.snackBar.open(message, null, {
      duration: 2000,
      panelClass: ['success-snack'],
      horizontalPosition: 'right',
      verticalPosition: 'bottom'
    });
  }

  warnOnSave(message) {
    this.snackBar.open(message, null, {
      duration: 3000,
      panelClass: ['warn-snack'],
      horizontalPosition: 'right'
    });
  }

  errorOnSave(message) {
    this.snackBar.open(message, null, {
      duration: 3000,
      panelClass: ['error-snack'],
      horizontalPosition: 'right'
    });
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
    for (let control in this.additionalForm.controls) {
      this.orderForm.removeControl(control)
    }
  }

  resetFormControl() {
    this.clearFormControls();

    this.addFeatureAttributesControls(this.activeLayer);

    this.featureAdditionalCharacters.map(item => {
      this.addAdditionalCharactersControls(item);
    });

  }

  addFeatureAttributesControls(layer) {
    for (let i = 0; i < layer.attributeColumns.length; i++) {
      let fatureValue;
      (layer.attributeColumns[i].columnType === 'findDate') ?
        fatureValue = new Date(this.feature[`${layer.attributeColumns[i].name}`])
        : fatureValue = this.feature[`${layer.attributeColumns[i].name}`];


      let validators = this.addvalidators(layer.attributeColumns[i])
      let control = new FormControl(fatureValue, validators);
      this.orderForm.addControl(`${layer.attributeColumns[i].name}`, control);
    }
  }

  addAdditionalCharactersControls(item) {
    this.additionalForm.addControl(this.generateFeatureAdditionalCharactersFormControlName(item.id, 'name'), new FormControl(item.character_name));
    this.additionalForm.addControl(this.generateFeatureAdditionalCharactersFormControlName(item.id, 'value'), new FormControl(item.character_value));
  }
  generateFeatureAdditionalCharactersFormControlName = (id, subName) => `${id}_${subName}`;

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

    if (!this.saveEnable) {
      this.warnOnSave('Проверьте корректность введеных данных');
    }

    if (this.saveEnable && this.differentBetweenInputDataAndInspectFeature) {
      let editResult = this.detectOnEditFeatureDifferents(this.orderForm.value);
      if (!editResult.differentColumns.length) return;

      let patchObj = {};
      for (let index = 0; index < editResult.differentColumns.length; index++) {
        const column = editResult.differentColumns[index];
        patchObj[column] = editResult.data[column];
      }
      this.findManyAndFindOneCodesBeforeSave(patchObj);
      this.findDatesMomentBeforeSave(patchObj);
      this.http.post(`${this.activeLayer.dataApi}/update/?where={"id":"${this.feature.id}"}`, patchObj)
        .subscribe(data => { this.onSaveMessageSubject.next(1); this.getInfo(this.feature.id); }, error => this.onSaveMessageSubject.error(1));
    }

    if (this.saveEnable && this.differentBetweenInputDataAndAdditionalFeature) {
      let additionalResult = this.detectOnEditAdditionalFeatureDifferents(this.additionalForm.value);
      for (let i = 0; i < additionalResult.differentAdditionalIds.length; i++) {
        const id = additionalResult.differentAdditionalIds[i];
        for (let additionalIndex = this.featureAdditionalCharacters.length - 1; additionalIndex >= 0; additionalIndex--) {
          let element = this.featureAdditionalCharacters[additionalIndex];
          if (element.id === id) {
            if (element.removed) {
              this.featureAdditionalCharacters.splice(additionalIndex, 1);
              this.http.delete(`api/ParcelsAdditionalCharacters/${element.id}`).subscribe(data => this.onSaveMessageSubject.next(1), error => this.onSaveMessageSubject.error(1));
            } else if (element.added) {
              let addedObject = {
                character_name: this.additionalForm.get(`${element.id}_name`).value,
                character_value: this.additionalForm.get(`${element.id}_value`).value,
                parcel_id: this.feature.id,
                user_id: ''
              }
              this.http.post(`api/ParcelsAdditionalCharacters`, addedObject).subscribe((data: any) => {
                element.id = data.id;
                element.character_name = data.character_name;
                element.character_value = data.character_value;
                element.parcel_id = data.parcel_id;
                element.user_id = data.user_id;
                delete element.added;
                this.onSaveMessageSubject.next(1);
              }, error => this.onSaveMessageSubject.error(1));
            } else if (element.updated && !element.added && !element.removed) {
              let putchObject = {
                character_name: this.additionalForm.get(`${element.id}_name`).value,
                character_value: this.additionalForm.get(`${element.id}_value`).value,
              }
              this.http.post(`api/ParcelsAdditionalCharacters/update/?where={"id":"${element.id}"}`, putchObject).subscribe(data => {
                this.onSaveMessageSubject.next(1);
                element.character_name = putchObject.character_name;
                element.character_value = putchObject.character_value;
                delete element.updated;
              }, error => this.onSaveMessageSubject.error(1));
            }
          }
        }
      }
    }
    this.toggleEditMode();
  }

  findManyAndFindOneCodesBeforeSave(savedItem) {
    for (let columnName in savedItem) {
      for (let i = 0; i < this.activeLayer.attributeColumns.length; i++) {
        let attributeColumn = this.activeLayer.attributeColumns[i];
        if (attributeColumn.name === columnName && attributeColumn.columnType === 'findOne' && !savedItem[columnName]) {
          savedItem[columnName] = null;
        } else if (attributeColumn.name === columnName && (attributeColumn.columnType === 'findOne' || attributeColumn.columnType === 'findMany') && savedItem[columnName].length > 0) {
          savedItem[columnName] = savedItem[columnName].map(item => item.code);
        }
      }
    }
  }

  findDatesMomentBeforeSave(savedItem) {
    for (let columnName in savedItem) {
      for (let i = 0; i < this.activeLayer.attributeColumns.length; i++) {
        let attributeColumn = this.activeLayer.attributeColumns[i];
        if (attributeColumn.name === columnName && attributeColumn.columnType === 'findDate') {
          console.log(savedItem[columnName]);
          console.log(savedItem[columnName].valueOf());
          savedItem[columnName] = savedItem[columnName].valueOf();
        }
      }
    }
  }

  pipeFiltersToNumber = data => {
    for (let i = 0; i < this.activeLayer.attributeColumns.length; i++) {
      const column = this.activeLayer.attributeColumns[i];

      if (column.columnType === 'findSimple' || column.columnType === 'findDate') {
        if (this.feature[column.name] === "") this.feature[column.name] = null;
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
        if (column.columnType === 'findSimple') {
          if (this.feature[columnName] !== data[columnName]) {
            differentColumns.push(columnName);
            differents = true;
          }
        }
        if (column.columnType === 'findBoolean' || column.columnType === 'findNumber') {
          if (this.feature[columnName] !== data[columnName]) {
            differentColumns.push(columnName);
            differents = true;
          }
        }
        if (column.columnType === 'findDate') {
          if (this.feature[columnName] !== new Date(data[columnName]).getTime()) {
            differentColumns.push(columnName);
            differents = true;
          }
        }
        if (column.columnType === 'findOne') {
          if (!data[columnName] && !this.feature[columnName]) { }
          else if (!data[columnName] && this.feature[columnName] || data[columnName] && !this.feature[columnName]) {
            differents = true;
            differentColumns.push(columnName);
          } else if (data[columnName].code !== this.feature[columnName].code) {
            differents = true;
            differentColumns.push(columnName);
          }
        }
        if (column.columnType === 'findMany') {
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

  detectOnEditAdditionalFeatureDifferents(data) {
    if (!this.editMode) return;
    let differents = false;
    let differentAdditionalIds = [];
    for (let i = 0; i < this.featureAdditionalCharacters.length; i++) {
      const element = this.featureAdditionalCharacters[i];
      if (element.added || element.removed) {
        differentAdditionalIds.push(element.id);
        differents = true;
      } else {
        let elementNameChange = element.character_name !== data[`${element.id}_name`];
        let elementValueChange = element.character_value !== data[`${element.id}_value`];
        if (elementNameChange || elementValueChange) {
          element.updated = true;
          differentAdditionalIds.push(element.id);
          differents = true;
        } else {
          if (element.updated) {
            delete element.updated;
          }
        }
      }
    }
    this.differentBetweenInputDataAndAdditionalFeature = differents;
    if (differents) this.saveEnable = true;
    return { data: this.featureAdditionalCharacters, differentAdditionalIds };
  }

  removeAdditionalItem(item) {
    this.MatDialog.open(ConfirmRemoveDialodDialog, {
      width: '250px'
    }).afterClosed()
      .subscribe(confirm => {
        if (confirm) { item.removed = true; this.differentBetweenInputDataAndAdditionalFeature = true; }
      });
  }

  addAdditionalItem() {
    const guid = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1) + '-' + Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    const newAdditionalCharacter = {
      id: guid(),
      character_name: ``,
      character_value: ``,
      parcel_id: this.feature.id,
      user_id: '',
      added: true
    }

    this.featureAdditionalCharacters.push(newAdditionalCharacter);
    this.addAdditionalCharactersControls(newAdditionalCharacter);
    this.differentBetweenInputDataAndAdditionalFeature = true;
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
    this.getInfo(featureId);
    this.getCadInfo(featureId);
    this.getAdditionalCharacters(featureId);
  }

  getInfo(featureId) {
    let params = new HttpParams().set('id', featureId);
    this.http.get(this.activeLayer.featuresInfoUrl, { params }).subscribe((data) => {
      if (data) this.feature = data[0];
    }, error => this.errorOnSave('Ошибка при получении атрибутов'));
  }

  getCadInfo(featureId) {
    let params = new HttpParams().set('id', featureId);
    this.http.get('api/parcelcads/GetFeaturesInfo', { params }).subscribe((data) => {
      if (data) this.cadFeature = data[0];
    }, error => this.errorOnSave('Ошибка при получении кадастровых атрибутов'));
  }

  getAdditionalCharacters(featureId) {
    let params = new HttpParams().set('filter', JSON.stringify({ "where": { 'parcel_id': featureId } }));
    this.http.get('api/ParcelsAdditionalCharacters/', { params }).subscribe((data: any[]) => {
      if (data) this.featureAdditionalCharacters = data;
    }, error => this.errorOnSave('Ошибка при получении дополнительных атрибутов'));
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
    this.onSaveSubscriber.unsubscribe();
  }
}
